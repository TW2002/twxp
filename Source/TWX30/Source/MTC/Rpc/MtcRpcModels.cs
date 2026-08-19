using System.Text.Json.Serialization;

namespace MTC;

internal enum MtcRpcApprovalLevel
{
    ReadOnly,
    ApproveActions,
    FullAutomation,
}

internal static class MtcRpcApprovalLevels
{
    public const string ReadOnly = "read-only";
    public const string ApproveActions = "approve-actions";
    public const string FullAutomation = "full-automation";

    public static string Normalize(string? value)
    {
        string normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
        return normalized switch
        {
            "readonly" or "read_only" or "read-only" or "observer" => ReadOnly,
            "approve" or "approved" or "approval" or "approve-actions" or "full-approval" => ApproveActions,
            "automation" or "fullautomation" or "full_automation" or "full-automation" or "no-approval" => FullAutomation,
            _ => ApproveActions,
        };
    }

    public static MtcRpcApprovalLevel Parse(string? value)
        => Normalize(value) switch
        {
            ReadOnly => MtcRpcApprovalLevel.ReadOnly,
            FullAutomation => MtcRpcApprovalLevel.FullAutomation,
            _ => MtcRpcApprovalLevel.ApproveActions,
        };

    public static string ToPreferenceValue(MtcRpcApprovalLevel level)
        => level switch
        {
            MtcRpcApprovalLevel.ReadOnly => ReadOnly,
            MtcRpcApprovalLevel.FullAutomation => FullAutomation,
            _ => ApproveActions,
        };
}

internal sealed class MtcJsonRpcServerOptions
{
    public bool Enabled { get; init; }
    public string BindAddress { get; init; } = "127.0.0.1";
    public int Port { get; init; } = 7623;
    public string AuthToken { get; init; } = string.Empty;
    public MtcRpcApprovalLevel ApprovalLevel { get; init; } = MtcRpcApprovalLevel.ApproveActions;

    public string Endpoint => $"http://{BindAddress}:{Port}/";
}

internal sealed class MtcRpcActionResult
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public Dictionary<string, string> Data { get; init; } = [];

    public static MtcRpcActionResult Ok(string message, Dictionary<string, string>? data = null)
        => new()
        {
            Success = true,
            Message = message,
            Data = data ?? [],
        };

    public static MtcRpcActionResult Fail(string message, Dictionary<string, string>? data = null)
        => new()
        {
            Success = false,
            Message = message,
            Data = data ?? [],
        };
}

internal sealed class MtcRpcBridge
{
    public required Func<int, Task<GameAgentContextSnapshot>> GetContextAsync { get; init; }
    public required Func<int, bool, Task<IReadOnlyList<GameAgentEvent>>> GetRecentEventsAsync { get; init; }
    public required Func<int, Task<GameAgentSectorSnapshot?>> QuerySectorAsync { get; init; }
    public required Func<Task<IReadOnlyList<GameAgentRunningScriptSnapshot>>> ListScriptsAsync { get; init; }
    public required Func<string, bool, Task<MtcRpcActionResult>> SendCommandAsync { get; init; }
    public required Func<string, Task<MtcRpcActionResult>> RunMombotCommandAsync { get; init; }
    public required Func<string, Task<MtcRpcActionResult>> RunScriptAsync { get; init; }
    public required Func<int?, string?, Task<MtcRpcActionResult>> StopScriptAsync { get; init; }
    public required Func<string, string, Task<bool>> ApproveActionAsync { get; init; }
}

internal sealed class MtcRpcException : Exception
{
    public MtcRpcException(int code, string message, object? data = null)
        : base(message)
    {
        Code = code;
        DataObject = data;
    }

    public int Code { get; }
    public object? DataObject { get; }
}

internal sealed class JsonRpcErrorObject
{
    [JsonPropertyName("code")]
    public int Code { get; init; }

    [JsonPropertyName("message")]
    public string Message { get; init; } = string.Empty;

    [JsonPropertyName("data")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Data { get; init; }
}

internal sealed class JsonRpcResponseObject
{
    [JsonPropertyName("jsonrpc")]
    public string JsonRpc { get; init; } = "2.0";

    [JsonPropertyName("result")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Result { get; init; }

    [JsonPropertyName("error")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public JsonRpcErrorObject? Error { get; init; }

    [JsonPropertyName("id")]
    public object? Id { get; init; }
}
