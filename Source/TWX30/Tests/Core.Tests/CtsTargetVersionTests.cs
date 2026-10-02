using TWXProxy.Core;

internal static class CtsTargetVersionTests
{
    public static void Run()
    {
        using var compiler = new ScriptCmp();
        compiler.CompileFromStrings(["setVar $value 7", "add $value 2", "halt"], "target-test.ts");
        byte[] current = compiler.WriteToBytes();
        byte[] legacy = compiler.WriteToBytes(7);
        Check(BitConverter.ToUInt16(current, 12) == 8, "Default format changed");
        Check(BitConverter.ToUInt16(legacy, 12) == 7, "Target header not written");
        legacy[12] = 8;
        Check(legacy.SequenceEqual(current), "Target changed more than the format header");
        using var reloaded = new ScriptCmp();
        reloaded.LoadFromBytes(compiler.WriteToBytes(7), "target-test.cts");
        Check(reloaded.Version == 7 && reloaded.Code.SequenceEqual(compiler.Code), "Version-7 roundtrip failed");
        foreach (int invalid in new[] { -1, 0, 6, 9 })
        {
            try { compiler.WriteToBytes(invalid); throw new Exception("Invalid version accepted"); }
            catch (ArgumentOutOfRangeException) { }
        }

        string dir = Path.Combine(Path.GetTempPath(), "twxc-target-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        try
        {
            foreach (string command in new[] { "setSTrigger", "setSLineTrigger" })
            {
                string include = Path.Combine(dir, "helper.ts");
                File.WriteAllText(include, $":start\n{command} trigger :done \"setstrigger prompt\"\npause\n:done\nreturn\n");
                string source = Path.Combine(dir, "main.ts");
                File.WriteAllText(source, "gosub :helper~start\nhalt\ninclude \"helper.ts\"\n");
                using var newer = new ScriptCmp(scriptDirectory: dir);
                newer.CompileFromFile(source, "");
                byte[] original = newer.WriteToBytes(8);
                Check(BitConverter.ToUInt16(original, 12) == 8, "Current trigger compile failed");
                string output = Path.Combine(dir, "main.cts");
                File.WriteAllBytes(output, current);
                try { newer.WriteToFile(output, 6); throw new Exception("Invalid version accepted"); }
                catch (ArgumentOutOfRangeException) { }
                Check(File.ReadAllBytes(output).SequenceEqual(current), "Failed target compile replaced existing output");
                newer.WriteToFile(output, 7);
                Check(newer.LastOutputConvertedTriggerCount == 1, "Missing conversion diagnostic");
                Check(File.ReadAllBytes(output).SequenceEqual(newer.WriteToBytes(7)), "File/bytes output differs");
                Check(newer.WriteToBytes(8).SequenceEqual(original), "Downgrade mutated default bytecode");
                Check(newer.LastOutputConvertedTriggerCount == 0, "Conversion diagnostic not reset");

                using var converted = new ScriptCmp();
                converted.LoadFromFile(output);
                string replacement = command == "setSTrigger" ? "SETTEXTTRIGGER" : "SETTEXTLINETRIGGER";
                var before = newer.PrepareForExecution()!.Instructions;
                var after = converted.PrepareForExecution()!.Instructions;
                Check(before.Length == after.Length, "Instruction count changed");
                var expectedCode = (byte[])newer.Code.Clone();
                bool found = false;
                for (int i = 0; i < before.Length; i++)
                {
                    Check(before[i].RawOffset == after[i].RawOffset && before[i].RawEndOffset == after[i].RawEndOffset,
                        "Instruction offsets changed");
                    if (before[i].CommandName != command.ToUpperInvariant()) continue;
                    found = true;
                    Check(after[i].CommandName == replacement, "Wrong legacy opcode");
                    expectedCode[before[i].RawOffset + 3] = (byte)after[i].CommandId;
                    expectedCode[before[i].RawOffset + 4] = (byte)(after[i].CommandId >> 8);
                }
                Check(found && converted.Code.SequenceEqual(expectedCode), "Unexpected bytecode changes");
                Check(converted.ParamList.Select(p => p.Value).SequenceEqual(newer.ParamList.Select(p => p.Value)),
                    "Conversion changed operands or literal text");
            }
        }
        finally { Directory.Delete(dir, recursive: true); }
    }

    private static void Check(bool value, string message)
    {
        if (!value) throw new Exception(message);
    }
}
