using System;
using Core = TWXProxy.Core;

namespace MTC.mombot;

internal sealed record mombotSettings(
    string BotName,
    string TeamName,
    string LoginPassword,
    string BotPassword,
    int SubspaceChannel)
{
    public static mombotSettings Load()
        => Load(null);

    public static mombotSettings Load(Core.TwxRuntimeContext? runtimeContext)
    {
        string botName = Read(runtimeContext, "$BOT~BOT_NAME", "mombot");
        string teamName = Read(runtimeContext, "$BOT~BOT_TEAM_NAME", botName);
        string loginPassword = Read(runtimeContext, "$BOT~PASSWORD", string.Empty);
        string botPassword = Read(runtimeContext, "$BOT~BOT_PASSWORD", string.Empty);
        int subspace = ParseInt(Read(runtimeContext, "$BOT~SUBSPACE", "0"));

        if (string.IsNullOrWhiteSpace(teamName))
            teamName = botName;

        if (string.IsNullOrWhiteSpace(botPassword) && subspace > 0)
            botPassword = subspace.ToString();

        return new mombotSettings(botName, teamName, loginPassword, botPassword, subspace);
    }

    private static string Read(Core.TwxRuntimeContext? runtimeContext, string name, string fallback)
    {
        string value = Core.ScriptRef.GetCurrentGameVar(runtimeContext, name, fallback);
        return string.IsNullOrWhiteSpace(value) ? fallback : value;
    }

    private static int ParseInt(string value)
    {
        return int.TryParse(value, out int result) ? result : 0;
    }
}
