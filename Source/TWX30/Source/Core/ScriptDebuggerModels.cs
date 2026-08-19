namespace TWXProxy.Core;

public sealed record ScriptVariableInfo(
    string Name,
    string Value,
    bool HasChildren,
    int Depth);

public sealed record ScriptTriggerInfo(
    TriggerType Type,
    string Name,
    string Value,
    string LabelName,
    string Response,
    string Param,
    int LifeCycle);

public sealed record ScriptDebuggerSnapshot(
    int Id,
    string Name,
    string Reference,
    bool IsSystemScript,
    bool IsBot,
    bool Paused,
    PauseReason PauseReason,
    bool WaitingForInput,
    bool WaitingForAuth,
    bool WaitForActive,
    bool KeypressMode,
    int SubStackDepth,
    string WaitText,
    long LastExecutionTicks,
    int LastExecutionCommandCount,
    int LastExecutionResolvedParamCount,
    bool LastExecutionUsedPrepared,
    bool LastExecutionCompleted,
    IReadOnlyList<ScriptVariableInfo> Variables,
    IReadOnlyList<ScriptTriggerInfo> Triggers);
