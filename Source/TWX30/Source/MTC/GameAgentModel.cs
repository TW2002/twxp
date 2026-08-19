using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace MTC;

internal sealed class GameAgentModelRequest
{
    public string Prompt { get; init; } = string.Empty;
    public GameAgentContextSnapshot Context { get; init; } = new();
    public int MaxContextCharacters { get; init; } = 32768;
}

internal sealed class GameAgentModelReply
{
    public string Content { get; init; } = string.Empty;
    public bool UsedExternalModel { get; init; }
    public string Status { get; init; } = string.Empty;
}

internal interface IGameAgentModel
{
    Task<GameAgentModelReply> AskAsync(GameAgentModelRequest request, CancellationToken cancellationToken);
}

internal sealed class GameAgentProviderConfig
{
    public string Provider { get; init; } = "lmstudio";
    public string Model { get; init; } = string.Empty;
    public int Port { get; init; }
    public string ApiKey { get; init; } = string.Empty;
}

internal static class GameAgentProviders
{
    private static readonly HttpClient SharedHttpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(120),
    };

    public static IReadOnlyList<GameAgentProviderChoice> Choices { get; } =
    [
        new("lmstudio", "LM Studio", UsesPort: true, UsesApiKey: false, DefaultPort: 1234),
        new("ollama", "Ollama", UsesPort: true, UsesApiKey: false, DefaultPort: 11434),
        new("openai", "OpenAI", UsesPort: false, UsesApiKey: true, DefaultPort: 0),
        new("anthropic", "Anthropic", UsesPort: false, UsesApiKey: true, DefaultPort: 0),
        new("local", "Local observer", UsesPort: false, UsesApiKey: false, DefaultPort: 0),
    ];

    public static GameAgentProviderChoice Find(string? provider)
    {
        string normalized = AppPreferences.NormalizeGameAgentProvider(provider);
        return Choices.FirstOrDefault(choice => string.Equals(choice.Id, normalized, StringComparison.OrdinalIgnoreCase)) ?? Choices[0];
    }

    public static IGameAgentModel BuildModel(GameAgentProviderConfig config, IGameAgentModel fallback)
        => Find(config.Provider).Id switch
        {
            "lmstudio" => new OpenAiCompatibleGameAgentModel("LM Studio", BuildLmStudioEndpoint(config.Port), config.Model, string.Empty, fallback),
            "ollama" => new OllamaGameAgentModel(BuildOllamaEndpoint(config.Port), config.Model, fallback),
            "openai" => new OpenAiCompatibleGameAgentModel("OpenAI", "https://api.openai.com/v1/chat/completions", config.Model, config.ApiKey, fallback),
            "anthropic" => new AnthropicGameAgentModel(config.Model, config.ApiKey, fallback),
            _ => fallback,
        };

    public static async Task<IReadOnlyList<string>> GetAvailableModelsAsync(GameAgentProviderConfig config, CancellationToken cancellationToken)
    {
        return Find(config.Provider).Id switch
        {
            "lmstudio" => await GetOpenAiCompatibleModelsAsync("LM Studio", BuildLmStudioModelsEndpoint(config.Port), string.Empty, cancellationToken).ConfigureAwait(false),
            "ollama" => await GetOllamaModelsAsync(BuildOllamaTagsEndpoint(config.Port), cancellationToken).ConfigureAwait(false),
            "openai" when string.IsNullOrWhiteSpace(config.ApiKey) => throw new InvalidOperationException("OpenAI API key is not configured."),
            "openai" => await GetOpenAiCompatibleModelsAsync("OpenAI", "https://api.openai.com/v1/models", config.ApiKey, cancellationToken).ConfigureAwait(false),
            "anthropic" when string.IsNullOrWhiteSpace(config.ApiKey) => throw new InvalidOperationException("Anthropic API key is not configured."),
            "anthropic" => await GetAnthropicModelsAsync(config.ApiKey, cancellationToken).ConfigureAwait(false),
            _ => [],
        };
    }

    internal static string BuildSystemPrompt()
        => "You are the MTC Game Agent for TradeWars 2002. You are in advice mode only. " +
           "Explain what is happening, point out risks, and suggest next commands or scripts when useful. " +
           "You cannot send commands, run scripts, stop scripts, click UI, or play automatically. " +
           "If you suggest commands, label them as suggestions only and wait for the user to act. " +
           "Use the compact structured context. Do not invent unseen sector data. " +
           "Port codes are product buy/sell patterns in Fuel Ore, Organics, Equipment order; for example SSB means the port sells Fuel Ore, sells Organics, and buys Equipment. " +
           "Limpet mines are tracking mines: they can attach to another player's ship and report movement; they do not damage the ship they are attached to. " +
           "Armid mines are explosive sector mines that can damage other ships when triggered; your own deployed armids or limpets do not damage your own ship merely because you leave a sector. " +
           "A sector anomaly is a sensor/navigation signal, not random hull or cargo damage by itself. " +
           "Alignment does not make normal warps cost more and does not make a trader get stuck on random warps. " +
           "When asked to move or warp, a direct sector entry may offer TransWarp or autopilot confirmations; if the game asks 'Do you want to make this jump blind?' the answer is always no. " +
           "Native Mombot movement commands are distinct from server movement: `t`/`twarp` performs bot TransWarp and `m`/`mow` performs bot mow, but these require native Mombot to be active. " +
           "Always return a concise final answer in assistant content; never return an empty answer.";

    internal static string BuildUserPrompt(GameAgentModelRequest request)
    {
        var compact = new
        {
            request.Context.GameName,
            request.Context.Connected,
            server = $"{request.Context.Host}:{request.Context.Port}",
            trader = request.Context.TraderName,
            request.Context.Corp,
            current = new
            {
                sector = request.Context.CurrentSector,
                prompt = request.Context.CurrentPrompt,
                request.Context.Credits,
                request.Context.Fighters,
                request.Context.Shields,
                holdsEmpty = request.Context.HoldsEmpty,
                holdsTotal = request.Context.HoldsTotal,
            },
            bot = request.Context.Bot,
            onlinePlayers = request.Context.OnlinePlayers,
            runningScripts = request.Context.RunningScripts.Take(24),
            recentPrompts = request.Context.RecentPrompts,
            hazards = request.Context.Hazards,
            mechanicsNotes = new[]
            {
                "Port codes are Fuel Ore, Organics, Equipment buy/sell patterns. B means the port buys from the player; S means the port sells to the player.",
                "Limpet mines are tracking mines, not damage mines. They do not explode on or damage the ship they are attached to.",
                "Armid mines can damage ships that trigger hostile sector mines, but your own armids/limpets do not damage your ship just because you move.",
                "Anomaly flags should not be described as causing random hull or cargo damage by themselves.",
                "Alignment should not be described as increasing warp costs or causing random-warp movement lockups.",
                "Blind TransWarp jumps are always declined with N.",
                "Mombot t/twarp and m/mow are bot commands, not TradeWars server movement prompts; use them only when native Mombot is active.",
            },
            copilotRecommendation = request.Context.CopilotRecommendation,
            currentSector = request.Context.CurrentSectorDetails,
            adjacentSectors = request.Context.AdjacentSectors.Take(8),
            tools = GameAgentToolRegistry.DescribeTools(),
            recentEvents = request.Context.RecentEvents
                .TakeLast(32)
                .Select(evt => new
                {
                    time = evt.Timestamp.ToLocalTime().ToString("HH:mm:ss"),
                    kind = evt.Kind.ToString(),
                    sector = evt.CurrentSector,
                    text = Trim(evt.PlainText, 180),
                    prompt = evt.PromptSurface,
                    metadata = evt.Kind == GameAgentEventKind.ShipStatus ? evt.Metadata : null,
                }),
        };

        string json = JsonSerializer.Serialize(compact, new JsonSerializerOptions { WriteIndented = true });
        int maxContext = Math.Max(4096, request.MaxContextCharacters);
        if (json.Length > maxContext)
            json = json[..maxContext] + "\n... context truncated by selected Game Agent context budget ...";

        return $"User question:\n{request.Prompt.Trim()}\n\nCompact game context:\n{json}";
    }

    internal static string ExtractOpenAiAssistantContent(string body)
    {
        using JsonDocument document = JsonDocument.Parse(body);
        if (!document.RootElement.TryGetProperty("choices", out JsonElement choices) || choices.ValueKind != JsonValueKind.Array)
            return string.Empty;

        foreach (JsonElement choice in choices.EnumerateArray())
        {
            string content = ExtractChoiceContent(choice);
            if (!string.IsNullOrWhiteSpace(content))
                return content.Trim();
        }

        return string.Empty;
    }

    internal static string Trim(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;
        string text = value.Trim();
        return text.Length <= max ? text : text[..max] + "...";
    }

    private static string BuildLmStudioEndpoint(int port)
        => $"http://127.0.0.1:{AppPreferences.NormalizeGameAgentPort(port, 1234)}/v1/chat/completions";

    private static string BuildLmStudioModelsEndpoint(int port)
        => $"http://127.0.0.1:{AppPreferences.NormalizeGameAgentPort(port, 1234)}/v1/models";

    private static string BuildOllamaEndpoint(int port)
        => $"http://127.0.0.1:{AppPreferences.NormalizeGameAgentPort(port, 11434)}/api/chat";

    private static string BuildOllamaTagsEndpoint(int port)
        => $"http://127.0.0.1:{AppPreferences.NormalizeGameAgentPort(port, 11434)}/api/tags";

    private static async Task<IReadOnlyList<string>> GetOpenAiCompatibleModelsAsync(string providerName, string endpoint, string apiKey, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        if (!string.IsNullOrWhiteSpace(apiKey))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());

        using HttpResponseMessage response = await SharedHttpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"{providerName} returned {(int)response.StatusCode}: {Trim(body, 240)}");

        ModelsResponse? decoded = JsonSerializer.Deserialize<ModelsResponse>(body);
        return decoded?.Data?
            .Select(model => model.Id)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(id => id, StringComparer.OrdinalIgnoreCase)
            .ToArray() ?? [];
    }

    private static async Task<IReadOnlyList<string>> GetOllamaModelsAsync(string endpoint, CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await SharedHttpClient.GetAsync(endpoint, cancellationToken).ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Ollama returned {(int)response.StatusCode}: {Trim(body, 240)}");

        OllamaTagsResponse? decoded = JsonSerializer.Deserialize<OllamaTagsResponse>(body);
        return decoded?.Models?
            .Select(model => model.Name)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(id => id, StringComparer.OrdinalIgnoreCase)
            .ToArray() ?? [];
    }

    private static async Task<IReadOnlyList<string>> GetAnthropicModelsAsync(string apiKey, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Anthropic API key is not configured.");

        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.anthropic.com/v1/models");
        request.Headers.Add("x-api-key", apiKey.Trim());
        request.Headers.Add("anthropic-version", "2023-06-01");

        using HttpResponseMessage response = await SharedHttpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Anthropic returned {(int)response.StatusCode}: {Trim(body, 240)}");

        ModelsResponse? decoded = JsonSerializer.Deserialize<ModelsResponse>(body);
        return decoded?.Data?
            .Select(model => model.Id)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(id => id, StringComparer.OrdinalIgnoreCase)
            .ToArray() ?? [];
    }

    private static string ExtractChoiceContent(JsonElement choice)
    {
        if (choice.TryGetProperty("message", out JsonElement message))
        {
            foreach (string field in new[] { "content", "reasoning_content", "reasoning" })
            {
                string content = ExtractMessageField(message, field);
                if (!string.IsNullOrWhiteSpace(content))
                    return content;
            }
        }

        return choice.TryGetProperty("text", out JsonElement textElement) ? ExtractContentValue(textElement) : string.Empty;
    }

    private static string ExtractMessageField(JsonElement message, string fieldName)
        => message.TryGetProperty(fieldName, out JsonElement value) ? ExtractContentValue(value) : string.Empty;

    private static string ExtractContentValue(JsonElement value)
        => value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Array => string.Join("\n", value.EnumerateArray().Select(ExtractContentValue).Where(text => !string.IsNullOrWhiteSpace(text))),
            JsonValueKind.Object => ExtractContentObject(value),
            _ => string.Empty,
        };

    private static string ExtractContentObject(JsonElement obj)
    {
        foreach (string fieldName in new[] { "text", "content", "value" })
        {
            if (obj.TryGetProperty(fieldName, out JsonElement field))
            {
                string value = ExtractContentValue(field);
                if (!string.IsNullOrWhiteSpace(value))
                    return value;
            }
        }

        return string.Empty;
    }

    private sealed class ModelsResponse
    {
        [JsonPropertyName("data")]
        public List<ModelInfo> Data { get; init; } = [];
    }

    private sealed class ModelInfo
    {
        [JsonPropertyName("id")]
        public string Id { get; init; } = string.Empty;
    }

    private sealed class OllamaTagsResponse
    {
        [JsonPropertyName("models")]
        public List<OllamaModelInfo> Models { get; init; } = [];
    }

    private sealed class OllamaModelInfo
    {
        [JsonPropertyName("name")]
        public string Name { get; init; } = string.Empty;
    }
}

internal sealed record GameAgentProviderChoice(string Id, string Label, bool UsesPort, bool UsesApiKey, int DefaultPort)
{
    public override string ToString() => Label;
}

internal sealed class OpenAiCompatibleGameAgentModel : IGameAgentModel
{
    private static readonly HttpClient SharedHttpClient = new() { Timeout = TimeSpan.FromSeconds(120) };
    private readonly string _providerName;
    private readonly string _endpoint;
    private readonly string _model;
    private readonly string _apiKey;
    private readonly IGameAgentModel _fallback;

    public OpenAiCompatibleGameAgentModel(string providerName, string endpoint, string model, string apiKey, IGameAgentModel fallback)
    {
        _providerName = providerName;
        _endpoint = endpoint;
        _model = string.IsNullOrWhiteSpace(model) ? "local-model" : model.Trim();
        _apiKey = apiKey;
        _fallback = fallback;
    }

    public async Task<GameAgentModelReply> AskAsync(GameAgentModelRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var payload = new OpenAiChatRequest
            {
                Model = _model,
                Messages =
                [
                    new ChatMessage { Role = "system", Content = GameAgentProviders.BuildSystemPrompt() },
                    new ChatMessage { Role = "user", Content = GameAgentProviders.BuildUserPrompt(request) },
                ],
                Temperature = 0.2,
                MaxTokens = 900,
                Stream = false,
            };

            string requestJson = JsonSerializer.Serialize(payload);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, _endpoint)
            {
                Content = new StringContent(requestJson, Encoding.UTF8, "application/json"),
            };
            if (!string.IsNullOrWhiteSpace(_apiKey))
                httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey.Trim());

            using HttpResponseMessage response = await SharedHttpClient.SendAsync(httpRequest, cancellationToken).ConfigureAwait(false);
            string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException($"{_providerName} returned {(int)response.StatusCode}: {GameAgentProviders.Trim(body, 240)}");

            string content = GameAgentProviders.ExtractOpenAiAssistantContent(body);
            if (string.IsNullOrWhiteSpace(content))
                throw new InvalidOperationException($"{_providerName} returned an empty assistant message: {GameAgentProviders.Trim(body, 360)}");

            return new GameAgentModelReply { Content = content, UsedExternalModel = true, Status = $"{_providerName}: {_model}" };
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            GameAgentModelReply fallback = await _fallback.AskAsync(request, cancellationToken).ConfigureAwait(false);
            return new GameAgentModelReply
            {
                Content = fallback.Content + $"\n\n[{_providerName} unavailable: {BuildTransportErrorMessage(ex)}]",
                UsedExternalModel = false,
                Status = "local-observer fallback",
            };
        }
    }

    private static string BuildTransportErrorMessage(Exception ex)
    {
        Exception root = ex.GetBaseException();
        return ReferenceEquals(root, ex) ? ex.Message : $"{ex.Message} ({root.GetType().Name}: {root.Message})";
    }
}

internal sealed class OllamaGameAgentModel : IGameAgentModel
{
    private static readonly HttpClient SharedHttpClient = new() { Timeout = TimeSpan.FromSeconds(120) };
    private readonly string _endpoint;
    private readonly string _model;
    private readonly IGameAgentModel _fallback;

    public OllamaGameAgentModel(string endpoint, string model, IGameAgentModel fallback)
    {
        _endpoint = endpoint;
        _model = string.IsNullOrWhiteSpace(model) ? "llama3.1" : model.Trim();
        _fallback = fallback;
    }

    public async Task<GameAgentModelReply> AskAsync(GameAgentModelRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var payload = new OllamaChatRequest
            {
                Model = _model,
                Stream = false,
                Messages =
                [
                    new ChatMessage { Role = "system", Content = GameAgentProviders.BuildSystemPrompt() },
                    new ChatMessage { Role = "user", Content = GameAgentProviders.BuildUserPrompt(request) },
                ],
            };

            using HttpResponseMessage response = await SharedHttpClient.PostAsJsonAsync(_endpoint, payload, cancellationToken).ConfigureAwait(false);
            string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException($"Ollama returned {(int)response.StatusCode}: {GameAgentProviders.Trim(body, 240)}");

            using JsonDocument document = JsonDocument.Parse(body);
            string content = document.RootElement.TryGetProperty("message", out JsonElement message)
                ? (message.TryGetProperty("content", out JsonElement contentElement) ? contentElement.GetString() ?? string.Empty : string.Empty)
                : string.Empty;
            if (string.IsNullOrWhiteSpace(content))
                throw new InvalidOperationException($"Ollama returned an empty assistant message: {GameAgentProviders.Trim(body, 360)}");

            return new GameAgentModelReply { Content = content.Trim(), UsedExternalModel = true, Status = $"Ollama: {_model}" };
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            GameAgentModelReply fallback = await _fallback.AskAsync(request, cancellationToken).ConfigureAwait(false);
            return new GameAgentModelReply
            {
                Content = fallback.Content + $"\n\n[Ollama unavailable: {ex.Message}]",
                UsedExternalModel = false,
                Status = "local-observer fallback",
            };
        }
    }
}

internal sealed class AnthropicGameAgentModel : IGameAgentModel
{
    private static readonly HttpClient SharedHttpClient = new() { Timeout = TimeSpan.FromSeconds(120) };
    private readonly string _model;
    private readonly string _apiKey;
    private readonly IGameAgentModel _fallback;

    public AnthropicGameAgentModel(string model, string apiKey, IGameAgentModel fallback)
    {
        _model = string.IsNullOrWhiteSpace(model) ? "claude-sonnet-4-5" : model.Trim();
        _apiKey = apiKey;
        _fallback = fallback;
    }

    public async Task<GameAgentModelReply> AskAsync(GameAgentModelRequest request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
                throw new InvalidOperationException("Anthropic API key is not configured.");

            var payload = new AnthropicMessageRequest
            {
                Model = _model,
                System = GameAgentProviders.BuildSystemPrompt(),
                MaxTokens = 900,
                Temperature = 0.2,
                Messages = [new ChatMessage { Role = "user", Content = GameAgentProviders.BuildUserPrompt(request) }],
            };

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
            {
                Content = JsonContent.Create(payload),
            };
            httpRequest.Headers.Add("x-api-key", _apiKey.Trim());
            httpRequest.Headers.Add("anthropic-version", "2023-06-01");

            using HttpResponseMessage response = await SharedHttpClient.SendAsync(httpRequest, cancellationToken).ConfigureAwait(false);
            string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException($"Anthropic returned {(int)response.StatusCode}: {GameAgentProviders.Trim(body, 240)}");

            string content = ExtractAnthropicContent(body);
            if (string.IsNullOrWhiteSpace(content))
                throw new InvalidOperationException($"Anthropic returned an empty assistant message: {GameAgentProviders.Trim(body, 360)}");

            return new GameAgentModelReply { Content = content, UsedExternalModel = true, Status = $"Anthropic: {_model}" };
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            GameAgentModelReply fallback = await _fallback.AskAsync(request, cancellationToken).ConfigureAwait(false);
            return new GameAgentModelReply
            {
                Content = fallback.Content + $"\n\n[Anthropic unavailable: {ex.Message}]",
                UsedExternalModel = false,
                Status = "local-observer fallback",
            };
        }
    }

    private static string ExtractAnthropicContent(string body)
    {
        using JsonDocument document = JsonDocument.Parse(body);
        if (!document.RootElement.TryGetProperty("content", out JsonElement content) || content.ValueKind != JsonValueKind.Array)
            return string.Empty;

        return string.Join("\n", content.EnumerateArray()
            .Where(item => item.TryGetProperty("type", out JsonElement type) && string.Equals(type.GetString(), "text", StringComparison.OrdinalIgnoreCase))
            .Select(item => item.TryGetProperty("text", out JsonElement text) ? text.GetString() ?? string.Empty : string.Empty)
            .Where(text => !string.IsNullOrWhiteSpace(text))).Trim();
    }
}

internal sealed class OpenAiChatRequest
{
    [JsonPropertyName("model")]
    public string Model { get; init; } = string.Empty;
    [JsonPropertyName("messages")]
    public IReadOnlyList<ChatMessage> Messages { get; init; } = [];
    [JsonPropertyName("temperature")]
    public double Temperature { get; init; }
    [JsonPropertyName("max_tokens")]
    public int MaxTokens { get; init; }
    [JsonPropertyName("stream")]
    public bool Stream { get; init; }
}

internal sealed class OllamaChatRequest
{
    [JsonPropertyName("model")]
    public string Model { get; init; } = string.Empty;
    [JsonPropertyName("messages")]
    public IReadOnlyList<ChatMessage> Messages { get; init; } = [];
    [JsonPropertyName("stream")]
    public bool Stream { get; init; }
}

internal sealed class AnthropicMessageRequest
{
    [JsonPropertyName("model")]
    public string Model { get; init; } = string.Empty;
    [JsonPropertyName("system")]
    public string System { get; init; } = string.Empty;
    [JsonPropertyName("messages")]
    public IReadOnlyList<ChatMessage> Messages { get; init; } = [];
    [JsonPropertyName("max_tokens")]
    public int MaxTokens { get; init; }
    [JsonPropertyName("temperature")]
    public double Temperature { get; init; }
}

internal sealed class ChatMessage
{
    [JsonPropertyName("role")]
    public string Role { get; init; } = string.Empty;
    [JsonPropertyName("content")]
    public string Content { get; init; } = string.Empty;
}

internal sealed class LocalObserverGameAgentModel : IGameAgentModel
{
    public Task<GameAgentModelReply> AskAsync(GameAgentModelRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(new GameAgentModelReply
        {
            Content = GameAgentWindow.BuildLocalObserverReply(request.Prompt, request.Context),
            UsedExternalModel = false,
            Status = "local-observer",
        });
    }
}
