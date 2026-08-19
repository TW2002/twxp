/*
Copyright (C) 2026  Matt Mosley

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
using System.Collections.Generic;
using System.IO;
using System.Text;
using TWXProxy.Core;

namespace TWXD
{
    class Program
    {
        static string GetDefaultCurrentDirectoryOutputFilename(string inputFile)
        {
            string stem = Path.GetFileNameWithoutExtension(inputFile);
            if (string.IsNullOrWhiteSpace(stem))
                stem = "decompiled";

            return Path.Combine(Directory.GetCurrentDirectory(), stem + ".ts");
        }

        static string GetUniqueFilename(string baseName)
        {
            // If .ts doesn't exist, use it
            string filename = baseName + ".ts";
            if (!File.Exists(filename))
                return filename;

            // Otherwise try .ts_1, .ts_2, etc.
            int counter = 1;
            while (true)
            {
                filename = $"{baseName}.ts_{counter}";
                if (!File.Exists(filename))
                    return filename;
                counter++;
            }
        }

        static string GetDefaultOutputFilename(string baseName)
        {
            return baseName + ".ts";
        }

        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                // Display program description
                Console.WriteLine($"TWXD - TWX Proxy decompilation utility {Constants.DisplayVersion}");
                Console.WriteLine("       (c) Matt Mosley (\"reaper\") 2026");
                Console.WriteLine();
                Console.WriteLine("Usage: TWXD [--compact-whitespace] [--in-place] [--output <file.ts> | --output-dir <dir>] [--backup-existing | --overwrite-existing] script.cts");
                Console.WriteLine();
                Console.WriteLine("script.cts - Filename of the compiled script to be decompiled.");
                Console.WriteLine();
                Console.WriteLine("By default, TWXD writes decompiled output to the current directory.");
                Console.WriteLine("--in-place - Write the .ts file next to the .cts input.");
                Console.WriteLine("--output <file.ts> - Write the main script to an explicit file path.");
                Console.WriteLine("--output-dir <dir> - Write the main script into an explicit directory.");
                Console.WriteLine("--backup-existing - If the chosen .ts file exists, use .ts_1, .ts_2, etc.");
                Console.WriteLine("--overwrite-existing - Overwrite the chosen .ts file if it already exists.");
                Console.WriteLine("--compact-whitespace - Remove leading blank lines and collapse repeated blank lines.");
                Console.WriteLine();
                return;
            }

            bool compactWhitespace = false;
            bool backupExisting = false;
            bool overwriteExisting = false;
            bool inPlace = false;
            string? explicitOutputFile = null;
            string? explicitOutputDirectory = null;
            var positionalArgs = new List<string>();

            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];
                if (string.Equals(arg, "--compact-whitespace", StringComparison.OrdinalIgnoreCase))
                {
                    compactWhitespace = true;
                    continue;
                }

                if (string.Equals(arg, "--backup-existing", StringComparison.OrdinalIgnoreCase))
                {
                    backupExisting = true;
                    continue;
                }

                if (string.Equals(arg, "--overwrite-existing", StringComparison.OrdinalIgnoreCase))
                {
                    overwriteExisting = true;
                    continue;
                }

                if (string.Equals(arg, "--in-place", StringComparison.OrdinalIgnoreCase))
                {
                    inPlace = true;
                    continue;
                }

                if (string.Equals(arg, "--output", StringComparison.OrdinalIgnoreCase))
                {
                    if (i + 1 >= args.Length)
                    {
                        Console.WriteLine("Error: --output requires a file path.");
                        return;
                    }

                    explicitOutputFile = args[++i];
                    continue;
                }

                if (string.Equals(arg, "--output-dir", StringComparison.OrdinalIgnoreCase))
                {
                    if (i + 1 >= args.Length)
                    {
                        Console.WriteLine("Error: --output-dir requires a directory path.");
                        return;
                    }

                    explicitOutputDirectory = args[++i];
                    continue;
                }

                positionalArgs.Add(arg);
            }

            if (positionalArgs.Count != 1)
            {
                Console.WriteLine("Usage: TWXD [--compact-whitespace] [--in-place] [--output <file.ts> | --output-dir <dir>] [--backup-existing | --overwrite-existing] script.cts");
                return;
            }

            if ((backupExisting ? 1 : 0) + (overwriteExisting ? 1 : 0) > 1)
            {
                Console.WriteLine("Error: Choose only one of --backup-existing or --overwrite-existing.");
                return;
            }

            int outputModeCount = (inPlace ? 1 : 0) + (explicitOutputFile != null ? 1 : 0) + (explicitOutputDirectory != null ? 1 : 0);
            if (outputModeCount > 1)
            {
                Console.WriteLine("Error: Choose only one of --in-place, --output, or --output-dir.");
                return;
            }

            string inputFile = positionalArgs[0];
            if (!File.Exists(inputFile))
            {
                Console.WriteLine($"Error: File '{inputFile}' not found.");
                return;
            }

            // Remove .cts extension if present
            string baseName = inputFile;
            if (baseName.EndsWith(".cts", StringComparison.OrdinalIgnoreCase))
                baseName = baseName.Substring(0, baseName.Length - 4);

            string outputFile;
            if (explicitOutputFile != null)
            {
                outputFile = explicitOutputFile;
            }
            else if (explicitOutputDirectory != null)
            {
                outputFile = Path.Combine(explicitOutputDirectory, Path.GetFileName(GetDefaultOutputFilename(baseName)));
            }
            else if (inPlace)
            {
                outputFile = GetDefaultOutputFilename(baseName);
            }
            else
            {
                outputFile = GetDefaultCurrentDirectoryOutputFilename(inputFile);
            }

            outputFile = Path.GetFullPath(outputFile);
            string outputBaseName = outputFile.EndsWith(".ts", StringComparison.OrdinalIgnoreCase)
                ? outputFile.Substring(0, outputFile.Length - 3)
                : outputFile;
            if (backupExisting)
                outputFile = GetUniqueFilename(outputBaseName);

            if (File.Exists(outputFile) && !overwriteExisting && !backupExisting)
            {
                Console.WriteLine($"Error: Refusing to overwrite existing file '{outputFile}'. Use --overwrite-existing, --backup-existing, --output, or --output-dir.");
                return;
            }

            string outputDirectory = Path.GetDirectoryName(Path.GetFullPath(outputFile)) ?? Directory.GetCurrentDirectory();
            Directory.CreateDirectory(outputDirectory);
            string tempOutputFile = Path.Combine(outputDirectory, $".{Path.GetFileName(outputFile)}.{Guid.NewGuid():N}.tmp");

            Console.WriteLine($"Decompiling '{inputFile}' to '{outputFile}' ...");

            try
            {
                var scriptRef = new ScriptRef();
                var decompiler = new ScriptDecompiler(scriptRef);
                decompiler.CompactWhitespace = compactWhitespace;
                decompiler.BackupExisting = backupExisting;
                decompiler.OverwriteExisting = overwriteExisting;
                
                decompiler.LoadFromFile(inputFile);
                var generatedFiles = decompiler.DecompileToFile(tempOutputFile);

                if (File.Exists(outputFile))
                {
                    if (overwriteExisting)
                    {
                        File.Delete(outputFile);
                    }
                    else if (!backupExisting)
                    {
                        throw new IOException($"Refusing to overwrite existing file '{outputFile}'. Use --overwrite-existing, --backup-existing, --output, or --output-dir.");
                    }
                }

                File.Move(tempOutputFile, outputFile);

                Console.WriteLine("Decompilation successful.");
                Console.WriteLine();
                Console.WriteLine($"Output file: {outputFile}");
                if (generatedFiles.Count > 1)
                {
                    Console.WriteLine($"Extracted include files: {generatedFiles.Count - 1}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                
                // Delete temp output file on error if it was created.
                if (File.Exists(tempOutputFile))
                {
                    try
                    {
                        File.Delete(tempOutputFile);
                    }
                    catch
                    {
                        // Ignore deletion errors
                    }
                }
            }
        }
    }
}
