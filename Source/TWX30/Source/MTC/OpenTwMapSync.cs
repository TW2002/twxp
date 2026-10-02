using System.IO.Compression;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Core = TWXProxy.Core;

namespace MTC;

public sealed record OpenTwMapDescriptor(
    string GameKey,
    Guid UniverseId,
    string TopologyHash,
    int SectorCount,
    Uri MapUrl,
    string AccessToken,
    DateTimeOffset ExpiresAtUtc)
{
    public const string FramePrefix = "@OPENTW-MAP/1 ";

    public static bool TryParseFrame(string line, out OpenTwMapDescriptor? descriptor)
    {
        descriptor = null;
        int prefixIndex = line.IndexOf(FramePrefix, StringComparison.Ordinal);
        if (prefixIndex < 0)
            return false;

        string encoded = line[(prefixIndex + FramePrefix.Length)..].Trim();
        try
        {
            int padding = (4 - encoded.Length % 4) % 4;
            string base64 = encoded.Replace('-', '+').Replace('_', '/') + new string('=', padding);
            using JsonDocument json = JsonDocument.Parse(Convert.FromBase64String(base64));
            JsonElement root = json.RootElement;
            string gameKey = root.GetProperty("gameKey").GetString() ?? string.Empty;
            Guid universeId = root.GetProperty("universeId").GetGuid();
            string topologyHash = root.GetProperty("topologyHash").GetString() ?? string.Empty;
            int sectorCount = root.GetProperty("sectorCount").GetInt32();
            string mapUrl = root.GetProperty("mapUrl").GetString() ?? string.Empty;
            string accessToken = root.GetProperty("accessToken").GetString() ?? string.Empty;
            DateTimeOffset expiresAtUtc = root.GetProperty("expiresAtUtc").GetDateTimeOffset();
            if (string.IsNullOrWhiteSpace(gameKey) || universeId == Guid.Empty || sectorCount < 1 ||
                !topologyHash.StartsWith("sha256:", StringComparison.Ordinal) ||
                !Uri.TryCreate(mapUrl, UriKind.Absolute, out Uri? parsedUrl) ||
                string.IsNullOrWhiteSpace(accessToken))
                return false;

            descriptor = new OpenTwMapDescriptor(
                gameKey,
                universeId,
                topologyHash,
                sectorCount,
                parsedUrl,
                accessToken,
                expiresAtUtc);
            return true;
        }
        catch (Exception exception) when (
            exception is FormatException or JsonException or InvalidOperationException)
        {
            return false;
        }
    }
}

public sealed class OpenTwMapFrameFilter
{
    private readonly StringBuilder _pending = new();

    public event Action<OpenTwMapDescriptor>? DescriptorReceived;

    public byte[] Filter(byte[] chunk)
    {
        if (chunk.Length == 0)
            return chunk;

        _pending.Append(Encoding.Latin1.GetString(chunk));
        var output = new StringBuilder(_pending.Length);
        while (true)
        {
            string buffered = _pending.ToString();
            int prefix = buffered.IndexOf(OpenTwMapDescriptor.FramePrefix, StringComparison.Ordinal);
            if (prefix < 0)
            {
                int retain = PartialPrefixSuffixLength(buffered);
                int emit = buffered.Length - retain;
                if (emit > 0)
                {
                    output.Append(buffered.AsSpan(0, emit));
                    _pending.Remove(0, emit);
                }
                break;
            }

            int lineEnd = buffered.IndexOf('\n', prefix);
            if (lineEnd < 0)
            {
                if (prefix > 0)
                {
                    output.Append(buffered.AsSpan(0, prefix));
                    _pending.Remove(0, prefix);
                }
                break;
            }

            if (prefix > 0)
                output.Append(buffered.AsSpan(0, prefix));
            string frame = buffered[prefix..lineEnd].TrimEnd('\r');
            _pending.Remove(0, lineEnd + 1);
            if (OpenTwMapDescriptor.TryParseFrame(frame, out OpenTwMapDescriptor? descriptor) && descriptor is not null)
                DescriptorReceived?.Invoke(descriptor);
        }

        return Encoding.Latin1.GetBytes(output.ToString());
    }

    public byte[] Flush()
    {
        byte[] result = Encoding.Latin1.GetBytes(_pending.ToString());
        _pending.Clear();
        return result;
    }

    private static int PartialPrefixSuffixLength(string value)
    {
        int maximum = Math.Min(OpenTwMapDescriptor.FramePrefix.Length - 1, value.Length);
        for (int length = maximum; length > 0; length--)
        {
            if (value.AsSpan(value.Length - length).SequenceEqual(
                    OpenTwMapDescriptor.FramePrefix.AsSpan(0, length)))
                return length;
        }
        return 0;
    }
}

public sealed record OpenTwMapSyncResult(
    bool Applied,
    bool NotModified,
    bool UniverseChanged,
    int SectorCount,
    string? BackupPath);

public sealed class OpenTwInitialSyncGate
{
    private readonly object _sync = new();
    private TaskCompletionSource<bool> _detected = NewCompletion();
    private TaskCompletionSource<bool> _completed = NewCompletion();

    public void Reset()
    {
        lock (_sync)
        {
            _completed.TrySetResult(false);
            _detected = NewCompletion();
            _completed = NewCompletion();
        }
    }

    public void MarkOpenTwDetected() => _detected.TrySetResult(true);
    public void Complete(bool synchronized) => _completed.TrySetResult(synchronized);

    public async Task<bool> WaitBeforeAutomaticStartAsync(
        TimeSpan detectionWindow,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _detected.Task.WaitAsync(detectionWindow, cancellationToken).ConfigureAwait(false);
        }
        catch (TimeoutException)
        {
            return true;
        }
        return await _completed.Task.WaitAsync(cancellationToken).ConfigureAwait(false);
    }

    private static TaskCompletionSource<bool> NewCompletion() =>
        new(TaskCreationOptions.RunContinuationsAsynchronously);
}

public sealed class OpenTwMapSynchronizer : IDisposable
{
    public const long DefaultMaximumCompressedBytes = 256L * 1024 * 1024;
    public const long DefaultMaximumUncompressedBytes = 1024L * 1024 * 1024;
    private const string Schema = "https://opentw.org/schemas/topology/v1";
    private readonly HttpClient _httpClient;
    private readonly long _maximumCompressedBytes;
    private readonly long _maximumUncompressedBytes;
    private readonly HashSet<string>? _allowedHosts;

    public OpenTwMapSynchronizer(
        HttpMessageHandler? handler = null,
        long maximumCompressedBytes = DefaultMaximumCompressedBytes,
        long maximumUncompressedBytes = DefaultMaximumUncompressedBytes,
        IEnumerable<string>? allowedHosts = null)
    {
        _maximumCompressedBytes = maximumCompressedBytes;
        _maximumUncompressedBytes = maximumUncompressedBytes;
        _allowedHosts = allowedHosts is null
            ? null
            : new HashSet<string>(
                allowedHosts.Where(host => !string.IsNullOrWhiteSpace(host)),
                StringComparer.OrdinalIgnoreCase);
        _httpClient = new HttpClient(handler ?? new HttpClientHandler
        {
            AllowAutoRedirect = false,
            AutomaticDecompression = DecompressionMethods.None
        }, disposeHandler: true)
        {
            Timeout = TimeSpan.FromMinutes(5)
        };
    }

    public async Task<OpenTwMapSyncResult> SynchronizeAsync(
        OpenTwMapDescriptor descriptor,
        Core.ModDatabase database,
        CancellationToken cancellationToken = default,
        Func<bool>? canCommit = null)
    {
        ArgumentNullException.ThrowIfNull(descriptor);
        ArgumentNullException.ThrowIfNull(database);
        ValidateMapUri(descriptor.MapUrl, _allowedHosts);
        if (descriptor.ExpiresAtUtc <= DateTimeOffset.UtcNow)
            throw new InvalidDataException("The OpenTW map descriptor has expired.");

        string compressedPath = Path.GetTempFileName();
        string spoolPath = Path.GetTempFileName();
        try
        {
            Core.DataHeader header = database.DBHeader;
            using HttpResponseMessage response = await SendMapRequestAsync(
                descriptor,
                header.OpenTwTopologyHash,
                cancellationToken).ConfigureAwait(false);
            if (response.StatusCode == HttpStatusCode.NotModified)
            {
                return new OpenTwMapSyncResult(false, true, false, descriptor.SectorCount, null);
            }
            if (response.StatusCode == HttpStatusCode.Conflict)
                throw new InvalidDataException("The OpenTW universe changed while its map was downloading.");
            response.EnsureSuccessStatusCode();

            if (response.Content.Headers.ContentLength is { } contentLength &&
                contentLength > _maximumCompressedBytes)
                throw new InvalidDataException("The compressed OpenTW map exceeds the configured size limit.");
            await DownloadBoundedAsync(response, compressedPath, cancellationToken).ConfigureAwait(false);
            VerifyContentDigest(response, compressedPath);

            ParsedMap parsed = await ParseAndSpoolAsync(
                compressedPath,
                spoolPath,
                descriptor,
                cancellationToken).ConfigureAwait(false);
            bool universeChanged = !string.Equals(
                header.OpenTwUniverseId,
                descriptor.UniverseId.ToString("D"),
                StringComparison.OrdinalIgnoreCase);
            cancellationToken.ThrowIfCancellationRequested();
            if (canCommit is not null && !canCommit())
                throw new OperationCanceledException("The OpenTW connection changed before map installation.", cancellationToken);
            string? backupPath = null;
            if (universeChanged && File.Exists(database.DatabasePath))
            {
                backupPath = database.DatabasePath + $".pre-opentw-{DateTime.UtcNow:yyyyMMddHHmmssfff}.bak";
                File.Copy(database.DatabasePath, backupPath, overwrite: false);
            }

            cancellationToken.ThrowIfCancellationRequested();
            if (canCommit is not null && !canCommit())
                throw new OperationCanceledException("The OpenTW connection changed before map installation.", cancellationToken);
            database.ReplaceOpenTwTopology(
                ReadSpoolRows(spoolPath, parsed.SectorCount),
                parsed.SectorCount,
                parsed.UniverseId.ToString("D"),
                parsed.TopologyHash,
                DateTime.UtcNow);
            return new OpenTwMapSyncResult(true, false, universeChanged, parsed.SectorCount, backupPath);
        }
        finally
        {
            File.Delete(compressedPath);
            File.Delete(spoolPath);
        }
    }

    private async Task<HttpResponseMessage> SendMapRequestAsync(
        OpenTwMapDescriptor descriptor,
        string currentTopologyHash,
        CancellationToken cancellationToken)
    {
        for (int attempt = 0; attempt < 4; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, descriptor.MapUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", descriptor.AccessToken);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json-seq"));
            request.Headers.AcceptEncoding.Add(new StringWithQualityHeaderValue("gzip"));
            if (!string.IsNullOrWhiteSpace(currentTopologyHash))
                request.Headers.TryAddWithoutValidation("If-None-Match", $"\"{currentTopologyHash}\"");
            HttpResponseMessage response = await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken).ConfigureAwait(false);
            if (response.StatusCode != HttpStatusCode.ServiceUnavailable || attempt == 3)
                return response;

            TimeSpan delay = response.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(1 << attempt);
            response.Dispose();
            await Task.Delay(delay > TimeSpan.FromSeconds(5) ? TimeSpan.FromSeconds(5) : delay, cancellationToken)
                .ConfigureAwait(false);
        }

        throw new InvalidOperationException("Unreachable OpenTW map retry state.");
    }

    private async Task DownloadBoundedAsync(
        HttpResponseMessage response,
        string destination,
        CancellationToken cancellationToken)
    {
        await using Stream source = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        await using var target = new FileStream(destination, FileMode.Create, FileAccess.Write, FileShare.None, 1024 * 1024, true);
        byte[] buffer = new byte[128 * 1024];
        long total = 0;
        while (true)
        {
            int read = await source.ReadAsync(buffer, cancellationToken).ConfigureAwait(false);
            if (read == 0)
                break;
            total += read;
            if (total > _maximumCompressedBytes)
                throw new InvalidDataException("The compressed OpenTW map exceeds the configured size limit.");
            await target.WriteAsync(buffer.AsMemory(0, read), cancellationToken).ConfigureAwait(false);
        }
    }

    private static void VerifyContentDigest(HttpResponseMessage response, string path)
    {
        if (!response.Headers.TryGetValues("Content-Digest", out IEnumerable<string>? values))
            throw new InvalidDataException("The OpenTW map response omitted Content-Digest.");
        string expected = values.Single();
        using var stream = File.OpenRead(path);
        string actual = $"sha-256=:{Convert.ToBase64String(SHA256.HashData(stream))}:";
        if (!CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(expected),
            Encoding.ASCII.GetBytes(actual)))
            throw new InvalidDataException("The OpenTW map representation digest does not match.");
    }

    private async Task<ParsedMap> ParseAndSpoolAsync(
        string compressedPath,
        string spoolPath,
        OpenTwMapDescriptor descriptor,
        CancellationToken cancellationToken)
    {
        await using var compressed = File.OpenRead(compressedPath);
        await using var gzip = new GZipStream(compressed, CompressionMode.Decompress);
        using var reader = new StreamReader(gzip, new UTF8Encoding(false, true), false, 128 * 1024, leaveOpen: true);
        await using var spool = new FileStream(spoolPath, FileMode.Create, FileAccess.Write, FileShare.None, 1024 * 1024, true);
        using var writer = new BinaryWriter(spool, Encoding.UTF8, leaveOpen: true);
        using var topologyHash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        long uncompressedBytes = 0;
        int expectedSector = 1;
        bool sawManifest = false;
        string? line;
        while ((line = await reader.ReadLineAsync(cancellationToken).ConfigureAwait(false)) is not null)
        {
            uncompressedBytes += Encoding.UTF8.GetByteCount(line) + 1;
            if (uncompressedBytes > _maximumUncompressedBytes)
                throw new InvalidDataException("The OpenTW map exceeds the configured uncompressed size limit.");
            if (line.Length == 0 || line[0] != 0x1e)
                throw new InvalidDataException("The OpenTW map is not an RFC 7464 JSON text sequence.");
            using JsonDocument record = JsonDocument.Parse(line[1..]);
            JsonElement root = record.RootElement;
            string type = root.GetProperty("type").GetString() ?? string.Empty;
            if (!sawManifest)
            {
                ValidateManifest(root, descriptor);
                sawManifest = true;
                continue;
            }
            if (!type.Equals("warps", StringComparison.Ordinal))
                throw new InvalidDataException($"Unexpected OpenTW map record type '{type}'.");
            int firstSector = root.GetProperty("firstSector").GetInt32();
            if (firstSector != expectedSector)
                throw new InvalidDataException($"Expected map sector {expectedSector}, got {firstSector}.");

            foreach (JsonElement row in root.GetProperty("rows").EnumerateArray())
            {
                if (expectedSector > descriptor.SectorCount)
                    throw new InvalidDataException("The OpenTW map contains too many sectors.");
                int[] warps = row.EnumerateArray().Select(value => value.GetInt32()).ToArray();
                if (warps.Length > 6 || warps.Distinct().Count() != warps.Length ||
                    warps.Any(warp => warp < 1 || warp > descriptor.SectorCount))
                    throw new InvalidDataException($"OpenTW map sector {expectedSector} contains invalid warps.");
                writer.Write(expectedSector);
                writer.Write((byte)warps.Length);
                foreach (int warp in warps)
                    writer.Write(warp);
                byte[] canonical = JsonSerializer.SerializeToUtf8Bytes(new object[] { expectedSector, warps });
                topologyHash.AppendData(canonical);
                topologyHash.AppendData("\n"u8);
                expectedSector++;
            }
        }

        if (!sawManifest || expectedSector != descriptor.SectorCount + 1)
            throw new InvalidDataException("The OpenTW map does not cover every sector exactly once.");
        string computedHash = $"sha256:{Convert.ToHexString(topologyHash.GetHashAndReset()).ToLowerInvariant()}";
        if (!computedHash.Equals(descriptor.TopologyHash, StringComparison.Ordinal))
            throw new InvalidDataException("The OpenTW topology hash does not match the descriptor.");
        writer.Flush();
        await spool.FlushAsync(cancellationToken).ConfigureAwait(false);
        return new ParsedMap(descriptor.UniverseId, computedHash, descriptor.SectorCount);
    }

    private static void ValidateManifest(JsonElement root, OpenTwMapDescriptor descriptor)
    {
        if (root.GetProperty("type").GetString() != "manifest" ||
            root.GetProperty("schema").GetString() != Schema ||
            root.GetProperty("gameKey").GetString() != descriptor.GameKey ||
            root.GetProperty("universeId").GetGuid() != descriptor.UniverseId ||
            root.GetProperty("topologyHash").GetString() != descriptor.TopologyHash ||
            root.GetProperty("sectorCount").GetInt32() != descriptor.SectorCount ||
            !root.GetProperty("directed").GetBoolean() ||
            root.GetProperty("maximumWarpsPerSector").GetInt32() != 6)
            throw new InvalidDataException("The OpenTW map manifest does not match its descriptor.");
    }

    private static IEnumerable<Core.OpenTwTopologyRow> ReadSpoolRows(string path, int sectorCount)
    {
        using var stream = File.OpenRead(path);
        using var reader = new BinaryReader(stream);
        for (int count = 0; count < sectorCount; count++)
        {
            int sector = reader.ReadInt32();
            int warpCount = reader.ReadByte();
            var warps = new int[warpCount];
            for (int index = 0; index < warpCount; index++)
                warps[index] = reader.ReadInt32();
            yield return new Core.OpenTwTopologyRow(sector, warps);
        }
        if (stream.Position != stream.Length)
            throw new InvalidDataException("The validated OpenTW topology spool has trailing data.");
    }

    private static void ValidateMapUri(Uri uri, IReadOnlySet<string>? allowedHosts)
    {
        if (allowedHosts is { Count: > 0 } && !allowedHosts.Contains(uri.Host))
            throw new InvalidDataException("The OpenTW map host is not allowed by this game profile.");
        if (uri.Scheme == Uri.UriSchemeHttps)
            return;
        if (uri.Scheme == Uri.UriSchemeHttp &&
            (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
             (IPAddress.TryParse(uri.Host, out IPAddress? address) && IPAddress.IsLoopback(address))))
            return;
        throw new InvalidDataException("OpenTW map downloads require HTTPS except on loopback.");
    }

    private sealed record ParsedMap(Guid UniverseId, string TopologyHash, int SectorCount);

    public void Dispose() => _httpClient.Dispose();
}
