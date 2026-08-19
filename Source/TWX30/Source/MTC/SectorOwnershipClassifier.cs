using System;

namespace MTC;

internal static class SectorOwnershipClassifier
{
    public static bool IsFriendlyOwner(string? owner, GameState? state)
    {
        if (string.IsNullOrWhiteSpace(owner) || owner == "-")
            return false;

        string trimmed = owner.Trim();
        if (trimmed.Equals("belong to your Corp", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("yours", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (state != null)
        {
            if (state.Corp > 0 && trimmed.Contains($"[{state.Corp}]", StringComparison.OrdinalIgnoreCase))
                return true;

            if (!string.IsNullOrWhiteSpace(state.TraderName) &&
                trimmed.Contains(state.TraderName, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    public static bool IsEnemyOwner(string? owner, GameState? state)
    {
        if (string.IsNullOrWhiteSpace(owner) || owner == "-")
            return false;

        string trimmed = owner.Trim();
        if (trimmed.Equals("unknown", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("none", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("unowned", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return !IsFriendlyOwner(trimmed, state);
    }
}
