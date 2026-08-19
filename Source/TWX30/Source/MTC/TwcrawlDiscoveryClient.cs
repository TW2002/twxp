using System.Globalization;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace MTC;

internal sealed record TwcrawlServerSummary(
    string ServerId,
    string Slug,
    string Name,
    string Telnet,
    string BigBang,
    int Games,
    int Players,
    IReadOnlyList<TwcrawlGameSummary> GameList);

internal sealed record TwcrawlGameSummary(
    string ServerId,
    string ServerSlug,
    string ServerName,
    string ServerTelnet,
    string Letter,
    string Name,
    string BigBang,
    int? DaysOpen,
    string Time,
    string Turns,
    int Sectors,
    int Players,
    string Latency,
    string ShipDelay);

internal enum TwcrawlQuality
{
    None,
    Good,
    Warn,
    Bad,
}

internal static partial class TwcrawlDiscoveryClient
{
    private const string ApiBaseUrl = "https://roguetw.net/api";
    private const string SiteBaseUrl = "https://roguetw.net/games";
    private static readonly HttpClient SharedHttpClient = new() { Timeout = TimeSpan.FromSeconds(20) };

    public static async Task<IReadOnlyList<TwcrawlServerSummary>> FetchActiveServersAsync(CancellationToken cancellationToken = default)
    {
        using HttpResponseMessage serversResponse = await SharedHttpClient.GetAsync($"{ApiBaseUrl}/servers.json", cancellationToken).ConfigureAwait(false);
        serversResponse.EnsureSuccessStatusCode();
        string serversJson = await serversResponse.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        using HttpResponseMessage gamesResponse = await SharedHttpClient.GetAsync($"{ApiBaseUrl}/games.json", cancellationToken).ConfigureAwait(false);
        gamesResponse.EnsureSuccessStatusCode();
        string gamesJson = await gamesResponse.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        Dictionary<string, ServerApiRow> serverRows = ParseServers(serversJson).Values
            .Where(server => string.Equals(server.Status, "online", StringComparison.OrdinalIgnoreCase))
            .ToDictionary(server => server.ServerId, server => server, StringComparer.OrdinalIgnoreCase);

        List<TwcrawlGameSummary> games = ParseGames(gamesJson)
            .Where(game =>
                string.Equals(game.ServerStatus, "online", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(game.Status, "ok", StringComparison.OrdinalIgnoreCase) &&
                serverRows.ContainsKey(game.ServerId))
            .Select(game => new TwcrawlGameSummary(
                game.ServerId,
                game.ServerSlug,
                game.ServerName,
                game.ServerTelnet,
                game.Letter,
                game.Name,
                game.BigBang,
                game.DaysOpen,
                game.Time,
                game.Turns,
                game.Sectors,
                game.Players,
                game.Latency,
                game.ShipDelay))
            .OrderBy(game => game.Letter, StringComparer.OrdinalIgnoreCase)
            .ToList();

        Dictionary<string, List<TwcrawlGameSummary>> gamesByServer = games
            .GroupBy(game => game.ServerId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.ToList(), StringComparer.OrdinalIgnoreCase);

        return serverRows.Values
            .Where(server => gamesByServer.TryGetValue(server.ServerId, out List<TwcrawlGameSummary>? serverGames) && serverGames.Count > 0)
            .OrderBy(server => server.Name, StringComparer.OrdinalIgnoreCase)
            .Select(server =>
            {
                IReadOnlyList<TwcrawlGameSummary> serverGames = gamesByServer[server.ServerId];
                int players = server.Players >= 0 ? server.Players : serverGames.Sum(game => game.Players);
                int gameCount = server.Games > 0 ? server.Games : serverGames.Count;
                return new TwcrawlServerSummary(
                    server.ServerId,
                    server.Slug,
                    server.Name,
                    server.Telnet,
                    server.BigBang,
                    gameCount,
                    players,
                    serverGames);
            })
            .ToList();
    }

    public static Uri BuildDetailsUri(TwcrawlGameSummary game)
        => new($"{SiteBaseUrl}/server-{Uri.EscapeDataString(game.ServerId)}/game-{Uri.EscapeDataString(game.Letter.ToLowerInvariant())}.html");

    public static string BuildSuggestedGameName(TwcrawlGameSummary game)
    {
        string serverPart = string.IsNullOrWhiteSpace(game.ServerSlug)
            ? game.ServerName
            : game.ServerSlug;
        string serverSlug = BuildCompactGameNamePart(serverPart);
        string letterSlug = NormalizeGameNamePart(game.Letter);
        if (string.IsNullOrWhiteSpace(letterSlug))
            letterSlug = "game";

        string raw = string.IsNullOrWhiteSpace(serverSlug)
            ? $"twx_{letterSlug}"
            : $"{serverSlug}_{letterSlug}";
        return string.IsNullOrWhiteSpace(raw) ? $"twx_{game.Letter.ToLowerInvariant()}" : raw;
    }

    private static string BuildCompactGameNamePart(string value)
    {
        string normalized = NormalizeGameNamePart(value);
        if (string.IsNullOrWhiteSpace(normalized))
            return string.Empty;

        string[] parts = normalized.Split('_', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length <= 2)
            return normalized;

        return $"{parts[0]}_{parts[1]}";
    }

    private static string NormalizeGameNamePart(string value)
    {
        string raw = (value ?? string.Empty).ToLowerInvariant();
        raw = GameNameChars().Replace(raw, "_").Trim('_');
        return Underscores().Replace(raw, "_");
    }

    public static bool TryParseTelnetEndpoint(string telnet, out string host, out int port)
    {
        host = string.Empty;
        port = 2002;

        if (string.IsNullOrWhiteSpace(telnet))
            return false;

        string value = telnet.Trim();
        int colon = value.LastIndexOf(':');
        if (colon > 0 && colon < value.Length - 1 && int.TryParse(value[(colon + 1)..], out int parsedPort))
        {
            host = value[..colon].Trim();
            port = parsedPort;
        }
        else
        {
            host = value;
        }

        return !string.IsNullOrWhiteSpace(host) && port is >= 1 and <= ushort.MaxValue;
    }

    public static TwcrawlQuality ClassifyLatency(string latency)
    {
        Match match = NumberRegex().Match(latency ?? string.Empty);
        if (!match.Success || !int.TryParse(match.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out int milliseconds))
            return TwcrawlQuality.None;

        if (milliseconds <= 150)
            return TwcrawlQuality.Good;
        if (milliseconds <= 250)
            return TwcrawlQuality.Warn;
        return TwcrawlQuality.Bad;
    }

    public static TwcrawlQuality ClassifyShipDelay(string shipDelay)
    {
        string word = DelayWord(shipDelay);
        if (string.IsNullOrWhiteSpace(word))
            return TwcrawlQuality.None;

        if (word == "none" || (word == "constant" && ConstantDelayMilliseconds(shipDelay) <= 250))
            return TwcrawlQuality.Good;
        if (word is "quarter" or "third")
            return TwcrawlQuality.Warn;
        return TwcrawlQuality.Bad;
    }

    private static string DelayWord(string? shipDelay)
    {
        Match match = WordRegex().Match(shipDelay ?? string.Empty);
        return match.Success ? match.Value.ToLowerInvariant() : string.Empty;
    }

    private static int ConstantDelayMilliseconds(string? shipDelay)
    {
        Match match = ConstantDelayRegex().Match(shipDelay ?? string.Empty);
        if (!match.Success)
            return 251;

        int amount = int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);
        string unit = match.Groups[2].Value.ToLowerInvariant();
        if (unit.StartsWith("m", StringComparison.Ordinal) && unit is not ("min" or "mins" or "minute" or "minutes"))
            return amount;
        if (unit.StartsWith("s", StringComparison.Ordinal))
            return amount * 1000;
        return amount * 60000;
    }

    private static Dictionary<string, ServerApiRow> ParseServers(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;
        JsonElement rows = root.TryGetProperty("servers", out JsonElement servers)
            ? servers
            : root.ValueKind == JsonValueKind.Array
                ? root
                : default;

        var result = new Dictionary<string, ServerApiRow>(StringComparer.OrdinalIgnoreCase);
        if (rows.ValueKind != JsonValueKind.Array)
            return result;

        foreach (JsonElement row in rows.EnumerateArray())
        {
            string serverId = GetString(row, "server_id");
            if (string.IsNullOrWhiteSpace(serverId))
                continue;

            result[serverId] = new ServerApiRow(
                serverId,
                GetString(row, "slug"),
                GetString(row, "name"),
                GetString(row, "telnet"),
                GetString(row, "last_bigbang"),
                GetInt(row, "game_count") ?? 0,
                GetInt(row, "players") ?? 0,
                GetString(row, "status"));
        }

        return result;
    }

    private static IEnumerable<GameApiRow> ParseGames(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        JsonElement root = document.RootElement;
        JsonElement rows = root.TryGetProperty("games", out JsonElement games)
            ? games
            : root.ValueKind == JsonValueKind.Array
                ? root
                : default;

        if (rows.ValueKind != JsonValueKind.Array)
            yield break;

        foreach (JsonElement row in rows.EnumerateArray())
        {
            string serverId = GetString(row, "server_id");
            string letter = GetString(row, "letter");
            if (string.IsNullOrWhiteSpace(serverId) || string.IsNullOrWhiteSpace(letter))
                continue;

            yield return new GameApiRow(
                serverId,
                GetString(row, "server_slug"),
                GetString(row, "server_name"),
                GetString(row, "server_telnet"),
                GetString(row, "server_status"),
                letter.Trim().Substring(0, 1).ToUpperInvariant(),
                GetString(row, "name"),
                GetString(row, "status"),
                GetString(row, "bigbang"),
                GetInt(row, "days_open"),
                GetString(row, "time"),
                GetString(row, "turns"),
                GetInt(row, "sectors") ?? ConnectionProfile.DefaultSectors,
                GetInt(row, "players") ?? 0,
                GetString(row, "latency"),
                GetString(row, "ship_delay"));
        }
    }

    private static string GetString(JsonElement row, string name)
    {
        if (!row.TryGetProperty(name, out JsonElement value))
            return string.Empty;

        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Number => value.ToString(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => string.Empty,
        };
    }

    private static int? GetInt(JsonElement row, string name)
    {
        if (!row.TryGetProperty(name, out JsonElement value))
            return null;

        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out int number))
            return number;
        if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out number))
            return number;
        return null;
    }

    private sealed record ServerApiRow(
        string ServerId,
        string Slug,
        string Name,
        string Telnet,
        string BigBang,
        int Games,
        int Players,
        string Status);

    private sealed record GameApiRow(
        string ServerId,
        string ServerSlug,
        string ServerName,
        string ServerTelnet,
        string ServerStatus,
        string Letter,
        string Name,
        string Status,
        string BigBang,
        int? DaysOpen,
        string Time,
        string Turns,
        int Sectors,
        int Players,
        string Latency,
        string ShipDelay);

    [GeneratedRegex("[^a-z0-9_]+", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex GameNameChars();

    [GeneratedRegex("_+", RegexOptions.CultureInvariant)]
    private static partial Regex Underscores();

    [GeneratedRegex("\\d+", RegexOptions.CultureInvariant)]
    private static partial Regex NumberRegex();

    [GeneratedRegex("[A-Za-z]+", RegexOptions.CultureInvariant)]
    private static partial Regex WordRegex();

    [GeneratedRegex("\\((\\d+)\\s*(ms|msec|millisecond|milliseconds|s|sec|secs|second|seconds|min|mins|minute|minutes)\\)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ConstantDelayRegex();
}
