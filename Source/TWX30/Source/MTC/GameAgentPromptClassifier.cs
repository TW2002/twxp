namespace MTC;

internal static class GameAgentPromptClassifier
{
    internal static bool IsMissionPrompt(string text)
    {
        string s = text.Trim();
        bool Starts(string prefix) => s.StartsWith(prefix, StringComparison.OrdinalIgnoreCase);
        bool Ends(string suffix) => s.EndsWith(suffix, StringComparison.OrdinalIgnoreCase);
        if (Starts("Attack ") && s.Contains(" (Y/N) ", StringComparison.OrdinalIgnoreCase) && Ends("[N]?"))
            return true;
        if (Starts("How many fighters do you wish to use (0 to ") && Ends(") [0]?"))
            return true;
        if (Starts("How many K-3A fighters do you want to buy (Max ") && Ends(") [0] ?"))
            return true;
        if (s.Equals("Are you sure you want to jettison all cargo? (Y/N)", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Which item do you wish to buy? (A,B,C,Q,?)", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Do you want instructions (Y/N) [N]?", StringComparison.OrdinalIgnoreCase))
            return true;
        if (s.Length >= 12 && s[0] == '[' && s[^1] == ']' &&
            s.AsSpan(1, s.Length - 2).IndexOfAnyExcept('-') < 0)
            return true; // Planet-name input ruler; consumers validate preceding context.
        return s.Equals("<StarDock> Where to? (?=Help)", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("<Shipyards> Your option (?) ?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("<Hardware Emporium> So what are you looking for (?) ?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Welcome to the 'yards', you want to trade in that old ship?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("You ready to deal?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Which ship are you interested in (?=List) ?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Which planet type are you interested in (?=List) ?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Want to buy it?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Should this be a (C)orporate ship or (P)ersonal ship?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Should this be a (C)orporate planet or (P)ersonal planet?", StringComparison.OrdinalIgnoreCase) ||
               (Starts("What do you want to name this ship?") && Ends("(30 chars)")) ||
               s.Equals("Do you want to set a password for this ship? (Y/N)", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Choose which ship to beam to (Q=Quit)", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Choose which ship to sell (Q=Quit)", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Still interested ?", StringComparison.OrdinalIgnoreCase) ||
               (Starts("How many Genesis Torpedoes do you want (Max ") && Ends(") [0] ?")) ||
               (Starts("How many Atomic Detonators do you want (Max ") && Ends(") [0] ?")) ||
               s.Equals("Planetary Attack Command [Q]", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("<DANGER> Are you sure you want to do this?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Do you wish to launch one (Y/N) [N]?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Land on which planet <Q to abort> ?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Do you wish to (L)eave or (T)ake Colonists? [T] (Q to leave)", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("Display planet?", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("(L)eave or (T)ake Colonists? [L]", StringComparison.OrdinalIgnoreCase) ||
               s.Equals("(1)Ore, (2)Org or (3)Equipment Production?", StringComparison.OrdinalIgnoreCase) ||
               (Starts("How many groups of Colonists do you want to ") && Ends(") ?"));
    }

    // Observation labels, not authorization to respond. Consumers must still
    // validate complete grammar and the current guarded prompt timestamp.
    internal static bool IsEconomicPrompt(string text)
    {
        string s = text.Trim();
        bool Starts(string prefix) => s.StartsWith(prefix, StringComparison.OrdinalIgnoreCase);
        bool Ends(string suffix) => s.EndsWith(suffix, StringComparison.OrdinalIgnoreCase);
        return (Starts("Select (H)olo Scan") && Ends("[D]")) ||
               s.Equals("Enter your choice [T] ?", StringComparison.OrdinalIgnoreCase) ||
               (Starts("How many holds of ") &&
                (s.Contains(" do you want to buy [", StringComparison.OrdinalIgnoreCase) ||
                 s.Contains(" do you want to sell [", StringComparison.OrdinalIgnoreCase)) && Ends("]?")) ||
               (Starts("Your offer [") && Ends("] ?")) ||
               (Starts("Do you want to make this jump blind?") && Ends("?")) ||
               (Starts("Do you want to engage the TransWarp drive?") && Ends("?")) ||
               (Starts("Engage the AutoPilot?") && Ends("[Y]"));
    }
}
