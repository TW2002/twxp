/*
Copyright (C) 2005  Remco Mulder

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

For source notes please refer to Notes.txt
For license terms please refer to GPL.txt.

These files should be stored in the root of the compression you 
received this source in.
*/

using System;
using System.IO;
using TWXProxy.Core;

namespace TWXC
{
    class Program
    {
        static string StripFileExtension(string filename)
        {
            int lastDot = filename.LastIndexOf('.');
            if (lastDot > 0)
                return filename.Substring(0, lastDot);
            return filename;
        }

        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                // Display program description
                Console.WriteLine($"TWXC - TWX Proxy command line script compilation utility {Constants.DisplayVersion}");
                Console.WriteLine("       (c) Remco Mulder (\"Xide\") 2002-2004");
                Console.WriteLine("       (c) Matt Mosley (\"reaper\") 2026");
                Console.WriteLine();
                Console.WriteLine("Usage: TWXC script [descfile]");
                Console.WriteLine("   or: TWXC -compat script [descfile]");
                Console.WriteLine("   or: TWXC --precompile script [outfile]");
                Console.WriteLine("   or: TWXC --trim-includes script [descfile]");
                Console.WriteLine("   or: TWXC --prune-bytecode script [descfile]");
                Console.WriteLine("   or: TWXC --prune-include-branches script [descfile]");
                Console.WriteLine("   or: TWXC --strict-includes script [descfile]");
                Console.WriteLine();
                Console.WriteLine("script     - Filename of the script to be compiled, this is usually a .ts file.");
                Console.WriteLine("[descfile] - Optional filename of a description text file to be included in the");
                Console.WriteLine("             compilation.");
                Console.WriteLine("             Description files have no effect on the operation of the script,");
                Console.WriteLine("             but may provide useful information to users.");
                Console.WriteLine("[outfile]  - Optional output filename for --precompile. Defaults to .inc.");
                Console.WriteLine("-compat / --compat - Compile with legacy non-pruned bytecode for parity/debugging.");
                Console.WriteLine("--precompile - Produce a Pascal-compatible encrypted .inc include file.");
                Console.WriteLine("--trim-includes - Experimentally compile only reachable labels from includes.");
                Console.WriteLine("--prune-bytecode - Force post-compile unreachable-bytecode pruning (default behavior).");
                Console.WriteLine("--prune-include-branches - Experimental stronger include-branch pruning.");
                Console.WriteLine("                           Tracks direct label refs, triggers, and simple");
                Console.WriteLine("                           variable-held literal labels such as");
                Console.WriteLine("                           SETVAR $fn \":sub~myfunc\" + GOSUB $fn.");
                Console.WriteLine("--strict-includes - Fail compilation when static labels referenced by");
                Console.WriteLine("                    GOTO/GOSUB are missing, or when a non-local namespace");
                Console.WriteLine("                    target was not brought in by INCLUDE.");
                Console.WriteLine();
                Console.WriteLine("If the target .cts file already exists and compilation succeeds,");
                Console.WriteLine("TWXC replaces the existing file with the newly compiled output.");
                Console.WriteLine();
                return;
            }

            bool precompileMode = false;
            bool trimIncludes = false;
            bool compatMode = false;
            bool pruneBytecode = true;
            bool strictIncludes = false;
            bool pruneIncludeBranches = false;
            var positionalArgs = new System.Collections.Generic.List<string>();
            foreach (string arg in args)
            {
                if (string.Equals(arg, "--precompile", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(arg, "--encrypt-include", StringComparison.OrdinalIgnoreCase))
                {
                    precompileMode = true;
                    continue;
                }

                if (string.Equals(arg, "--trim-includes", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(arg, "--tree-shake-includes", StringComparison.OrdinalIgnoreCase))
                {
                    trimIncludes = true;
                    continue;
                }

                if (string.Equals(arg, "-compat", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(arg, "--compat", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(arg, "--legacy-bytecode", StringComparison.OrdinalIgnoreCase))
                {
                    compatMode = true;
                    pruneBytecode = false;
                    continue;
                }

                if (string.Equals(arg, "--prune-bytecode", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(arg, "--trim-bytecode", StringComparison.OrdinalIgnoreCase))
                {
                    pruneBytecode = true;
                    continue;
                }

                if (string.Equals(arg, "--strict-includes", StringComparison.OrdinalIgnoreCase))
                {
                    strictIncludes = true;
                    continue;
                }

                if (string.Equals(arg, "--prune-include-branches", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(arg, "--experimental-include-prune", StringComparison.OrdinalIgnoreCase))
                {
                    pruneIncludeBranches = true;
                    trimIncludes = true;
                    continue;
                }

                positionalArgs.Add(arg);
            }

            if (precompileMode)
            {
                if (positionalArgs.Count < 1 || positionalArgs.Count > 2)
                {
                    Console.WriteLine("Usage: TWXC --precompile script [outfile]");
                    Environment.ExitCode = 1;
                    return;
                }

                string inputFile = positionalArgs[0];
                string outputFile = positionalArgs.Count > 1
                    ? positionalArgs[1]
                    : StripFileExtension(inputFile) + ".inc";

                Console.WriteLine($"Precompiling and encrypting '{inputFile}' ...");

                try
                {
                    LegacyScriptEncryption.WriteEncryptedIncludeFile(inputFile, outputFile);
                    Console.WriteLine("Precompilation and encryption successful.");
                    Console.WriteLine();
                    Console.WriteLine($"Output file: {outputFile}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                    Environment.ExitCode = 1;
                }

                return;
            }

            if (positionalArgs.Count < 1 || positionalArgs.Count > 2)
            {
                Console.WriteLine("Usage: TWXC script [descfile]");
                Environment.ExitCode = 1;
                return;
            }

            var scriptRef = new ScriptRef();
            var scriptCmp = new ScriptCmp(scriptRef);
            scriptCmp.TrimIncludes = trimIncludes;
            scriptCmp.PruneBytecode = pruneBytecode;
            scriptCmp.StrictIncludes = strictIncludes;
            scriptCmp.PruneIncludeBranches = pruneIncludeBranches;
            bool compileOk = false;
            string fileOut = StripFileExtension(positionalArgs[0]);
            
            Console.WriteLine($"Compiling script '{fileOut}' ({(compatMode ? "compat" : "default-pruned")}) ...");

            try
            {
                string descFile = positionalArgs.Count > 1 ? positionalArgs[1] : string.Empty;
                scriptCmp.CompileFromFile(positionalArgs[0], descFile);
                compileOk = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                Environment.ExitCode = 1;
            }

            if (compileOk)
            {
                string ctsFile = fileOut + ".cts";
                string outputDir = Path.GetDirectoryName(Path.GetFullPath(ctsFile)) ?? Directory.GetCurrentDirectory();
                string tempFile = Path.Combine(outputDir, $".{Path.GetFileName(ctsFile)}.{Guid.NewGuid():N}.tmp");

                try
                {
                    scriptCmp.WriteToFile(tempFile);
                    File.Move(tempFile, ctsFile, overwrite: true);
                }
                catch
                {
                    try
                    {
                        if (File.Exists(tempFile))
                            File.Delete(tempFile);
                    }
                    catch
                    {
                    }

                    throw;
                }

                Console.WriteLine("Compilation successful.");
                Console.WriteLine();
                Console.WriteLine($"Output file: {ctsFile}");
                Console.WriteLine($"Code Size: {scriptCmp.CodeSize}");
                Console.WriteLine($"Lines: {scriptCmp.LineCount}");
                Console.WriteLine($"Definitions: {scriptCmp.ParamCount}");
                Console.WriteLine($"Commands: {scriptCmp.CmdCount}");
            }

            scriptCmp.Dispose();
        }
    }
}
