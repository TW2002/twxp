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
using System.Linq;
using System.Text;
using TWXProxy.Core;

namespace TWXD
{
    public class ScriptDecompiler
    {
        public bool CompactWhitespace { get; set; }
        public bool BackupExisting { get; set; }
        public bool OverwriteExisting { get; set; }

        private sealed class ScriptSegment
        {
            public ScriptSegment(byte scriptID, int start, int end, string includeName)
            {
                ScriptID = scriptID;
                Start = start;
                End = end;
                IncludeName = includeName;
            }

            public byte ScriptID { get; }
            public int Start { get; }
            public int End { get; }
            public string IncludeName { get; }
        }

        private static readonly HashSet<string> BareScriptConsts = new(StringComparer.Ordinal)
        {
            "ANSI_0", "ANSI_1", "ANSI_2", "ANSI_3", "ANSI_4", "ANSI_5", "ANSI_6", "ANSI_7",
            "ANSI_8", "ANSI_9", "ANSI_10", "ANSI_11", "ANSI_12", "ANSI_13", "ANSI_14", "ANSI_15",
            "CONNECTED", "CURRENTANSILINE", "CURRENTLINE", "DATE", "FALSE", "GAME", "GAMENAME",
            "LICENSENAME", "LOGINNAME", "PASSWORD", "PORT.CLASS", "PORT.BUYFUEL", "PORT.BUYORG",
            "PORT.BUYEQUIP", "PORT.EXISTS", "PORT.FUEL", "PORT.NAME", "PORT.ORG", "PORT.EQUIP",
            "PORT.PERCENTFUEL", "PORT.PERCENTORG", "PORT.PERCENTEQUIP", "SECTOR.ANOMOLY",
            "SECTOR.BACKDOORCOUNT", "SECTOR.BACKDOORS", "SECTOR.DENSITY", "SECTOR.EXPLORED",
            "SECTOR.FIGS.OWNER", "SECTOR.FIGS.QUANTITY", "SECTOR.LIMPETS.OWNER",
            "SECTOR.LIMPETS.QUANTITY", "SECTOR.MINES.OWNER", "SECTOR.MINES.QUANTITY",
            "SECTOR.NAVHAZ", "SECTOR.PLANETCOUNT", "SECTOR.PLANETS", "SECTOR.SHIPCOUNT",
            "SECTOR.SHIPS", "SECTOR.TRADERCOUNT", "SECTOR.TRADERS", "SECTOR.UPDATED",
            "SECTOR.WARPCOUNT", "SECTOR.WARPS", "SECTOR.WARPSIN", "SECTOR.WARPINCOUNT",
            "SECTORS", "STARDOCK", "TIME", "TRUE", "ALPHACENTAURI", "CURRENTSECTOR", "RYLOS",
            "PORT.BUILDTIME", "PORT.UPDATED", "RAWPACKET", "SECTOR.BEACON",
            "SECTOR.CONSTELLATION", "SECTOR.FIGS.TYPE", "SECTOR.ANOMALY", "EOF"
        };

        private ScriptRef _scriptRef;
        private ScriptCmp? _scriptCmp;
        private byte[] _code = Array.Empty<byte>();
        private List<CmdParam> _paramList = new List<CmdParam>();
        private List<ScriptLabel> _labelList = new List<ScriptLabel>();
        private List<string> _includeScriptList = new List<string>();
        private string _description = string.Empty;
        private int _codeSize;
        private int _codePos;

        public ScriptDecompiler(ScriptRef scriptRef)
        {
            _scriptRef = scriptRef;
        }

        public void LoadFromFile(string filename)
        {
            // Delegate entirely to ScriptCmp so that header parsing, version
            // validation, param/label/include reading is identical in both
            // TWXP and twxd — no duplicated CTS-reading logic.
            var cmp = new ScriptCmp(_scriptRef);
            cmp.LoadFromFile(filename);
            _scriptCmp        = cmp;

            _code             = cmp.Code;
            _codeSize         = cmp.CodeSize;
            _paramList        = cmp.ParamList;
            _labelList        = cmp.LabelList;
            _includeScriptList = cmp.IncludeScriptList;
            _description      = cmp.DescriptionText;
        }

        private string ApplyEncryption(string text, int key)
        {
            var result = new StringBuilder();
            foreach (char c in text)
            {
                result.Append((char)(c ^ key));
            }
            return result.ToString();
        }

        private static string GetUniqueFilePath(string fullPath)
        {
            if (!File.Exists(fullPath))
                return fullPath;

            string directory = Path.GetDirectoryName(fullPath) ?? Directory.GetCurrentDirectory();
            string ext = Path.GetExtension(fullPath);
            string baseName = Path.GetFileNameWithoutExtension(fullPath);

            int counter = 1;
            while (true)
            {
                string candidate = ext.Equals(".ts", StringComparison.OrdinalIgnoreCase)
                    ? Path.Combine(directory, $"{baseName}{ext}_{counter}")
                    : Path.Combine(directory, $"{baseName}_{counter}{ext}");

                if (!File.Exists(candidate))
                    return candidate;

                counter++;
            }
        }

        public IReadOnlyList<string> DecompileToFile(string filename)
        {
            var generatedFiles = new List<string>();

            try
            {
                var segments = GetScriptSegments();
                if (segments.Count == 0)
                {
                    DecompileSegment(new ScriptSegment(0, 0, _codeSize, GetScriptName(0)), filename, false, true, null);
                    NormalizeElseWhileChains(filename);
                    if (CompactWhitespace)
                        NormalizeWhitespace(filename);
                    generatedFiles.Add(filename);
                    return generatedFiles;
                }

                var scriptGroups = segments
                    .GroupBy(segment => segment.ScriptID)
                    .OrderBy(group => group.First().Start)
                    .ToList();

                var mainGroup = scriptGroups.FirstOrDefault(group => group.Key == 0);
                if (_includeScriptList.Count <= 1 || scriptGroups.Count <= 1 || mainGroup == null)
                {
                    List<ScriptSegment> fallbackGroup = mainGroup != null
                        ? mainGroup.ToList()
                        : new List<ScriptSegment> { segments[0] };
                    DecompileSegments(fallbackGroup, filename, true, null);
                    NormalizeElseWhileChains(filename);
                    if (CompactWhitespace)
                        NormalizeWhitespace(filename);
                    generatedFiles.Add(filename);
                    return generatedFiles;
                }

                string outputDirectory = Path.GetDirectoryName(Path.GetFullPath(filename)) ?? Directory.GetCurrentDirectory();
                var includeLines = new List<string>();
                var includeVariants = new Dictionary<string, List<(string RelativePath, string FullPath, string Content)>>(StringComparer.OrdinalIgnoreCase);

                foreach (var group in scriptGroups.Where(group => group.Key > 0))
                {
                    string includeName = GetScriptName(group.Key);
                    string baseName = Path.GetFileNameWithoutExtension(includeName);
                    string tempPath = Path.Combine(outputDirectory, $".twxd-script-{group.Key}-{Guid.NewGuid():N}.tmp");

                    try
                    {
                        DecompileSegments(group.ToList(), tempPath, false, null);
                        NormalizeElseWhileChains(tempPath);
                        if (CompactWhitespace)
                            NormalizeWhitespace(tempPath);

                        string tempContent = File.ReadAllText(tempPath, Encoding.Latin1);
                        if (!includeVariants.TryGetValue(baseName, out var variants))
                        {
                            variants = new List<(string RelativePath, string FullPath, string Content)>();
                            includeVariants[baseName] = variants;
                        }

                        string relativePath;
                        string fullPath;
                        var existingVariant = variants.FirstOrDefault(variant => string.Equals(variant.Content, tempContent, StringComparison.Ordinal));
                        if (!string.IsNullOrEmpty(existingVariant.RelativePath))
                        {
                            relativePath = existingVariant.RelativePath;
                            fullPath = existingVariant.FullPath;
                        }
                        else
                        {
                            relativePath = variants.Count == 0
                                ? BuildIncludeRelativePath(group.Key)
                                : BuildDuplicateIncludeRelativePath(baseName, variants.Count + 1);
                            fullPath = Path.Combine(outputDirectory, relativePath);
                            if (File.Exists(fullPath))
                            {
                                if (OverwriteExisting)
                                {
                                    File.Delete(fullPath);
                                }
                                else if (BackupExisting)
                                {
                                    fullPath = GetUniqueFilePath(fullPath);
                                    relativePath = Path.GetRelativePath(outputDirectory, fullPath)
                                        .Replace(Path.DirectorySeparatorChar, '/')
                                        .Replace(Path.AltDirectorySeparatorChar, '/');
                                }
                                else
                                {
                                    throw new IOException($"Refusing to overwrite existing include file '{fullPath}'. Use --overwrite-existing, --backup-existing, or a safe temp/default output.");
                                }
                            }

                            string? includeDirectory = Path.GetDirectoryName(fullPath);
                            if (!string.IsNullOrEmpty(includeDirectory))
                                Directory.CreateDirectory(includeDirectory);

                            File.Move(tempPath, fullPath);
                            generatedFiles.Add(fullPath);
                            variants.Add((relativePath, fullPath, tempContent));
                            tempPath = string.Empty;
                        }

                        includeLines.Add($"include \"{relativePath}\"");
                    }
                    finally
                    {
                        if (!string.IsNullOrEmpty(tempPath) && File.Exists(tempPath))
                            File.Delete(tempPath);
                    }
                }

                foreach (string fullPath in includeVariants
                    .SelectMany(entry => entry.Value)
                    .Select(variant => variant.FullPath)
                    .Distinct(StringComparer.OrdinalIgnoreCase))
                {
                    if (!File.Exists(fullPath))
                        continue;
                }

                DecompileSegments(mainGroup.ToList(), filename, true, includeLines);
                NormalizeElseWhileChains(filename);
                if (CompactWhitespace)
                    NormalizeWhitespace(filename);
                generatedFiles.Insert(0, filename);
                return generatedFiles;
            }
            catch
            {
                foreach (string generatedFile in generatedFiles)
                {
                    try
                    {
                        if (File.Exists(generatedFile))
                            File.Delete(generatedFile);
                    }
                    catch
                    {
                        // Best-effort cleanup only.
                    }
                }

                throw;
            }
        }

        private void DecompileSegments(IReadOnlyList<ScriptSegment> segments, string filename, bool includeDescription, IReadOnlyList<string>? includeLines)
        {
            for (int i = 0; i < segments.Count; i++)
            {
                bool append = i > 0;
                bool writeDescription = includeDescription && i == 0;
                IReadOnlyList<string>? lines = i == segments.Count - 1 ? includeLines : null;
                DecompileSegment(segments[i], filename, append, writeDescription, lines);
            }
        }

        private void DecompileSegment(ScriptSegment segment, string filename, bool append, bool includeDescription, IReadOnlyList<string>? includeLines)
        {
            using (var output = new StreamWriter(filename, append, Encoding.Latin1))
            {
                int outputLine = 0;
                if (append && File.Exists(filename))
                    outputLine = File.ReadAllLines(filename, Encoding.Latin1).Length;

                void WriteTrackedLine(string text = "")
                {
                    output.WriteLine(text);
                    outputLine++;
                }

                void PadToLine(int targetLine)
                {
                    while (targetLine > 0 && outputLine + 1 < targetLine)
                        WriteTrackedLine();
                }

                if (!append && includeDescription && !string.IsNullOrEmpty(_description))
                {
                    foreach (var line in _description.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None))
                    {
                        WriteTrackedLine($"# {line}");
                    }
                    WriteTrackedLine();
                }

                var branchLabels = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var whileLabels = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var waitOnLabels = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var tempVars = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                int indent = 0;
                bool lineGoto = false;
                bool lineElse = false;
                int pendingElseLine = -1;
                bool whileLoop = false;
                bool branchEnd = false;
                bool waitOn = false;
                int lastLine = -1;

                void ProcessLabelsAt(int location)
                {
                    foreach (var label in _labelList)
                    {
                        bool isAtSegmentStart = label.Location == segment.Start;
                        bool isInsideSegment = label.Location >= segment.Start && label.Location < segment.End;
                        bool isFinalSegmentEnd = label.Location == segment.End && segment.End == _codeSize;
                        if (label.Location != location || (!isAtSegmentStart && !isInsideSegment && !isFinalSegmentEnd))
                            continue;

                        if (!LabelBelongsToSegment(label.Name, segment.ScriptID))
                            continue;

                        string labelName = label.Name;
                        string labelReference = NormalizeStoredLabelReference(labelName, segment.ScriptID);
                        string? internalLabelKey = GetStoredInternalNumericLabelKey(labelName, segment.ScriptID);
                        bool isNumericLabel = internalLabelKey != null;

                        if ((waitOn && labelReference.Contains("WAITON", StringComparison.OrdinalIgnoreCase)) ||
                            waitOnLabels.Contains(labelReference))
                        {
                            continue;
                        }

                        if (!isNumericLabel)
                        {
                            branchEnd = false;
                            if (lineElse)
                            {
                                PadToLine(pendingElseLine);
                                indent--;
                                WriteTrackedLine($"{Indent(indent)}else");
                                indent++;
                                lineElse = false;
                                pendingElseLine = -1;
                            }
                            WriteTrackedLine($"{Indent(indent)}{NormalizeNamespacedTokenCasing(":" + labelName)}");
                        }
                        else if (lineGoto && !whileLabels.Contains(internalLabelKey!))
                        {
                            lineGoto = false;
                            lineElse = true;
                        }
                        else if (branchLabels.Contains(internalLabelKey!))
                        {
                            branchLabels.Remove(internalLabelKey!);
                            branchEnd = true;

                            if (lineElse)
                            {
                                indent--;
                                WriteTrackedLine($"{Indent(indent)}else");
                                indent++;
                                lineElse = false;
                            }

                            indent--;
                            WriteTrackedLine($"{Indent(indent)}end");
                        }
                        else if (branchEnd)
                        {
                            branchEnd = false;
                        }
                        else
                        {
                            whileLabels.Add(internalLabelKey!);
                            branchEnd = false;
                            whileLoop = true;
                        }
                    }
                }

                _codePos = segment.Start;
                ProcessLabelsAt(segment.Start);

                while (_codePos < segment.End)
                {
                    if (_codePos >= segment.End)
                        break;

                    byte scriptID = _code[_codePos++];
                    if (_codePos + 2 > segment.End) break;
                    ushort lineNum = BitConverter.ToUInt16(_code, _codePos);
                    _codePos += 2;
                    if (_codePos + 2 > segment.End) break;
                    ushort cmdID = BitConverter.ToUInt16(_code, _codePos);
                    _codePos += 2;

                    if (lastLine != -1 && lineNum != lastLine)
                    {
                        if (lineElse)
                        {
                            PadToLine(pendingElseLine);
                            indent--;
                            WriteTrackedLine($"{Indent(indent)}else");
                            indent++;
                            lineElse = false;
                            pendingElseLine = -1;
                        }

                        lineGoto = false;
                        branchEnd = false;
                        waitOn = false;
                    }

                    lastLine = lineNum;

                    string cmdName;
                    cmdName = _scriptRef.GetCommandName(cmdID);
                    if (string.IsNullOrEmpty(cmdName))
                        cmdName = $"UNKNOWN_{cmdID}";

                    var parts = new List<string> { cmdName };
                    
                    // Read parameters until PARAM_CMD (0) marker
                    int paramCount = 0;
                    while (_codePos < segment.End)
                    {
                        byte paramType = _code[_codePos];
                        if (paramType == ScriptConstants.PARAM_CMD)
                        {
                            _codePos++; // Skip end marker
                            break;
                        }
                        
                        string param = DecompileParameter();
                        if (!string.IsNullOrEmpty(param))
                        {
                            parts.Add(param);
                            paramCount++;
                        }
                    }
                    
                    // Handle macro expansion and control flow reconstruction
                    bool skipOutput = false;
                    
                    // Comparison operators
                    if (cmdName == "ISEQUAL" || cmdName == "ISNOTEQUAL" || cmdName == "ISGREATER" || 
                        cmdName == "ISGREATEREQUAL" || cmdName == "ISLESSER" || cmdName == "ISLESSEREQUAL")
                    {
                        if (paramCount >= 3)
                        {
                            string target = parts[1];
                            string left = parts[2];
                            string right = parts[3];
                            
                            string op = cmdName switch
                            {
                                "ISEQUAL" => " = ",
                                "ISNOTEQUAL" => " <> ",
                                "ISGREATER" => " > ",
                                "ISGREATEREQUAL" => " >= ",
                                "ISLESSER" => " < ",
                                "ISLESSEREQUAL" => " <= ",
                                _ => " ? "
                            };
                            
                            // Store for later expansion
                            if (IsSyntheticTempVar(target))
                            {
                                string expandedLeft = ExpandTempVars(left, tempVars);
                                string expandedRight = ExpandTempVars(right, tempVars);
                                tempVars[target] = $"({expandedLeft}{op}{expandedRight})";
                                skipOutput = true;
                            }
                        }
                    }
                    // Arithmetic operators: ADD/SUBTRACT/etc are 2-param accumulator ops.
                    else if (cmdName == "ADD" || cmdName == "SUBTRACT" || cmdName == "MULTIPLY" || cmdName == "DIVIDE")
                    {
                        if (paramCount >= 2)
                        {
                            string target = parts[1];
                            string right = parts[2];
                            
                            string op = cmdName switch
                            {
                                "ADD" => " + ",
                                "SUBTRACT" => " - ",
                                "MULTIPLY" => " * ",
                                "DIVIDE" => " / ",
                                _ => " ? "
                            };
                            
                            if (IsSyntheticTempVar(target))
                            {
                                string expandedLeft = ExpandTempVars(target, tempVars);
                                string expandedRight = ExpandTempVars(right, tempVars);
                                tempVars[target] = $"({expandedLeft}{op}{expandedRight})";
                                skipOutput = true;
                            }
                        }
                    }
                    // Boolean operators: AND/OR are 2-param accumulator instructions.
                    // Compiled as: SETVAR $$cond $$left  then  OR $$cond $$right
                    else if (cmdName == "AND" || cmdName == "OR")
                    {
                        if (paramCount >= 2)
                        {
                            string target = parts[1];
                            string right = parts[2];
                            
                            if (IsSyntheticTempVar(target))
                            {
                                string expandedLeft = ExpandTempVars(target, tempVars);
                                string expandedRight = ExpandTempVars(right, tempVars);

                                if (cmdName == "AND")
                                {
                                    if (expandedLeft.Contains(" or ", StringComparison.Ordinal))
                                        expandedLeft = $"({expandedLeft})";
                                    if (expandedRight.Contains(" or ", StringComparison.Ordinal))
                                        expandedRight = $"({expandedRight})";
                                    tempVars[target] = $"({expandedLeft} and {expandedRight})";
                                }
                                else
                                {
                                    tempVars[target] = $"{expandedLeft} or {expandedRight}";
                                }

                                skipOutput = true;
                            }
                        }
                    }
                    // SETVAR for temp variables
                    else if (cmdName == "SETVAR" && paramCount >= 2)
                    {
                        string target = parts[1];
                        string value = parts[2];
                        
                        if (IsSyntheticTempVar(target))
                        {
                            tempVars[target] = ExpandTempVars(value, tempVars);
                            skipOutput = true;
                        }
                    }
                    // MERGETEXT: dest = src1 + src2
                    else if (cmdName == "MERGETEXT" && paramCount >= 3)
                    {
                        string src1 = parts[1];
                        string src2 = parts[2];
                        string dest = parts[3];

                        if (IsSyntheticTempVar(dest))
                        {
                            string exp1 = ExpandTempVars(src1, tempVars);
                            string exp2 = ExpandTempVars(src2, tempVars);
                            tempVars[dest] = $"{exp1}&{exp2}";
                            skipOutput = true;
                        }
                    }
                    // BRANCH
                    else if (cmdName == "BRANCH" && paramCount >= 2)
                    {
                        string condition = ExpandTempVars(parts[1], tempVars);
                        string label = NormalizeLabelReference(parts[2], scriptID);

                        tempVars.Clear();
                        branchLabels.Add(label);

                        if (lineElse)
                        {
                            PadToLine(lineNum);
                            indent--;
                            WriteTrackedLine($"{Indent(indent)}elseif {FormatCondition(condition)}");
                            indent++;
                            lineElse = false;
                            pendingElseLine = -1;
                        }
                        else if (whileLoop)
                        {
                            PadToLine(lineNum);
                            WriteTrackedLine($"{Indent(indent)}while {FormatCondition(condition)}");
                            indent++;
                            whileLoop = false;
                        }
                        else
                        {
                            PadToLine(lineNum);
                            WriteTrackedLine($"{Indent(indent)}if {FormatCondition(condition)}");
                            indent++;
                        }

                        skipOutput = true;
                    }
                    // GOTO / GOSUB
                    else if ((cmdName == "GOTO" || cmdName == "GOSUB") && paramCount >= 1)
                    {
                        string rawLabelExpr = ExpandTempVars(parts[1], tempVars);
                        rawLabelExpr = Unquote(rawLabelExpr);
                        bool isInternalLabel = IsInternalNumericLabelReference(rawLabelExpr);

                        string labelExpr = rawLabelExpr;
                        if (labelExpr.StartsWith("::", StringComparison.Ordinal))
                            labelExpr = labelExpr.Substring(1);

                        if (cmdName == "GOTO" && isInternalLabel)
                        {
                            if (whileLabels.Contains(labelExpr))
                                whileLabels.Remove(labelExpr);
                            else
                            {
                                lineGoto = true;
                                pendingElseLine = lineNum;
                            }

                            skipOutput = true;
                        }
                        else
                        {
                            bool isDynamicTarget =
                                labelExpr.Contains('&', StringComparison.Ordinal) ||
                                labelExpr.StartsWith("$", StringComparison.Ordinal) ||
                                labelExpr.StartsWith("%", StringComparison.Ordinal);

                            if (!isDynamicTarget &&
                                !labelExpr.StartsWith(":", StringComparison.Ordinal))
                            {
                                labelExpr = ":" + labelExpr;
                            }

                            if (!isDynamicTarget)
                                labelExpr = NormalizeLabelReference(labelExpr, scriptID);

                            PadToLine(lineNum);
                            WriteTrackedLine($"{Indent(indent)}{cmdName.ToLowerInvariant()} {labelExpr}");
                            skipOutput = true;
                        }
                    }
                    else if (IsTriggerCommand(cmdName) && paramCount >= 2)
                    {
                        parts[1] = Unquote(parts[1]);
                        parts[2] = NormalizeLabelReference(parts[2], scriptID);

                        if (parts[1].Contains("WAITON", StringComparison.OrdinalIgnoreCase) &&
                            parts[2].Contains("WAITON", StringComparison.OrdinalIgnoreCase) &&
                            parts.Count >= 4)
                        {
                            waitOn = true;
                            waitOnLabels.Add(parts[2]);
                            string waitText = ExpandTempVars(parts[3], tempVars);
                            PadToLine(lineNum);
                            WriteTrackedLine($"{Indent(indent)}waiton {waitText}");
                            skipOutput = true;
                        }
                    }
                    
                    // Write regular command
                    if (!skipOutput)
                    {
                        if (waitOn && cmdName == "PAUSE")
                        {
                        }
                        else
                        {
                            // If else is still pending and a real command appears on this line,
                            // emit it now before the first command in the else body.
                            if (lineElse)
                            {
                                PadToLine(pendingElseLine);
                                indent--;
                                WriteTrackedLine($"{Indent(indent)}else");
                                indent++;
                                lineElse = false;
                                pendingElseLine = -1;
                            }

                            // Expand temp vars in parameters
                            for (int i = 1; i < parts.Count; i++)
                            {
                                parts[i] = ExpandTempVars(parts[i], tempVars);
                            }

                            if (cmdName == "KILLTRIGGER" && parts.Count >= 2)
                            {
                                parts[1] = Unquote(parts[1]);
                            }
                            else if (IsTriggerCommand(cmdName) && parts.Count >= 3)
                            {
                                parts[1] = Unquote(parts[1]);
                                parts[2] = NormalizeLabelReference(parts[2], scriptID);
                            }

                            if (cmdName == "GETCONSOLEINPUT" && parts.Count >= 3 && parts[2] == "\"SINGLEKEY\"")
                            {
                                parts[2] = "SINGLEKEY";
                            }

                            if (cmdName == "OPENMENU" && parts.Count >= 2 &&
                                parts[1].StartsWith("\"TWX_", StringComparison.Ordinal) &&
                                parts[1].EndsWith("\"", StringComparison.Ordinal))
                            {
                                parts[1] = Unquote(parts[1]);
                            }
                        
                            parts[0] = cmdName.ToLowerInvariant();
                            PadToLine(lineNum);
                            WriteTrackedLine($"{Indent(indent)}{string.Join(" ", parts)}");
                        }
                    }

                    ProcessLabelsAt(_codePos);
                }

                if (lineElse)
                {
                    PadToLine(pendingElseLine);
                    indent--;
                    WriteTrackedLine($"{Indent(indent)}else");
                    indent++;
                    pendingElseLine = -1;
                }

                // Close any remaining open blocks
                while (indent > 0)
                {
                    indent--;
                    WriteTrackedLine($"{Indent(indent)}end");
                }

                if (!append && includeLines != null && includeLines.Count > 0)
                {
                    if (outputLine > 0)
                        WriteTrackedLine();

                    WriteTrackedLine("# includes:");
                    foreach (string includeLine in includeLines)
                        WriteTrackedLine(includeLine);
                }
            }
        }

        private List<ScriptSegment> GetScriptSegments()
        {
            var segments = new List<ScriptSegment>();
            if (_codeSize == 0)
                return segments;

            byte? currentScriptID = null;
            int currentStart = 0;
            int pos = 0;

            while (pos < _codeSize)
            {
                int commandStart = pos;
                byte scriptID = _code[pos++];

                if (currentScriptID == null)
                {
                    currentScriptID = scriptID;
                    currentStart = commandStart;
                }
                else if (currentScriptID.Value != scriptID)
                {
                    segments.Add(new ScriptSegment(currentScriptID.Value, currentStart, commandStart, GetScriptName(currentScriptID.Value)));
                    currentScriptID = scriptID;
                    currentStart = commandStart;
                }

                pos += 4;
                while (pos < _codeSize)
                {
                    byte paramType = _code[pos++];
                    if (paramType == ScriptConstants.PARAM_CMD)
                        break;

                    SkipParameterPayload(paramType, ref pos);
                }
            }

            if (currentScriptID != null)
                segments.Add(new ScriptSegment(currentScriptID.Value, currentStart, _codeSize, GetScriptName(currentScriptID.Value)));

            return segments;
        }

        private static void NormalizeElseWhileChains(string filename)
        {
            var lines = new List<string>(File.ReadAllLines(filename, Encoding.Latin1));
            bool changed = false;
            var blockStack = new Stack<(string kind, int lineIndex, int elseState)>();

            for (int i = 0; i < lines.Count; i++)
            {
                string trimmed = lines[i].Trim();
                if (string.IsNullOrEmpty(trimmed))
                    continue;

                if (trimmed.StartsWith("if ", StringComparison.OrdinalIgnoreCase))
                {
                    blockStack.Push(("if", i, 0));
                    continue;
                }

                if (trimmed.StartsWith("while ", StringComparison.OrdinalIgnoreCase))
                {
                    blockStack.Push(("while", i, 0));
                    continue;
                }

                if (string.Equals(trimmed, "else", StringComparison.OrdinalIgnoreCase) ||
                    trimmed.StartsWith("elseif ", StringComparison.OrdinalIgnoreCase))
                {
                    bool isElseIf = trimmed.StartsWith("elseif ", StringComparison.OrdinalIgnoreCase);
                    while (blockStack.Count > 0)
                    {
                        var block = blockStack.Pop();
                        if (string.Equals(block.kind, "while", StringComparison.OrdinalIgnoreCase))
                        {
                            string whileTrimmed = lines[block.lineIndex].TrimStart();
                            int indentLength = lines[block.lineIndex].Length - whileTrimmed.Length;
                            lines[block.lineIndex] = new string(' ', indentLength) + "if" + whileTrimmed.Substring(5);
                            block = ("if", block.lineIndex, block.elseState);
                            changed = true;
                        }

                        if (string.Equals(block.kind, "if", StringComparison.OrdinalIgnoreCase) &&
                            ((isElseIf && block.elseState == 2) || (!isElseIf && block.elseState == 2)))
                        {
                            int indentLength = lines[i].Length - lines[i].TrimStart().Length;
                            lines.Insert(i, new string(' ', indentLength) + "end");
                            changed = true;
                            i++;
                            continue;
                        }

                        if (string.Equals(block.kind, "if", StringComparison.OrdinalIgnoreCase))
                        {
                            int nextElseState = isElseIf ? 1 : 2;
                            blockStack.Push((block.kind, block.lineIndex, nextElseState));
                        }

                        break;
                    }
                    continue;
                }

                if (string.Equals(trimmed, "end", StringComparison.OrdinalIgnoreCase))
                {
                    if (blockStack.Count > 0)
                    {
                        blockStack.Pop();
                    }
                    else
                    {
                        lines.RemoveAt(i);
                        changed = true;
                        i--;
                    }
                }
            }

            for (int i = 1; i < lines.Count; i++)
            {
                string currentTrimmed = lines[i].TrimStart();
                bool isElseChain = currentTrimmed.StartsWith("elseif ", StringComparison.OrdinalIgnoreCase) ||
                                   string.Equals(currentTrimmed.Trim(), "else", StringComparison.OrdinalIgnoreCase);
                if (!isElseChain)
                    continue;

                int previous = i - 1;
                while (previous >= 0 && string.IsNullOrWhiteSpace(lines[previous]))
                    previous--;

                if (previous < 0 || !string.Equals(lines[previous].Trim(), "end", StringComparison.OrdinalIgnoreCase))
                    continue;

                int endIndent = lines[previous].Length - lines[previous].TrimStart().Length;
                int elseifIndent = lines[i].Length - lines[i].TrimStart().Length;
                if (endIndent != elseifIndent)
                    continue;

                lines.RemoveAt(previous);
                changed = true;
                i--;
            }

            bool changedThisRound;
            do
            {
                changedThisRound = false;
                var openBlocks = new Stack<int>();

                for (int i = 0; i < lines.Count; i++)
                {
                    string trimmed = lines[i].Trim();
                    if (string.IsNullOrEmpty(trimmed))
                        continue;

                    int indent = lines[i].Length - lines[i].TrimStart().Length;
                    bool isElse = string.Equals(trimmed, "else", StringComparison.OrdinalIgnoreCase) ||
                                  trimmed.StartsWith("elseif ", StringComparison.OrdinalIgnoreCase);
                    bool isEnd = string.Equals(trimmed, "end", StringComparison.OrdinalIgnoreCase);
                    bool isOpener = trimmed.StartsWith("if ", StringComparison.OrdinalIgnoreCase) ||
                                    trimmed.StartsWith("while ", StringComparison.OrdinalIgnoreCase);

                    if (isElse)
                    {
                        while (openBlocks.Count > 0 && openBlocks.Peek() > indent)
                        {
                            int blockIndent = openBlocks.Pop();
                            lines.Insert(i, new string(' ', blockIndent) + "end");
                            changed = true;
                            changedThisRound = true;
                            i++;
                        }
                    }

                    if (!isElse && !isEnd)
                    {
                        while (openBlocks.Count > 0 && indent <= openBlocks.Peek())
                        {
                            int blockIndent = openBlocks.Pop();
                            lines.Insert(i, new string(' ', blockIndent) + "end");
                            changed = true;
                            changedThisRound = true;
                            i++;
                        }
                    }

                    if (isOpener)
                    {
                        openBlocks.Push(indent);
                    }
                    else if (isEnd && openBlocks.Count > 0)
                    {
                        openBlocks.Pop();
                    }
                }

                while (openBlocks.Count > 0)
                {
                    int blockIndent = openBlocks.Pop();
                    lines.Add(new string(' ', blockIndent) + "end");
                    changed = true;
                    changedThisRound = true;
                }
            }
            while (changedThisRound);

            if (changed)
                File.WriteAllLines(filename, lines, Encoding.Latin1);
        }

        private static void NormalizeWhitespace(string filename)
        {
            var originalLines = File.ReadAllLines(filename, Encoding.Latin1);
            var lines = new List<string>(originalLines.Length);
            bool seenContent = false;
            bool previousBlank = false;

            foreach (string line in originalLines)
            {
                bool isBlank = string.IsNullOrWhiteSpace(line);

                if (!seenContent)
                {
                    if (isBlank)
                        continue;

                    seenContent = true;
                }

                if (isBlank)
                {
                    if (previousBlank)
                        continue;

                    previousBlank = true;
                    lines.Add(string.Empty);
                    continue;
                }

                previousBlank = false;
                lines.Add(line);
            }

            File.WriteAllLines(filename, lines, Encoding.Latin1);
        }

        private string GetScriptName(byte scriptID)
        {
            if (scriptID < _includeScriptList.Count)
                return _includeScriptList[scriptID];

            return $"SCRIPT_{scriptID}";
        }

        private string BuildIncludeRelativePath(byte scriptID)
        {
            string includeName = GetScriptName(scriptID);
            string includeBaseName = Path.GetFileNameWithoutExtension(includeName);
            string safeBaseName = SanitizePathSegment(includeBaseName);
            return Path.Combine("include", safeBaseName + ".ts");
        }

        private string BuildDuplicateIncludeRelativePath(string includeBaseName, int variantIndex)
        {
            string safeBaseName = SanitizePathSegment(includeBaseName);
            return Path.Combine("include", $"{safeBaseName}_{variantIndex}", safeBaseName + ".ts");
        }

        private static string SanitizePathSegment(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return "include";

            var builder = new StringBuilder(value.Length);
            foreach (char c in value)
            {
                builder.Append(Path.GetInvalidFileNameChars().Contains(c) ? '_' : c);
            }

            return builder.ToString().ToLowerInvariant();
        }

        private void SkipParameterPayload(byte paramType, ref int pos)
        {
            switch (paramType)
            {
                case ScriptConstants.PARAM_VAR:
                case ScriptConstants.PARAM_PROGVAR:
                    pos += 4;
                    SkipArrayIndexes(ref pos);
                    break;

                case ScriptConstants.PARAM_CONST:
                    pos += 4;
                    break;

                case ScriptConstants.PARAM_SYSCONST:
                    pos += 2;
                    SkipArrayIndexes(ref pos);
                    break;

                case ScriptConstants.PARAM_CHAR:
                    pos += 1;
                    break;

                default:
                    throw new InvalidDataException($"Unknown parameter type {paramType} while scanning code");
            }
        }

        private void SkipArrayIndexes(ref int pos)
        {
            if (pos >= _codeSize)
                return;

            byte indexCount = _code[pos++];
            for (int i = 0; i < indexCount; i++)
            {
                if (pos >= _codeSize)
                    return;

                byte nestedType = _code[pos++];
                SkipParameterPayload(nestedType, ref pos);
            }
        }
        
        private string ExpandTempVars(string text, Dictionary<string, string> tempVars)
        {
            if (string.IsNullOrEmpty(text) || !text.Contains('$'))
                return text;

            string expanded = text;

            for (int pass = 0; pass < 32; pass++)
            {
                var sb = new StringBuilder();
                bool changed = false;

                for (int i = 0; i < expanded.Length; i++)
                {
                    if (expanded[i] == '$')
                    {
                        int tokenLength = ReadVariableTokenLength(expanded, i);
                        if (tokenLength > 0)
                        {
                            string key = expanded.Substring(i, tokenLength);
                            if (tempVars.TryGetValue(key, out string? replacement))
                            {
                                sb.Append(replacement);
                                i += tokenLength - 1;
                                changed = true;
                                continue;
                            }
                        }
                    }

                    sb.Append(expanded[i]);
                }

                string next = sb.ToString();
                if (!changed || next == expanded)
                    return next;

                expanded = next;
            }

            return expanded;
        }

        private static bool IsSyntheticTempVar(string value)
        {
            if (string.IsNullOrEmpty(value) || value[0] != '$')
                return false;

            if (value.Length > 2 && value[1] == '$' && value.Substring(2).All(char.IsDigit))
                return true;

            string namePart = value.Substring(1);
            if (namePart.All(char.IsDigit))
                return true;

            int tildeIndex = value.LastIndexOf('~');
            if (tildeIndex >= 0 && tildeIndex + 2 < value.Length && value[tildeIndex + 1] == '$')
            {
                return value.Substring(tildeIndex + 2).All(char.IsDigit);
            }

            return false;
        }

        private static int ReadVariableTokenLength(string text, int start)
        {
            if (start < 0 || start >= text.Length || text[start] != '$')
                return 0;

            int i = start + 1;
            while (i < text.Length)
            {
                char c = text[i];
                if (char.IsLetterOrDigit(c) || c == '_' || c == '$' || c == '~' || c == '.')
                {
                    i++;
                    continue;
                }

                break;
            }

            if (i == start + 1)
                return 0;

            return IsSyntheticTempVar(text.Substring(start, i - start)) ? i - start : 0;
        }

        private string Indent(int level)
        {
            return new string(' ', level * 2);
        }

        private string DecompileCommand()
        {
            if (_codePos >= _codeSize)
                return string.Empty;

            // Read command type (should be PARAM_CMD)
            byte cmdType = _code[_codePos++];
            if (cmdType != ScriptConstants.PARAM_CMD)
            {
                // Not a command marker, skip
                return string.Empty;
            }

            // Read command ID
            byte cmdID = _code[_codePos++];

            // Look up command name
            string cmdName = _scriptRef.GetCommandName(cmdID);
            if (string.IsNullOrEmpty(cmdName))
            {
                cmdName = $"UNKNOWN_{cmdID}";
            }

            var parts = new List<string> { cmdName };

            // Read parameters until we hit the next command or end of code
            while (_codePos < _codeSize && _code[_codePos] != ScriptConstants.PARAM_CMD)
            {
                string param = DecompileParameter();
                if (!string.IsNullOrEmpty(param))
                {
                    parts.Add(param);
                }
            }

            return string.Join(" ", parts);
        }

        private string DecompileParameter()
        {
            if (_codePos >= _codeSize)
                return string.Empty;

            byte paramType = _code[_codePos++];

            switch (paramType)
            {
                case ScriptConstants.PARAM_VAR:
                    {
                        // Variable reference $var
                        if (_codePos + 4 > _codeSize)
                            return "$ERROR_VAR";
                            
                        int paramIndex = BitConverter.ToInt32(_code, _codePos);
                        _codePos += 4;

                        // Read array indexes
                        string indexes = ReadArrayIndexes();

	                        if (paramIndex >= 0 && paramIndex < _paramList.Count && _paramList[paramIndex] is VarParam varParam)
	                        {
	                            string name = varParam.Name;
	                            // Check if name already has $ prefix
	                            if (!name.StartsWith("$"))
	                                name = "$" + name;

	                            return NormalizeNamespacedTokenCasing(name + indexes);
	                        }
                        return NormalizeNamespacedTokenCasing($"$VAR_{paramIndex}{indexes}");
                    }

                case ScriptConstants.PARAM_PROGVAR:
                    {
                        // Program variable %var
                        if (_codePos + 4 > _codeSize)
                            return "%ERROR_VAR";
                            
                        int paramIndex = BitConverter.ToInt32(_code, _codePos);
                        _codePos += 4;

                        // Read array indexes
                        string indexes = ReadArrayIndexes();

                        if (paramIndex >= 0 && paramIndex < _paramList.Count && _paramList[paramIndex] is VarParam varParam)
                        {
                            string name = varParam.Name;
                            // Check if name already has % prefix
                            if (!name.StartsWith("%"))
                                name = "%" + name;
                            return NormalizeNamespacedTokenCasing(name + indexes);
                        }
                        return NormalizeNamespacedTokenCasing($"%VAR_{paramIndex}{indexes}");
                    }

                case ScriptConstants.PARAM_CONST:
                    {
                        // Constant value (string or number) - NO INDEX COUNT BYTE
                        if (_codePos + 4 > _codeSize)
                            return "\"ERROR_CONST\"";
                            
                        int paramIndex = BitConverter.ToInt32(_code, _codePos);
                        _codePos += 4;

                        if (paramIndex >= 0 && paramIndex < _paramList.Count)
                        {
                            var param = _paramList[paramIndex];
                            string value = param is VarParam vp ? vp.Value : ((CmdParam)param).Value;

                            // Escape special characters
                            value = EscapeSpecialChars(value);

                            // Check if it needs quotes (contains spaces or special chars)
                            if (NeedsQuotes(value))
                            {
                                return $"\"{value}\"";
                            }
                            return value;
                        }
                        return $"CONST_{paramIndex}";
                    }

                case ScriptConstants.PARAM_SYSCONST:
                    {
                        // System constant
                        if (_codePos + 2 > _codeSize)
                            return "ERROR_SYSCONST";
                            
                        ushort constID = BitConverter.ToUInt16(_code, _codePos);
                        _codePos += 2;

                        // Read array indexes
                        string indexes = ReadArrayIndexes();

                        // Use original TWX sysconst order
                        string constName;
                        constName = _scriptRef.GetSysConstName(constID);
                        if (string.IsNullOrEmpty(constName))
                            constName = $"SYSCONST_{constID}";
                        
                        return constName + indexes;
                    }

                case ScriptConstants.PARAM_CHAR:
                    {
                        // Character code: 1 byte (the char code itself, NOT a param list ref)
                        if (_codePos >= _codeSize)
                            return "#ERROR_CHAR";
                        byte charCode = _code[_codePos++];
                        return $"#{charCode}";
                    }

                default:
                    // Unknown parameter type
                    return $"UNKNOWN_PARAM_{paramType}";
            }
        }

        private string ReadArrayIndexes()
        {
            // Read array indexes from bytecode.
            // Each index is a full nested parameter — call DecompileParameter() recursively.
            if (_codePos >= _codeSize)
                return "";

            byte indexCount = _code[_codePos++];
            if (indexCount == 0)
                return "";

            var result = new StringBuilder();
            for (int i = 0; i < indexCount; i++)
            {
                string indexValue = DecompileParameter();
                result.Append($"[{indexValue}]");
            }
            return result.ToString();
        }

        private string EscapeSpecialChars(string value)
        {
            // Replace special characters with TWX script representations
            var result = new StringBuilder();
            foreach (char c in value)
            {
                switch (c)
                {
                    case '\r':
                        result.Append('*');
                        break;
                    case '\n':
                        // Line feed - typically part of CRLF, skip if preceded by CR
                        if (result.Length > 0 && result[result.Length - 1] != '*')
                            result.Append('*');
                        break;
                    case '\t':
                        result.Append("\\t");
                        break;
                    default:
                        result.Append(c);
                        break;
                }
            }
            return result.ToString();
        }

        private static bool IsTriggerCommand(string cmdName)
        {
            return cmdName == "SETTEXTTRIGGER" ||
                   cmdName == "SETTEXTOUTTRIGGER" ||
                   cmdName == "SETTEXTLINETRIGGER" ||
                   cmdName == "SETEVENTTRIGGER" ||
                   cmdName == "SETDELAYTRIGGER";
        }

        private static string Unquote(string input)
        {
            if (input.Length >= 2 && input[0] == '"' && input[input.Length - 1] == '"')
                return input.Substring(1, input.Length - 2);
            return input;
        }

        private static bool IsInternalNumericLabelReference(string label)
        {
            return label.StartsWith("::", StringComparison.Ordinal) &&
                   label.Length > 2 &&
                   label.Substring(2).All(char.IsDigit);
        }

        private static bool IsBareLabelReference(string value)
        {
            return value.StartsWith(":", StringComparison.Ordinal) &&
                   value.Length > 1 &&
                   !char.IsWhiteSpace(value[1]) &&
                   value.IndexOfAny(new[] { ' ', '\t', '"' }) < 0;
        }

        private bool LabelBelongsToSegment(string labelName, byte scriptID)
        {
            if (string.IsNullOrEmpty(labelName))
                return false;

            string stripped = labelName.StartsWith(':') ? labelName.Substring(1) : labelName;
            string scriptNamespace = _scriptCmp?.GetScriptNamespace(scriptID) ?? string.Empty;
            if (string.IsNullOrEmpty(scriptNamespace))
                return !stripped.Contains('~');

            return stripped.StartsWith(scriptNamespace + "~", StringComparison.OrdinalIgnoreCase);
        }

        private string NormalizeStoredLabelReference(string labelName, byte scriptID)
        {
            if (string.IsNullOrEmpty(labelName))
                return labelName;

            string value = labelName.StartsWith(":") ? labelName : ":" + labelName;
            if (_scriptCmp != null)
                value = _scriptCmp.StripLocalLabelReference(value, scriptID);
            return NormalizeNamespacedTokenCasing(value);
        }

        private string GetStoredLabelLocalPart(string labelName, byte scriptID)
        {
            if (string.IsNullOrEmpty(labelName))
                return labelName;

            string scriptNamespace = _scriptCmp?.GetScriptNamespace(scriptID) ?? string.Empty;
            if (!string.IsNullOrEmpty(scriptNamespace) &&
                labelName.StartsWith(scriptNamespace + "~", StringComparison.OrdinalIgnoreCase))
            {
                return labelName.Substring(scriptNamespace.Length + 1);
            }

            return labelName;
        }

        private string? GetStoredInternalNumericLabelKey(string labelName, byte scriptID)
        {
            string localPart = GetStoredLabelLocalPart(labelName, scriptID);
            if (string.IsNullOrEmpty(localPart))
                return null;

            if (!localPart.StartsWith(":", StringComparison.Ordinal) || localPart.Length < 2)
                return null;

            return localPart.Substring(1).All(char.IsDigit) ? localPart : null;
        }

        private string NormalizeLabelReference(string label, byte scriptID)
        {
            string value = Unquote(label);
            if (value.StartsWith("::", StringComparison.Ordinal))
                value = value.Substring(1);
            if (!value.StartsWith(":", StringComparison.Ordinal))
                value = ":" + value;
            if (_scriptCmp != null)
                value = _scriptCmp.StripLocalLabelReference(value, scriptID);
            return NormalizeNamespacedTokenCasing(value);
        }

        private static string NormalizeNamespacedTokenCasing(string value)
        {
            if (string.IsNullOrEmpty(value))
                return value;

            int prefixLength = 0;
            if (value[0] == ':' || value[0] == '$' || value[0] == '%')
                prefixLength = 1;

            int tildeIndex = value.IndexOf('~', prefixLength);
            if (tildeIndex < 0)
                return value;

            string prefix = value.Substring(0, prefixLength);
            string namespacedPart = value.Substring(prefixLength);
            return prefix + namespacedPart.ToLowerInvariant();
        }

        private static string FormatCondition(string condition)
        {
            if (string.IsNullOrEmpty(condition))
                return condition;

            if (!condition.StartsWith("(", StringComparison.Ordinal))
                return $"({condition})";

            if (condition.Contains(" or ", StringComparison.Ordinal) &&
                !condition.Contains(" and ", StringComparison.Ordinal))
                return $"({condition})";

            return condition;
        }

        private bool NeedsQuotes(string value)
        {
            if (string.IsNullOrEmpty(value))
                return true;

            // Char literal: #13, #32, etc. — no quotes only if followed by digits
            if (value[0] == '#' && value.Length > 1 && value.Substring(1).All(char.IsDigit))
                return false;

            // Starts with a space — must quote
            if (value[0] == ' ')
                return true;

            // Trailing spaces are significant in compiled scripts and must survive round-trip.
            if (value[^1] == ' ')
                return true;

            // Positive integer (not a float, not negative) — no quotes, matching reference decompiler.
            // Negative integers are quoted (e.g. "-1") so the leading minus isn't mistaken for subtraction.
            if (int.TryParse(value, out int iv))
                return iv < 0;

            // Everything else (strings, single letters like "Y"/"N", keyword args like "OFF") — quote.
            return true;
        }
    }
}
