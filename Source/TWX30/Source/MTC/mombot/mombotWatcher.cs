using System;
using System.Collections.Generic;
using Core = TWXProxy.Core;

namespace MTC.mombot;

internal sealed class mombotWatcher
{
    private const string UnderAttackLead = "Shipboard Computers";
    private const string UnderAttackTail = "is powering up weapons systems!";

    private Core.GameInstance? _gameInstance;
    private Core.ModDatabase? _database;
    private readonly Core.TwxRuntimeContext _runtimeContext;

    public mombotWatcher(Core.TwxRuntimeContext? runtimeContext = null)
    {
        _runtimeContext = runtimeContext ?? Core.GlobalModules.CurrentContext;
    }

    public bool IsAttached => _gameInstance != null;

    public IReadOnlyList<string> Responsibilities { get; } = new[]
    {
        "Subspace/channel tracking",
        "Fig, mine, bust, and LRA sector markers",
        "Ship and planet number capture",
        "Planet movement updates",
        "Watcher-style auto-restart/health checks",
        "Emergency reboot handling",
    };

    public void Attach(Core.GameInstance? gameInstance, Core.ModDatabase? database)
    {
        _gameInstance = gameInstance;
        _database = database;
    }

    public void Detach()
    {
        _gameInstance = null;
        _database = null;
    }

    public bool ObserveServerLine(string line)
    {
        _ = _database;

        if (string.IsNullOrWhiteSpace(line))
            return false;

        string trimmed = line.TrimStart();
        if (trimmed.StartsWith(">", StringComparison.Ordinal) ||
            trimmed.StartsWith("Received from Shipboard Computers", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (trimmed.StartsWith(UnderAttackLead, StringComparison.Ordinal) ||
            trimmed.Contains(UnderAttackTail, StringComparison.Ordinal))
        {
            SetRedAlertVars("TRUE");
            return true;
        }

        return false;
    }

    private void SetRedAlertVars(string value)
    {
        PersistCurrentGameVar("$BOT~REDALERT", value);
        PersistCurrentGameVar("$BOT~redalert", value);
        PersistCurrentGameVar("$bot~redalert", value);
        PersistCurrentGameVar("$redalert", value);
    }

    private void PersistCurrentGameVar(string name, string value)
    {
        Core.ScriptRef.SetCurrentGameVar(_runtimeContext, name, value);
        Core.ScriptRef.InvokeOnVariableSaved(_runtimeContext, name, value);
    }
}
