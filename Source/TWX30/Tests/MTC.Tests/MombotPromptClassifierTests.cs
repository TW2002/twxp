using MTC;

internal static class MombotPromptClassifierTests
{
    public static void Run()
    {
        string[] rejected =
        [
            "Command [TL=00:00:00]:[Main Menu] :",
            "Command [TL=00:00:00]:[Main Menu] : A",
            "Command [TL=00:00:00]:[Main Menu] : B",
            "Command [TL=00:00:00]:[Game Menu] (?=Help)? :",
            "Command [TL=00:00:00]:[0] (?=Help)? :",
            "Command [TL=00:00:00]:[-1] (?=Help)? :",
            "Command [TL=00:00:00]:[] (?=Help)? :",
            "Command [TL=00:00:00]:[999999999999999999] (?=Help)? :",
            "Selection (? for menu):",
            "Please enter your name (ENTER for none):",
            "Enter your choice:"
        ];
        foreach (string line in rejected)
        {
            Check(!MombotPromptClassifier.TryGetPromptName(line, out _), line);
            Check(!MombotPromptClassifier.IsStartupPrompt(line), line);
            Check(!MombotPromptClassifier.CanStartStartup(line, loginScriptLoaded: false), line);
            // Every TCP fragment of the WorldsApart menu must leave relog alone.
            for (int length = 0; length <= line.Length; length++)
                Check(!MombotPromptClassifier.IsCommandPrompt(line[..length]), line[..length]);
        }

        foreach (string line in new[]
        {
            "Command [TL=00:00:00]:[296] (?=Help)? :",
            "Command [TL=1234]:[1] (?=Help)? :",
            "Command [TL=00:00:00]:[1000000] (?=help)? :"
        })
        {
            for (int length = 0; length < line.Length; length++)
            {
                Check(!MombotPromptClassifier.TryGetPromptName(line[..length], out _), line[..length]);
                Check(!MombotPromptClassifier.IsStartupPrompt(line[..length]), line[..length]);
            }
            Check(MombotPromptClassifier.TryGetPromptName(line, out string prompt) && prompt == "Command", line);
            Check(MombotPromptClassifier.IsStartupPrompt(line), line);
            Check(MombotPromptClassifier.CanStartStartup(line, loginScriptLoaded: false), line);
            Check(!MombotPromptClassifier.CanStartStartup(line, loginScriptLoaded: true), "Relog still owns login");
        }

        Check(MombotPromptClassifier.IsStartupPrompt("Citadel command (?=help)"), "Citadel startup");
        Check(!MombotPromptClassifier.CanStartStartup("Citadel command (?=help)", loginScriptLoaded: true), "Citadel login ownership");
        Check(!MombotPromptClassifier.IsStartupPrompt("Citadel command (?=hel"), "Partial citadel");
        Check(!MombotPromptClassifier.IsStartupPrompt("Citadel treasury contains 0 credits."), "Treasury is not an input prompt");
        foreach (var (line, expected) in new[]
        {
            ("Citadel command (?=help)", "Citadel"),
            ("Planet command (?=help) [D]", "Planet"),
            ("Computer command [TL=00:00:00]:", "Computer")
        })
            Check(MombotPromptClassifier.TryGetPromptName(line, out string prompt) && prompt == expected, line);
    }

    private static void Check(bool condition, string description)
    {
        if (!condition)
            throw new InvalidOperationException($"Prompt classification failed: '{description}'");
    }
}
