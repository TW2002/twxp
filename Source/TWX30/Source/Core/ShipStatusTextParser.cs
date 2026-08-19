namespace TWXProxy.Core;

internal static class ShipStatusTextParser
{
    private const string YouHavePrefix = "You have ";
    private const string CreditsToken = " credits";
    private const string EmptyHoldsToken = "empty cargo holds";

    public static bool TryParseLiveCreditsLine(string line, out long credits, out int? emptyHolds)
    {
        credits = 0;
        emptyHolds = null;

        if (string.IsNullOrWhiteSpace(line))
            return false;

        string trimmed = line.Trim();
        if (!trimmed.StartsWith(YouHavePrefix, StringComparison.OrdinalIgnoreCase))
            return false;

        int numberStart = YouHavePrefix.Length;
        int numberEnd = numberStart;
        while (numberEnd < trimmed.Length && IsCommaNumberChar(trimmed[numberEnd]))
            numberEnd++;

        if (numberEnd == numberStart)
            return false;

        if (!HasTokenAt(trimmed, numberEnd, CreditsToken))
            return false;

        if (!TryParseCommaLong(trimmed.AsSpan(numberStart, numberEnd - numberStart), out credits))
            return false;

        string rest = trimmed[(numberEnd + CreditsToken.Length)..];
        if (TryParseEmptyHolds(rest, out int holds))
            emptyHolds = holds;

        return true;
    }

    private static bool TryParseEmptyHolds(string rest, out int holds)
    {
        holds = 0;
        int marker = rest.IndexOf(EmptyHoldsToken, StringComparison.OrdinalIgnoreCase);
        if (marker < 0)
            return false;

        int numberEnd = marker;
        while (numberEnd > 0 && char.IsWhiteSpace(rest[numberEnd - 1]))
            numberEnd--;

        int numberStart = numberEnd;
        while (numberStart > 0 && IsCommaNumberChar(rest[numberStart - 1]))
            numberStart--;

        if (numberStart == numberEnd)
            return false;

        return TryParseCommaInt(rest.AsSpan(numberStart, numberEnd - numberStart), out holds);
    }

    private static bool HasTokenAt(string text, int index, string token)
    {
        if (index < 0 || index + token.Length > text.Length)
            return false;

        return string.Compare(text, index, token, 0, token.Length, StringComparison.OrdinalIgnoreCase) == 0;
    }

    private static bool IsCommaNumberChar(char ch)
    {
        return char.IsDigit(ch) || ch == ',';
    }

    private static bool TryParseCommaInt(ReadOnlySpan<char> text, out int value)
    {
        value = 0;
        if (!TryParseCommaLong(text, out long parsed) || parsed > int.MaxValue)
            return false;

        value = (int)parsed;
        return true;
    }

    private static bool TryParseCommaLong(ReadOnlySpan<char> text, out long value)
    {
        value = 0;
        bool sawDigit = false;

        foreach (char ch in text)
        {
            if (ch == ',')
                continue;

            if (!char.IsDigit(ch))
                return false;

            sawDigit = true;
            int digit = ch - '0';
            if (value > (long.MaxValue - digit) / 10)
                return false;

            value = (value * 10) + digit;
        }

        return sawDigit;
    }
}
