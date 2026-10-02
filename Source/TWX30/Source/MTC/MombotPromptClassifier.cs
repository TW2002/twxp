using System;
using System.Globalization;

namespace MTC;

internal static class MombotPromptClassifier
{
    public static bool IsCommandPrompt(string line)
    {
        if (!line.StartsWith("Command [TL=", StringComparison.OrdinalIgnoreCase))
            return false;

        int timeEnd = line.IndexOf(']');
        if (timeEnd < 0)
            return false;

        ReadOnlySpan<char> remainder = line.AsSpan(timeEnd + 1).TrimStart();
        if (!remainder.StartsWith(":[", StringComparison.Ordinal))
            return false;

        int sectorEnd = remainder.IndexOf(']');
        if (sectorEnd < 0 ||
            !int.TryParse(remainder.Slice(2, sectorEnd - 2), NumberStyles.None,
                CultureInfo.InvariantCulture, out int sector) || sector <= 0)
        {
            return false;
        }

        // WorldsApart uses [Main Menu] here. Also wait for the rest of a
        // numeric-sector prompt before permitting startup traffic.
        return remainder[(sectorEnd + 1)..].TrimStart()
            .StartsWith("(?=Help)? :", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsStartupPrompt(string line)
        => IsCommandPrompt(line) ||
           line.StartsWith("Citadel command (?=help)", StringComparison.OrdinalIgnoreCase);

    public static bool CanStartStartup(string line, bool loginScriptLoaded)
        => !loginScriptLoaded && IsStartupPrompt(line);

    public static bool TryGetPromptName(string line, out string promptName)
    {
        promptName = string.Empty;
        if (string.IsNullOrWhiteSpace(line))
            return false;

        if (IsCommandPrompt(line))
        {
            promptName = "Command";
            return true;
        }

        if (line.StartsWith("Computer command [TL=", StringComparison.OrdinalIgnoreCase))
        {
            promptName = "Computer";
            return true;
        }

        if (line.StartsWith("Citadel command (", StringComparison.OrdinalIgnoreCase) ||
            line.Contains("<Enter Citadel>", StringComparison.OrdinalIgnoreCase) ||
            line.Contains("Citadel treasury contains", StringComparison.OrdinalIgnoreCase))
        {
            promptName = "Citadel";
            return true;
        }

        int commandIndex = line.IndexOf(" command (", StringComparison.OrdinalIgnoreCase);
        if (commandIndex > 0)
        {
            string candidate = line[..commandIndex].Trim();
            if (!string.IsNullOrWhiteSpace(candidate))
            {
                promptName = candidate;
                return true;
            }
        }

        return false;
    }
}
