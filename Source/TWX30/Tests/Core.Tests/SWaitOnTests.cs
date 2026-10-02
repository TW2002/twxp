using TWXProxy.Core;

internal static class SWaitOnTests
{
    private static readonly string[] Source =
    [
        "setvar $prefix \"READY\"",
        "swaiton $prefix&\" prompt\"",
        "waiton \"anywhere\"",
        "swaiton \"NEXT\"",
        "halt"
    ];

    public static void CompileAndRoundTrip()
    {
        Directory.SetCurrentDirectory(AppContext.BaseDirectory);
        var refs = new ScriptRef();
        Check(refs.FindCmd("WAITON") == 157 && refs.FindCmd("SETSTRIGGER") == 164 &&
            refs.FindCmd("SETSLINETRIGGER") == 165 && refs.CmdCount == 166, "Command IDs changed");
        using var cmp = new ScriptCmp(refs);
        cmp.CompileFromStrings(Source.ToList(), "waits.ts");
        Check(BitConverter.ToUInt16(cmp.WriteToBytes(), 12) == 8, "CTS version changed");
        string[] commands = cmp.PrepareForExecution()!.Instructions.Select(x => x.CommandName).ToArray();
        Check(commands.Count(x => x == "SETSTRIGGER") == 2 && commands.Count(x => x == "SETTEXTTRIGGER") == 1,
            "Wrong macro trigger expansion");
        Check(cmp.LabelList.Select(x => x.Name).Distinct().Count() == cmp.LabelList.Count, "Wait labels collide");
        using var legacy = new ScriptCmp(refs);
        legacy.LoadFromBytes(cmp.WriteToBytes(7), "waits-v7.cts");
        Check(cmp.LastOutputConvertedTriggerCount == 2, "SWAITON did not follow explicit version-7 trigger downgrade");
        Check(legacy.PrepareForExecution()!.Instructions.Count(x => x.CommandName == "SETTEXTTRIGGER") == 3,
            "Wrong version-7 expansion");

        string dir = Path.Combine(Path.GetTempPath(), "twx-swaiton-roundtrip-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        try
        {
            string binary = Path.Combine(dir, "waits.cts");
            string source = Path.Combine(dir, "waits.ts");
            cmp.WriteToFile(binary);
            var decompiler = new TWXD.ScriptDecompiler(refs);
            decompiler.LoadFromFile(binary);
            decompiler.DecompileToFile(source);
            string text = File.ReadAllText(source);
            Check(text.Split('\n').Count(x => x.TrimStart().StartsWith("swaiton ")) == 2,
                "Decompiler lost SWAITON semantics");
            using var roundTrip = new ScriptCmp(refs);
            roundTrip.CompileFromFile(source, "");
            Check(roundTrip.PrepareForExecution()!.Instructions.Count(x => x.CommandName == "SETSTRIGGER") == 2,
                "Recompiled decompilation lost start matching");
        }
        finally
        {
            Directory.SetCurrentDirectory(AppContext.BaseDirectory);
            Directory.Delete(dir, true);
        }

        foreach (string invalid in new[] { "swaiton", "swaiton \"a\" \"b\"" })
        {
            using var bad = new ScriptCmp(refs);
            bool rejected = false;
            try { bad.CompileFromStrings([invalid], "bad.ts"); }
            catch (Exception ex) { rejected = ex.Message.Contains("SWAITON", StringComparison.OrdinalIgnoreCase); }
            Check(rejected, "Invalid SWAITON arguments were accepted");
        }
    }

    public static void Execute(bool prepared)
    {
        Directory.SetCurrentDirectory(AppContext.BaseDirectory);
        string dir = Path.Combine(Path.GetTempPath(), "twx-swaiton-run-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        var context = new TwxRuntimeContext("swaiton-test");
        using var scope = GlobalModules.UseRuntimeContext(context);
        using var interpreter = new ModInterpreter { RuntimeContext = context, ProgramDir = dir, ScriptDirectory = dir };
        try
        {
            string marker = Path.Combine(dir, "marker.txt");
            string main = Path.Combine(dir, "main.ts");
            File.WriteAllText(main, "gosub :helper~run\nhalt\ninclude \"helper.ts\"\n");
            File.WriteAllText(Path.Combine(dir, "helper.ts"),
                $":run\nsetvar $prefix \"READY\"\nswaiton $prefix&\" prompt\"\nwrite \"{marker}\" \"first\"\n" +
                $"waiton \"anywhere\"\nwrite \"{marker}\" \"second\"\nswaiton \"NEXT\"\nwrite \"{marker}\" \"third\"\nreturn\n");
            interpreter.LoadAtLabel(main, true, string.Empty, script => script.PreferPreparedExecution = prepared);
            foreach (string rejected in new[] { "not READY prompt", " READY prompt", "ready prompt", "REA" })
                interpreter.DispatchPartialLine(rejected, rejected, false);
            Check(!File.Exists(marker), "SWAITON accepted a non-prefix or incomplete match");
            interpreter.DispatchPartialLine("READY prompt", "\x1b[35mREADY prompt", false);
            Check(File.ReadAllLines(marker).Length == 1, "SWAITON did not resume on a partial-line prefix");
            interpreter.DispatchCompleteLine("READY prompt", "\x1b[35mREADY prompt", false);
            interpreter.DispatchCompleteLine("text anywhere in line", "text anywhere in line", false);
            Check(File.ReadAllLines(marker).Length == 2, "Ordinary WAITON stopped matching substrings");
            interpreter.DispatchCompleteLine("not NEXT", "not NEXT", false);
            Check(File.ReadAllLines(marker).Length == 2, "Second SWAITON matched a substring");
            interpreter.DispatchCompleteLine("NEXT complete", "NEXT complete", false);
            Check(File.ReadAllLines(marker).Length == 3 && interpreter.Count == 0,
                "Namespaced/consecutive SWAITON failed to resume and return");
        }
        finally
        {
            interpreter.StopAll(true);
            Directory.SetCurrentDirectory(AppContext.BaseDirectory);
            Directory.Delete(dir, true);
        }
    }

    private static void Check(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
}
