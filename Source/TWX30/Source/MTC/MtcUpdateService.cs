using System.Diagnostics;
using System.Globalization;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MTC;

internal enum MtcUpdateCheckStatus
{
    UpdateAvailable,
    UpToDate,
    Failed,
    Skipped,
}

internal sealed record MtcUpdateCheckResult(
    MtcUpdateCheckStatus Status,
    string Message,
    string CurrentVersion,
    string? AvailableVersion = null,
    string? DisplayVersion = null,
    string? DownloadUrl = null,
    string? AssetName = null,
    string? NotesUrl = null);

internal sealed class MtcUpdateService
{
    private static readonly HttpClient Http = new()
    {
        Timeout = TimeSpan.FromSeconds(15),
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public static bool IsAutomaticCheckDue(AppPreferences prefs, DateTimeOffset now)
    {
        if (!prefs.UpdateChecksEnabled)
            return false;

        string cadence = AppPreferences.NormalizeUpdateCadence(prefs.UpdateCadence);
        if (cadence == AppPreferences.UpdateCadenceManual)
            return false;

        if (cadence == AppPreferences.UpdateCadenceStartup)
            return true;

        DateTimeOffset? last = prefs.UpdateLastCheckUtc;
        if (last == null)
            return true;

        TimeSpan interval = cadence == AppPreferences.UpdateCadenceWeekly
            ? TimeSpan.FromDays(7)
            : TimeSpan.FromDays(1);
        return now.ToUniversalTime() - last.Value.ToUniversalTime() >= interval;
    }

    public static async Task<MtcUpdateCheckResult> CheckAsync(
        AppPreferences prefs,
        bool force,
        CancellationToken cancellationToken)
    {
        if (!force && !prefs.UpdateChecksEnabled)
            return new MtcUpdateCheckResult(MtcUpdateCheckStatus.Skipped, "Update checks are disabled.", MtcVersion.PackageVersion);

        DateTimeOffset now = DateTimeOffset.UtcNow;
        if (!force && !IsAutomaticCheckDue(prefs, now))
            return new MtcUpdateCheckResult(MtcUpdateCheckStatus.Skipped, "Update check is not due yet.", MtcVersion.PackageVersion);

        string manifestUrl = AppPreferences.NormalizeUpdateManifestUrl(prefs.UpdateManifestUrl);
        try
        {
            using var response = await Http.GetAsync(manifestUrl, cancellationToken).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();
            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
            var manifest = await JsonSerializer.DeserializeAsync<MtcUpdateManifest>(stream, JsonOptions, cancellationToken).ConfigureAwait(false);
            if (manifest == null || manifest.Releases.Count == 0)
                return FailAndStamp(prefs, now, "Update manifest did not contain any releases.");

            string lane = AppPreferences.NormalizeUpdateLane(prefs.UpdateLane);
            if (!manifest.Releases.TryGetValue(lane, out MtcUpdateRelease? release) || release == null)
                return FailAndStamp(prefs, now, $"Update manifest does not contain a '{lane}' release.");

            string platform = GetCurrentPlatformKey();
            if (!release.Assets.TryGetValue(platform, out MtcUpdateAsset? asset) || asset == null || string.IsNullOrWhiteSpace(asset.Url))
                return FailAndStamp(prefs, now, $"Update manifest has no installer for {platform}.");

            prefs.UpdateLastCheckUtc = now;
            prefs.Save();

            if (!IsNewerVersion(release.Version, MtcVersion.PackageVersion))
            {
                string current = string.IsNullOrWhiteSpace(release.DisplayVersionOrVersion)
                    ? MtcVersion.DisplayVersion
                    : release.DisplayVersionOrVersion;
                return new MtcUpdateCheckResult(
                    MtcUpdateCheckStatus.UpToDate,
                    $"MTC is up to date ({current}).",
                    MtcVersion.PackageVersion,
                    release.Version,
                    release.DisplayVersionOrVersion);
            }

            return new MtcUpdateCheckResult(
                MtcUpdateCheckStatus.UpdateAvailable,
                $"{release.DisplayVersionOrVersion} is available for {platform}.",
                MtcVersion.PackageVersion,
                release.Version,
                release.DisplayVersionOrVersion,
                asset.Url,
                string.IsNullOrWhiteSpace(asset.Name) ? null : asset.Name,
                string.IsNullOrWhiteSpace(release.NotesUrl) ? null : release.NotesUrl);
        }
        catch (OperationCanceledException)
        {
            return new MtcUpdateCheckResult(MtcUpdateCheckStatus.Skipped, "Update check was canceled.", MtcVersion.PackageVersion);
        }
        catch (Exception ex)
        {
            return FailAndStamp(prefs, now, $"Update check failed: {ex.Message}");
        }
    }

    public static void OpenDownload(MtcUpdateCheckResult result)
    {
        if (string.IsNullOrWhiteSpace(result.DownloadUrl))
            return;

        Process.Start(new ProcessStartInfo(result.DownloadUrl)
        {
            UseShellExecute = true,
        });
    }

    public static string GetCurrentPlatformKey()
    {
        if (OperatingSystem.IsMacOS())
            return RuntimeInformation.ProcessArchitecture == Architecture.Arm64 ? "osx-arm64" : "osx-x64";

        if (OperatingSystem.IsWindows())
            return "win-x64";

        if (OperatingSystem.IsLinux())
            return IsRpmBasedLinux() ? "linux-rpm-x64" : "linux-x64";

        return RuntimeInformation.RuntimeIdentifier;
    }

    private static bool IsRpmBasedLinux()
    {
        try
        {
            const string osReleasePath = "/etc/os-release";
            if (!File.Exists(osReleasePath))
                return false;

            string text = File.ReadAllText(osReleasePath).ToLowerInvariant();
            return text.Contains("id=fedora", StringComparison.Ordinal)
                || text.Contains("id=rhel", StringComparison.Ordinal)
                || text.Contains("id=centos", StringComparison.Ordinal)
                || text.Contains("id=rocky", StringComparison.Ordinal)
                || text.Contains("id=almalinux", StringComparison.Ordinal)
                || text.Contains("id=opensuse", StringComparison.Ordinal)
                || text.Contains("id=sles", StringComparison.Ordinal)
                || text.Contains("id_like=fedora", StringComparison.Ordinal)
                || text.Contains("id_like=\"fedora", StringComparison.Ordinal)
                || text.Contains("id_like=rhel", StringComparison.Ordinal)
                || text.Contains("id_like=\"rhel", StringComparison.Ordinal)
                || text.Contains("id_like=suse", StringComparison.Ordinal)
                || text.Contains("id_like=\"suse", StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }

    private static MtcUpdateCheckResult FailAndStamp(AppPreferences prefs, DateTimeOffset now, string message)
    {
        prefs.UpdateLastCheckUtc = now;
        prefs.Save();
        return new MtcUpdateCheckResult(MtcUpdateCheckStatus.Failed, message, MtcVersion.PackageVersion);
    }

    private static bool IsNewerVersion(string? candidate, string current)
        => ParsedVersion.Parse(candidate).CompareTo(ParsedVersion.Parse(current)) > 0;

    private readonly record struct ParsedVersion(int Major, int Minor, int Patch, int PreRank, int PreNumber)
        : IComparable<ParsedVersion>
    {
        public static ParsedVersion Parse(string? value)
        {
            string normalized = (value ?? string.Empty).Trim().TrimStart('v', 'V');
            string[] parts = normalized.Split('-', 2, StringSplitOptions.TrimEntries);
            string[] numbers = parts[0].Split('.', StringSplitOptions.TrimEntries);

            int preRank = 4;
            int preNumber = 0;
            if (parts.Length > 1)
            {
                string preRelease = parts[1].ToLowerInvariant();
                preRank = preRelease switch
                {
                    var pre when pre.StartsWith("dev", StringComparison.Ordinal) => 0,
                    var pre when pre.StartsWith("alpha", StringComparison.Ordinal) => 1,
                    var pre when pre.StartsWith("beta", StringComparison.Ordinal) => 2,
                    var pre when pre.StartsWith("rc", StringComparison.Ordinal) => 3,
                    _ => -1,
                };
                preNumber = ExtractNumber(preRelease);
            }

            return new ParsedVersion(
                ParseNumberPart(numbers, 0),
                ParseNumberPart(numbers, 1),
                ParseNumberPart(numbers, 2),
                preRank,
                preNumber);
        }

        public int CompareTo(ParsedVersion other)
        {
            int major = Major.CompareTo(other.Major);
            if (major != 0)
                return major;

            int minor = Minor.CompareTo(other.Minor);
            if (minor != 0)
                return minor;

            int patch = Patch.CompareTo(other.Patch);
            if (patch != 0)
                return patch;

            int preRank = PreRank.CompareTo(other.PreRank);
            if (preRank != 0)
                return preRank;

            return PreNumber.CompareTo(other.PreNumber);
        }

        private static int ParseNumberPart(string[] parts, int index)
        {
            if (index >= parts.Length)
                return 0;

            return int.TryParse(parts[index], NumberStyles.Integer, CultureInfo.InvariantCulture, out int value)
                ? value
                : 0;
        }

        private static int ExtractNumber(string value)
        {
            string digits = new(value.Where(char.IsDigit).ToArray());
            return int.TryParse(digits, NumberStyles.Integer, CultureInfo.InvariantCulture, out int number)
                ? number
                : 0;
        }
    }
}

internal sealed class MtcUpdateManifest
{
    [JsonPropertyName("schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("releases")]
    public Dictionary<string, MtcUpdateRelease> Releases { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

internal sealed class MtcUpdateRelease
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("displayVersion")]
    public string DisplayVersion { get; set; } = string.Empty;

    [JsonPropertyName("channel")]
    public string Channel { get; set; } = string.Empty;

    [JsonPropertyName("publishedAtUtc")]
    public string PublishedAtUtc { get; set; } = string.Empty;

    [JsonPropertyName("notesUrl")]
    public string NotesUrl { get; set; } = string.Empty;

    [JsonPropertyName("assets")]
    public Dictionary<string, MtcUpdateAsset> Assets { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public string DisplayVersionOrVersion
        => string.IsNullOrWhiteSpace(DisplayVersion) ? Version : DisplayVersion;
}

internal sealed class MtcUpdateAsset
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("packageType")]
    public string PackageType { get; set; } = string.Empty;

    [JsonPropertyName("sha256")]
    public string Sha256 { get; set; } = string.Empty;
}
