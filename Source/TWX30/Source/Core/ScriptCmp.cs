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
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Globalization;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;

namespace TWXProxy.Core
{
    #region Constants and Enums

    public static class ScriptConstants
    {
        // TWX Proxy 2.02 is version 1
        // TWX Proxy 2.03Beta is version 2
        // TWX Proxy 2.03Final is version 3
        // TWX Proxy 2.04 is version 4
        // TWX Proxy 2.05 is version 5
        // TWX Proxy 2.06 is version 6
        // twxproxy 3.0 beta5 native-extension refresh is version 7
        public const int CompiledScriptVersion = 7;

        public const byte PARAM_CMD = 0;
        public const byte PARAM_VAR = 1;        // User variable prefix
        public const byte PARAM_CONST = 2;      // Compiler string constant prefix
        public const byte PARAM_SYSCONST = 3;   // Read only system value
        public const byte PARAM_PROGVAR = 4;    // Program variable
        public const byte PARAM_CHAR = 5;       // Character code

        public const char OP_GREATEREQUAL = (char)230;
        public const char OP_LESSEREQUAL = (char)231;
        public const char OP_AND = (char)232;
        public const char OP_OR = (char)233;
        public const char OP_XOR = (char)234;
        public const char OP_NOT = (char)235;
        public const char OP_NOTEQUAL = (char)236;
        public const char OP_NONE = '\0';
    }

    public enum ParamKind
    {
        Value,
        Variable,
        Expression
    }

    #endregion

    #region Script File Header

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct ScriptFileHeader
    {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 11)]
        public string ProgramName;
        public ushort Version;
        public int DescSize;
        public int CodeSize;
    }

    #endregion

    #region Condition Struct

    public class ConditionStruct
    {
        public string ConLabel { get; set; } = string.Empty;
        public string EndLabel { get; set; } = string.Empty;
        public bool IsWhile { get; set; }
        public bool AtElse { get; set; }
    }

    #endregion

    #region Script Command Parameter Classes

    // NOTE: CmdParam class is now defined in ScriptCmd.cs

    /// <summary>
    /// TVarParam: A variable within the script. Typically referenced by its ID. Can contain
    /// a list of indexed values in the event of it being used as an array within the script.
    /// </summary>
    public class VarParam : CmdParam
    {
        private string _name = string.Empty;
        private List<VarParam> _vars;
        private int _arraySize;

        public VarParam()
        {
            _vars = new List<VarParam>();
        }

        public override void Dispose()
        {
            // Free all index element variables
            for (int i = _vars.Count - 1; i >= 0; i--)
            {
                _vars[i].Dispose(); // Recursive call
                _vars.RemoveAt(i);
            }
            _name = string.Empty;
            base.Dispose();
        }

        public int AddVar(VarParam newVar)
        {
            // Link up an index element variable
            _vars.Add(newVar);
            return _vars.Count - 1;
        }

        public VarParam GetIndexVar(string[] indexes) => GetIndexVar(indexes, 0);

        private VarParam GetIndexVar(string[] indexes, int offset)
        {
            // Move through the array of index dimensions and return a reference to the
            // variable with the specified name/index.
            // Uses an offset rather than Skip(1).ToArray() to avoid per-call allocations.

            if (indexes == null || offset >= indexes.Length)
                return this; // no more indexes

            // Search the index for a variable with a matching name
            if (_arraySize > 0)
            {
                // Static array - we can look up the variable directly
                if (!int.TryParse(indexes[offset], out int i))
                    i = 0;

                if (i < 1 || i > _arraySize)
                {
                    throw new Exception($"Static array index '{indexes[offset]}' is out of range (must be 1-{_arraySize})");
                }

                return _vars[i - 1].GetIndexVar(indexes, offset + 1);
            }
            else
            {
                // Dynamic array - search for matching name
                string key = indexes[offset];
                if (key.Length >= 2 && key[0] == '"' && key[^1] == '"')
                    key = key.Substring(1, key.Length - 2);
                foreach (var v in _vars)
                {
                    if (string.Equals(v.Name, key, StringComparison.OrdinalIgnoreCase))
                        return v.GetIndexVar(indexes, offset + 1);
                }

                // Variable not found in index - make a new one
                var newVar = new VarParam { Name = key };
                AddVar(newVar);
                return newVar.GetIndexVar(indexes, offset + 1);
            }
        }

        public void SetArray(params int[] dimensions)
        {
            if (dimensions == null || dimensions.Length == 0)
                return;

            _arraySize = dimensions[0];

            // First, delete any existing Vars above ArraySize
            for (int i = _vars.Count - 1; i >= _arraySize; i--)
            {
                _vars[i].Dispose();
                _vars.RemoveAt(i);
            }

            // Build variables up until size limit
            try
            {
                for (int i = 0; i < dimensions[0]; i++)
                {
                    // See if an Item already exists
                    if (i >= _vars.Count)
                    {
                        var newVar = new VarParam { Name = (i + 1).ToString(), Value = "0" };
                        AddVar(newVar);
                    }
                    else
                    {
                        // Clear existing variable
                        _vars[i].Name = (i + 1).ToString();
                        _vars[i].Value = "0";
                    }

                    if (dimensions.Length > 1 || _vars[i]._vars.Count > 0)
                    {
                        // We have sub-dimensions
                        int[] nextDimen = dimensions.Length == 1
                            ? new[] { 0 }
                            : dimensions.Skip(1).ToArray();

                        _vars[i].SetArray(nextDimen);
                    }
                }
            }
            catch
            {
                throw new Exception("Not enough memory to set static array");
            }
        }

        public void SetArrayFromStrings(List<string> strings)
        {
            _arraySize = strings.Count;

            for (int i = _vars.Count - 1; i >= _arraySize; i--)
            {
                _vars[i].Dispose();
                _vars.RemoveAt(i);
            }

            for (int i = 0; i < _arraySize; i++)
            {
                if (i >= _vars.Count)
                {
                    var newVar = new VarParam
                    {
                        Name = (i + 1).ToString(),
                        Value = strings[i]
                    };
                    AddVar(newVar);
                }
                else
                {
                    _vars[i].Name = (i + 1).ToString();
                    _vars[i].Value = strings[i];
                    if (_vars[i]._vars.Count > 0)
                    {
                        _vars[i].SetArray(0);
                    }
                }
            }
        }

        public void SetMultiArraysFromStringsLists(List<List<string>> listArray)
        {
            _arraySize = listArray.Count;

            for (int i = _vars.Count - 1; i >= _arraySize; i--)
            {
                _vars[i].Dispose();
                _vars.RemoveAt(i);
            }

            for (int i = 0; i < _arraySize; i++)
            {
                if (i >= _vars.Count)
                {
                    var newVar = new VarParam
                    {
                        Name = (i + 1).ToString(),
                        Value = (listArray[i].Count - 1).ToString()
                    };
                    AddVar(newVar);
                }
                else
                {
                    _vars[i].Name = (i + 1).ToString();
                    _vars[i].Value = (listArray[i].Count - 1).ToString();
                }

                _vars[i].SetArrayFromStrings(listArray[i]);
            }
        }

        public void Dump(string tab)
        {
            // Broadcast variable details to active telnet connections
            if (Name.Length >= 2 && Name.StartsWith("$$"))
                return; // don't dump system variables

            GlobalModules.Server?.BroadcastLiteral(
                $"{tab}{AnsiCodes.ANSI_15}\"{AnsiCodes.ANSI_7}{Name}{AnsiCodes.ANSI_15}\" = \"{AnsiCodes.ANSI_7}{Value}{AnsiCodes.ANSI_15}\"\r\n");

            if (_vars.Count > 0)
            {
                // Dump array contents
                string arrayType = _arraySize > 0 ? "Static" : "Dynamic";
                GlobalModules.Server?.BroadcastLiteral(
                    $"{tab}{AnsiCodes.ANSI_15}{arrayType} array of \"{AnsiCodes.ANSI_7}{Name}{AnsiCodes.ANSI_15}\" (size {_vars.Count})\r\n");

                foreach (var v in _vars)
                {
                    v.Dump(tab + "  ");
                }
            }
        }

        public string Name
        {
            get => _name;
            set => _name = value;
        }

        public int ArraySize
        {
            get => _arraySize;
            set => _arraySize = value;
        }

        public List<VarParam> Vars => _vars;
    }

    /// <summary>
    /// ProgVarParam: A parameter that wraps a program variable and automatically 
    /// reads/writes to the global program variable storage.
    /// </summary>
    public class ProgVarParam : CmdParam
    {
        private readonly string _progVarName;
        private readonly ModInterpreter _interpreter;

        public ProgVarParam(string progVarName, ModInterpreter interpreter)
        {
            _progVarName = progVarName;
            _interpreter = interpreter;
        }

        /// <summary>The progvar's identifier name, used as the sector DB key in Pascal 2-param calls.</summary>
        public string Name => _progVarName;

        public override string Value
        {
            get => _interpreter.GetProgVar(_progVarName);
            set => _interpreter.SetProgVar(_progVarName, value);
        }
    }

    #endregion

    #region Script Label

    /// <summary>
    /// TScriptLabel: A jump label within a script.
    /// </summary>
    public class ScriptLabel
    {
        public int Location { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    #endregion

    #region ScriptCmp - Main Compiler Class

    /// <summary>
    /// TScriptCmp: Main script compiler class
    /// </summary>
    public sealed class BytecodePruneReport
    {
        public bool Attempted { get; set; }
        public bool Changed { get; set; }
        public string Status { get; set; } = "not-run";
        public string Reason { get; set; } = string.Empty;
        public int OriginalCodeBytes { get; set; }
        public int PrunedCodeBytes { get; set; }
        public int OriginalInstructionCount { get; set; }
        public int ReachableInstructionCount { get; set; }
        public int OriginalParamCount { get; set; }
        public int ReachableParamCount { get; set; }
        public int OriginalLabelCount { get; set; }
        public int ReachableLabelCount { get; set; }
    }

    public enum ScriptCacheKind
    {
        Source,
        Compiled
    }

    public sealed record ScriptCacheEntrySnapshot(
        ScriptCacheKind Kind,
        string ScriptPath,
        string DisplayName,
        long EstimatedBytes,
        int CompiledBytes,
        long PreparedTemplateBytes,
        int PreparedInstructionCount,
        int DependencyCount);

    public sealed record ScriptCacheSnapshot(IReadOnlyList<ScriptCacheEntrySnapshot> Entries)
    {
        public long TotalEstimatedBytes => Entries.Sum(static entry => entry.EstimatedBytes);
    }

    public class ScriptCmp : IDisposable
    {
        private sealed class ObjectReferenceComparer : IEqualityComparer<object>
        {
            public static readonly ObjectReferenceComparer Instance = new();

            public new bool Equals(object? x, object? y) => ReferenceEquals(x, y);

            public int GetHashCode(object obj) => RuntimeHelpers.GetHashCode(obj);
        }

        private static readonly Regex DynamicNamespaceRegex =
            new(@":([A-Za-z0-9_]+)~", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private readonly record struct SourceDependencyStamp(string Path, long LastWriteUtcTicks, long Length);
        private readonly record struct CompiledScriptStamp(string Path, long LastWriteUtcTicks, long Length);

        private sealed class SourceScriptCacheEntry
        {
            public required string CacheKey { get; init; }
            public required byte[] CompiledBytes { get; init; }
            public required List<SourceDependencyStamp> Dependencies { get; init; }
            public PreparedScriptProgram? PreparedTemplate { get; set; }
        }

        private sealed class CompiledScriptCacheEntry
        {
            public required string Path { get; init; }
            public required long LastWriteUtcTicks { get; init; }
            public required long Length { get; init; }
            public required byte[] CompiledBytes { get; init; }
            public PreparedScriptProgram? PreparedTemplate { get; set; }
        }

        private sealed class TrimBlock
        {
            public required string Label { get; init; }
            public required int StartLineIndex { get; init; }
            public int EndLineIndexExclusive { get; set; }
            public List<string> References { get; } = new();
            public bool FallsThrough { get; set; }
            public bool HasDynamicTargets { get; set; }
        }

        private sealed class TrimFileInfo
        {
            public required string FullPath { get; init; }
            public required string Namespace { get; init; }
            public required List<string> Lines { get; init; }
            public List<string> IncludePaths { get; } = new();
            public List<TrimBlock> Blocks { get; } = new();
            public Dictionary<string, TrimBlock> BlocksByLabel { get; } = new(StringComparer.OrdinalIgnoreCase);
            public bool HasExecutablePreamble { get; set; }
            public bool TrimDisabled { get; set; }
            public string TrimDisabledReason { get; set; } = string.Empty;
        }

        private sealed class DynamicReachabilityHints
        {
            public HashSet<string> PinnedNamespaces { get; } = new(StringComparer.OrdinalIgnoreCase);
            public HashSet<string> PinnedLabels { get; } = new(StringComparer.OrdinalIgnoreCase);
            public Dictionary<string, string> LabelAliases { get; } = new(StringComparer.OrdinalIgnoreCase);
            public bool PinRootLabels { get; set; }

            public bool HasAnyHints =>
                PinRootLabels || PinnedNamespaces.Count > 0 || PinnedLabels.Count > 0 || LabelAliases.Count > 0;
        }

        private sealed class StrictNamespaceReference
        {
            public required string ReferenceName { get; init; }
            public required string ReferenceKind { get; init; }
            public string? CommandName { get; init; }
            public required string ScriptName { get; init; }
            public required int LineNumber { get; init; }
            public required byte ScriptId { get; init; }
        }

        private static readonly object _sourceCacheLock = new();
        private static readonly Dictionary<string, SourceScriptCacheEntry> _sourceScriptCache = new(StringComparer.OrdinalIgnoreCase);
        private static readonly object _compiledCacheLock = new();
        private static readonly Dictionary<string, CompiledScriptCacheEntry> _compiledScriptCache = new(StringComparer.OrdinalIgnoreCase);
        private const int ObjectHeaderBytes = 16;
        private const int ArrayHeaderBytes = 24;
        private const int ReferenceSizeBytes = 8;

        private Stack<ConditionStruct> _ifStack;
        private List<CmdParam> _paramList;
        private List<ScriptLabel> _labelList;
        private Dictionary<string, int> _labelDict;
        private List<string> _includeScriptList;
        private List<string> _description;
        private string _scriptFile = string.Empty;
        private string _scriptDirectory = string.Empty;
        private string _rootScriptFile = string.Empty;
        private string _rootScriptDirectory = string.Empty;
        private byte[] _code = Array.Empty<byte>();
        private int _ifLabelCount;
        private int _sysVarCount; // Resets per source line; temp vars reuse names for deduplication
        private int _waitOnCount;
        private int _lineCount;
        private int _cmdCount;
        private int _codeSize;
        private int _version = ScriptConstants.CompiledScriptVersion;
        private ScriptRef? _scriptRef;
        private PreparedScriptProgram? _preparedProgram;
        private readonly List<SourceDependencyStamp> _sourceDependencies = new();
        private readonly List<StrictNamespaceReference> _strictNamespaceReferences = new();
        private readonly HashSet<string> _compiledIncludePaths = new(StringComparer.OrdinalIgnoreCase);
        private string? _sourceCacheKey;
        private Dictionary<string, List<string>>? _trimmedIncludeSources;
        public bool LastSourceCacheHit { get; private set; }
        public bool LastPreparedCacheHit { get; private set; }
        public long LastSourceCacheValidationTicks { get; private set; }
        public long LastCompileTicks { get; private set; }
        public long LastLoadTicks { get; private set; }
        public long LastPrepareTicks { get; private set; }
        public int LastDependencyCount { get; private set; }
        public bool TrimIncludes { get; set; }
        public bool PruneBytecode { get; set; }
        public bool StrictIncludes { get; set; }
        public bool PruneIncludeBranches { get; set; }
        public BytecodePruneReport? LastBytecodePruneReport { get; private set; }

        public ScriptCmp(ScriptRef? scriptRef = null, string scriptDirectory = "")
        {
            _paramList = new List<CmdParam>();
            _labelList = new List<ScriptLabel>();
            _labelDict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            _description = new List<string>();
            _scriptRef = scriptRef ?? new ScriptRef();
            _scriptDirectory = string.IsNullOrWhiteSpace(scriptDirectory)
                ? string.Empty
                : Path.GetFullPath(scriptDirectory);
            _rootScriptDirectory = _scriptDirectory;
            _includeScriptList = new List<string>();
            _ifStack = new Stack<ConditionStruct>();
            _lineCount = 0;
            _cmdCount = 0;
        }

        public void Dispose()
        {
            // Free up parameters
            foreach (var param in _paramList)
            {
                param.Dispose();
            }
            _paramList.Clear();

            _labelList.Clear();
            _labelDict.Clear();
            _description.Clear();

            // Free up IF stack
            _ifStack.Clear();

            _code = Array.Empty<byte>();
            _includeScriptList.Clear();
            _strictNamespaceReferences.Clear();
            _compiledIncludePaths.Clear();
            _preparedProgram = null;
            _trimmedIncludeSources = null;
        }

        #region Properties

        public int ParamCount => _paramList.Count;
        public int LabelCount => _labelList.Count;
        public CmdParam GetParam(int index) => _paramList[index];
        public ScriptLabel GetLabel(int index) => _labelList[index];
        public string GetIncludeScript(int index) => _includeScriptList[index];
        public int IncludeScriptCount => _includeScriptList.Count;
        public List<CmdParam> ParamList => _paramList;
        public List<ScriptLabel> LabelList => _labelList;
        public List<string> IncludeScriptList => _includeScriptList;
        public byte[] Code => _code;
        public int CodeSize => _codeSize;
        public int LineCount => _lineCount;
        public int CmdCount => _cmdCount;
        public int Version => _version;
        public ScriptRef? ScriptRef => _scriptRef;
        public string ScriptFile => _scriptFile;
        public PreparedScriptProgram? PreparedProgram => _preparedProgram;
        public int PreparedInstructionCount => _preparedProgram?.Instructions.Length ?? 0;
        /// <summary>Description as a single string (lines joined with '\n').</summary>
        public string DescriptionText => _description.Count > 0 ? string.Join("\n", _description) : string.Empty;

        public PreparedScriptProgram? PrepareForExecution()
        {
            if (_preparedProgram != null)
                return _preparedProgram;

            long prepareStart = Stopwatch.GetTimestamp();
            LastPreparedCacheHit = false;

            try
            {
                if (TryLoadPreparedTemplateFromSourceCache(out PreparedScriptProgram? cachedPrepared) && cachedPrepared != null)
                {
                    _preparedProgram = cachedPrepared;
                    LastPreparedCacheHit = true;
                }
                else
                {
                    _preparedProgram = PreparedScriptDecoder.Decode(this);
                    StorePreparedTemplateInSourceCache(_preparedProgram);
                    StorePreparedTemplateInCompiledCache(_preparedProgram);
                }
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[ScriptCmp.PrepareForExecution] Failed for '{_scriptFile}': {ex.Message}\n");
                _preparedProgram = null;
            }
            finally
            {
                LastPrepareTicks = Stopwatch.GetTimestamp() - prepareStart;
                if (GlobalModules.EnableVmMetrics)
                {
                    double prepareMs = StopwatchTicksToMilliseconds(LastPrepareTicks);
                    GlobalModules.VmMetricLog($"[VM LOAD] phase=prepare script='{_scriptFile}' preparedCacheHit={(LastPreparedCacheHit ? 1 : 0)} instructions={_preparedProgram?.Instructions.Length ?? 0} elapsedMs={prepareMs:F3}\n");
                }
            }

            return _preparedProgram;
        }

        public VarParam GetOrCreateRuntimeVar(string varName)
        {
            int id = FindOrCreateVariable(varName);
            return (VarParam)_paramList[id];
        }

        #endregion

        #region Code Generation Methods

        private void AppendCode(byte[] newCode)
        {
            // Write this data to the end of the byte-code
            int oldSize = _code.Length;
            Array.Resize(ref _code, oldSize + newCode.Length);
            Array.Copy(newCode, 0, _code, oldSize, newCode.Length);
            _codeSize = _code.Length;
        }

        private void BuildLabel(string name, int location)
        {
            // Create a new label
            var newLabel = new ScriptLabel
            {
                Name = name,
                Location = location
            };
            _labelList.Add(newLabel);
            // O(1) lookup - first definition wins, matching FirstOrDefault semantics
            if (!_labelDict.ContainsKey(name))
                _labelDict[name] = location;
        }

        /// <summary>
        /// O(1) label lookup. Returns code position, or -1 if not found.
        /// </summary>
        public int FindLabel(string name)
        {
            return _labelDict.TryGetValue(name, out int pos) ? pos : -1;
        }

        public string GetScriptNamespace(int scriptID)
        {
            if (scriptID > 0 && scriptID < _includeScriptList.Count)
                return _includeScriptList[scriptID];

            return string.Empty;
        }

        public string GetSourceDisplayName(int scriptID)
        {
            if (scriptID > 0 && scriptID < _includeScriptList.Count)
            {
                string includeName = _includeScriptList[scriptID];
                return includeName.EndsWith(".ts", StringComparison.OrdinalIgnoreCase)
                    ? includeName
                    : includeName + ".ts";
            }

            if (string.IsNullOrWhiteSpace(_scriptFile))
                return string.Empty;

            string fileName = Path.GetFileName(_scriptFile);
            string extension = Path.GetExtension(fileName);
            if (extension.Equals(".cts", StringComparison.OrdinalIgnoreCase) ||
                extension.Equals(".twx", StringComparison.OrdinalIgnoreCase))
            {
                return Path.ChangeExtension(fileName, ".ts");
            }

            return fileName;
        }

        public string GetCompiledScriptDisplayName()
        {
            return string.IsNullOrWhiteSpace(_scriptFile)
                ? string.Empty
                : Path.GetFileName(_scriptFile);
        }

        public string QualifyLabelReference(string name, int scriptID)
        {
            if (string.IsNullOrEmpty(name))
                return name;

            // Pascal bytecode preserves label references exactly as written in source.
            // Include-local refs such as ":BUY", ":246", and "::308" stay local in the
            // compiled parameter table and are resolved at runtime using ExecScriptID.
            // Only already-qualified cross-script refs carry a namespace in source.
            bool hasColon = name.StartsWith(':');
            string labelName = hasColon ? name.Substring(1) : name;
            if (string.IsNullOrEmpty(labelName))
                return name;

            if (!hasColon)
                return name;

            return name;
        }

        public string StripLocalLabelReference(string name, int scriptID)
        {
            if (string.IsNullOrEmpty(name))
                return name;

            bool hasColon = name.StartsWith(':');
            string labelName = hasColon ? name.Substring(1) : name;
            string scriptNamespace = GetScriptNamespace(scriptID);
            if (string.IsNullOrEmpty(scriptNamespace))
                return name;

            string prefix = scriptNamespace + "~";
            if (!labelName.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return name;

            string stripped = labelName.Substring(prefix.Length);
            return hasColon ? ":" + stripped : stripped;
        }

        public void ExtendName(ref string name, int scriptID)
        {
            // Don't extend system variables (starting with $$)
            if (name.StartsWith("$$"))
                return;

            if (!name.Contains('~'))
            {
                if (scriptID > 0 && scriptID < _includeScriptList.Count)
                {
                    if (name.Length > 1 && (name[0] == '$' || name[0] == '%') && char.IsDigit(name[1]))
                        name = name[0] + _includeScriptList[scriptID] + "~" + name;
                    else
                        name = _includeScriptList[scriptID] + "~" + name;
                }
            }
            else
            {
                if (!string.IsNullOrEmpty(name) && name[0] == '~')
                {
                    if (name.Length == 1)
                        throw new Exception("Bad name");

                    name = name.Substring(1);
                }
            }
        }

        public void ExtendLabelName(ref string name, int scriptID)
        {
            if (!name.Contains('~') && scriptID > 0 && scriptID < _includeScriptList.Count)
                name = ":" + _includeScriptList[scriptID] + "~" + name.Substring(1);
        }

        private byte IdentifyParam(string paramName)
        {
            // Identify the type of this parameter
            // See if it's a $var, %progVar, #char, [const], or [sysConst]
            if (string.IsNullOrEmpty(paramName))
                return ScriptConstants.PARAM_CONST;

            if (paramName[0] == '$')
                return ScriptConstants.PARAM_VAR;
            else if (paramName[0] == '%')
                return ScriptConstants.PARAM_PROGVAR;
            else if (paramName[0] == '#')
                return ScriptConstants.PARAM_CHAR;
            else
            {
                // Remove indexes from constant name
                int indexLevel = 0;
                StringBuilder constName = new StringBuilder();

                foreach (char c in paramName)
                {
                    if (c == '[')
                        indexLevel++;
                    else if (c == ']')
                        indexLevel--;
                    else if (indexLevel == 0)
                        constName.Append(c);
                }

                // Check for system constant
                string constNameStr = constName.ToString();
                if (_scriptRef is ScriptRef scriptRef)
                {
                    if (scriptRef.FindSysConst(constNameStr) >= 0)
                        return ScriptConstants.PARAM_SYSCONST;
                }

                return ScriptConstants.PARAM_CONST;
            }
        }

        private string ApplyEncryption(string value, byte key)
        {
            if (string.IsNullOrEmpty(value))
                return string.Empty;

            char[] result = new char[value.Length];
            for (int i = 0; i < value.Length; i++)
            {
                result[i] = (char)((byte)value[i] ^ key);
            }
            return new string(result);
        }

        private bool IsOperator(char c)
        {
            return "+-*/%<>=&|!^".Contains(c) ||
                   c == ScriptConstants.OP_GREATEREQUAL ||
                   c == ScriptConstants.OP_LESSEREQUAL ||
                   c == ScriptConstants.OP_AND ||
                   c == ScriptConstants.OP_OR ||
                   c == ScriptConstants.OP_XOR ||
                   c == ScriptConstants.OP_NOT ||
                   c == ScriptConstants.OP_NOTEQUAL;
        }

        private static bool IsNumericLiteralSign(string text, int index)
        {
            if (index < 0 || index + 1 >= text.Length)
                return false;

            char c = text[index];
            if (c != '-' && c != '+')
                return false;

            char next = text[index + 1];
            return char.IsDigit(next) || next == '.';
        }

        private static bool IsSimpleVariableToken(string token)
        {
            if (string.IsNullOrWhiteSpace(token) || token[0] != '$')
                return false;

            return token.IndexOfAny(new[] { '(', ')', '+', '-', '*', '/', '%', '&', '=', '<', '>' }) < 0;
        }

        private static bool StartsSignedNumericSetVarValue(List<string> paramLine, StringBuilder pendingToken)
        {
            return paramLine.Count == 1
                   && string.Equals(paramLine[0], "SETVAR", StringComparison.OrdinalIgnoreCase)
                   && IsSimpleVariableToken(pendingToken.ToString());
        }

        #endregion

        #region Compilation Methods

        public void CompileFromFile(string filename, string descFile)
        {
            ResetLoadMetrics();
            _preparedProgram = null;
            LastBytecodePruneReport = null;
            string fullPath = Path.GetFullPath(filename);
            string fullDescPath = string.IsNullOrWhiteSpace(descFile) ? string.Empty : Path.GetFullPath(descFile);
            _scriptFile = fullPath;
            _scriptDirectory = Path.GetDirectoryName(fullPath) ?? string.Empty;
            _rootScriptFile = fullPath;
            _rootScriptDirectory = _scriptDirectory;
            _ifLabelCount = 0;
            _waitOnCount = 0;
            _lineCount = 0;
            _cmdCount = 0;
            _includeScriptList.Clear();
            _strictNamespaceReferences.Clear();
            _compiledIncludePaths.Clear();
            _sourceDependencies.Clear();
            _trimmedIncludeSources = null;
            _sourceCacheKey = BuildSourceCacheKey(fullPath, fullDescPath, TrimIncludes, PruneBytecode, StrictIncludes, PruneIncludeBranches);

            if (TryLoadFromSourceCache(_sourceCacheKey, fullPath))
            {
                if (StrictIncludes)
                    ValidateCompiledStaticLabelReferences();
                return;
            }

            AddSourceDependency(fullPath);
            if (!string.IsNullOrWhiteSpace(fullDescPath) && File.Exists(fullDescPath))
                AddSourceDependency(fullDescPath);
            if (TrimIncludes)
                _trimmedIncludeSources = BuildTrimmedIncludeSources(fullPath);

            long compileStart = Stopwatch.GetTimestamp();

            // Read script file
            var scriptText = LoadSourceLines(fullPath);

            // Read description file if provided
            if (!string.IsNullOrEmpty(fullDescPath) && File.Exists(fullDescPath))
            {
                _description.AddRange(File.ReadAllLines(fullDescPath, Encoding.Latin1));
            }

            CompileFromStrings(scriptText, Path.GetFileName(fullPath));
            if (StrictIncludes)
                ValidateStrictNamespaceReferences();
            if (PruneBytecode)
                PruneCompiledBytecode();
            if (StrictIncludes)
                ValidateCompiledStaticLabelReferences();
            LastCompileTicks = Stopwatch.GetTimestamp() - compileStart;
            LastDependencyCount = _sourceDependencies.Count;
            StoreSourceCacheEntry();

            if (GlobalModules.EnableVmMetrics)
            {
                GlobalModules.VmMetricLog($"[VM LOAD] phase=source-compile script='{fullPath}' cacheHit=0 deps={LastDependencyCount} compileMs={StopwatchTicksToMilliseconds(LastCompileTicks):F3} codeBytes={_codeSize} params={_paramList.Count} labels={_labelList.Count}\n");
            }
        }

        public void CompileFromStrings(List<string> scriptText, string scriptName)
        {
            _scriptFile = scriptName;
            string includeName = Path.GetFileName(scriptName).ToUpperInvariant();
            byte scriptID = (byte)_includeScriptList.Count;
            _includeScriptList.Add(includeName);
            int localLineCount = 0;

            foreach (var line in scriptText)
            {
                _lineCount++;
                localLineCount++;
                try
                {
                    CompileParamLine(line, localLineCount, scriptID);
                }
                catch (Exception ex)
                {
                    throw new Exception($"Error on line {localLineCount}: {ex.Message}", ex);
                }
            }

            // Check for unclosed IF/WHILE blocks
            if (_ifStack.Count > 0)
            {
                throw new Exception("IF or WHILE block not terminated with END");
            }
        }

        // ── Pascal preprocessing ────────────────────────────────────────────────────
        // Replaces AND/OR/XOR word tokens (outside quotes) with single sentinel chars.
        // Called with a trailing space already appended (as Pascal does).
        private static string ConvertOps(string line)
        {
            bool inQuote = false;
            var result = new StringBuilder();
            var token = new StringBuilder();
            foreach (char c in line)
            {
                if (c == '"') inQuote = !inQuote;
                if (c == ' ')
                {
                    if (!inQuote)
                    {
                        string up = token.ToString().ToUpperInvariant();
                        if (up == "AND") token.Clear().Append(ScriptConstants.OP_AND);
                        else if (up == "OR") token.Clear().Append(ScriptConstants.OP_OR);
                        else if (up == "XOR") token.Clear().Append(ScriptConstants.OP_XOR);
                    }
                    result.Append(token).Append(' ');
                    token.Clear();
                }
                else token.Append(c);
            }
            return result.ToString();
        }

        // Replaces >=, <=, <> with single sentinel chars (outside quotes).
        private static string ConvertConditions(string line)
        {
            bool inQuote = false;
            var result = new StringBuilder();
            char last = '\0';
            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '"')
                {
                    inQuote = !inQuote;
                    result.Append(c);
                }
                else if (c == '=' && !inQuote)
                {
                    if (last == '>') result.Append(ScriptConstants.OP_GREATEREQUAL);
                    else if (last == '<') result.Append(ScriptConstants.OP_LESSEREQUAL);
                    else result.Append('=');
                }
                else if ((c != '>' && c != '<') || inQuote)
                {
                    if ((last == '>' || last == '<') && !inQuote)
                        result.Append(last); // flush deferred > or <
                    result.Append(c);
                }
                else if (last == '<' && c == '>')
                {
                    result.Append(ScriptConstants.OP_NOTEQUAL);
                    c = '\0'; // squash so last doesn't become '>'
                }
                // else: c is standalone '>' or '<' not yet resolved — defer via last
                last = c;
            }
            return result.ToString();
        }

        private void CompileParamLine(string line, int lineNumber, byte scriptID)
        {
            // Reset per-line temp-var counter (matching Pascal's SysVarCount := 0 per source line).
            _sysVarCount = 0;

            line = line.TrimStart();
            if (line.Length == 0 || line[0] == '#')
                return;

            // Pascal preprocessing: convert AND/OR/XOR word tokens and >=/<=/<> to single
            // sentinel chars so the operator-linking tokenizer can accumulate them into tokens.
            // Append trailing space as Pascal does (ConvertOps relies on it to flush last word).
            string processed = ConvertConditions(ConvertOps(line + " "));

            // ── Operator-linking tokenizer (matches Pascal's CompileFromStrings loop) ──────
            // Operator chars are accumulated INTO the current token via the Linked flag.
            // Whitespace does NOT split the current token when Linked is true.
            // This means $a OR $b → after ConvertOps → $a OP_OR $b → one token "$aOP_OR$b".
            var paramLine = new List<string>();
            var sb = new StringBuilder();
            bool inQuote = false;
            bool linked = false;
            char last = ' ';

            for (int i = 0; i < processed.Length; i++)
            {
                char c = processed[i];

                // # at the very start of a fresh first token = comment line
                if (c == '#' && sb.Length == 0 && paramLine.Count == 0)
                    break;

                // // inline comment — remove the first '/' from the token buffer and stop
                if (c == '/' && last == '/' && !inQuote)
                {
                    if (sb.Length > 0) sb.Remove(sb.Length - 1, 1);
                    linked = false;
                    break;
                }

                if (!inQuote && IsNumericLiteralSign(processed, i) && linked)
                {
                    // Unary numeric sign on the right side of an operator, e.g. "$a <= -60".
                    sb.Append(c);
                    linked = false;
                }
                else if (!inQuote && IsNumericLiteralSign(processed, i) && sb.Length == 0)
                {
                    // Negative/positive numeric literal as a fresh command parameter.
                    sb.Append(c);
                    linked = false;
                }
                else if (!inQuote && IsNumericLiteralSign(processed, i) && (last == ' ' || last == '\t') && !linked && StartsSignedNumericSetVarValue(paramLine, sb))
                {
                    // Pascal missed this SETVAR boundary and compiled "$x -60" as "$x-60".
                    // Keep other "$value -1" forms as binary subtraction for script parity.
                    paramLine.Add(sb.ToString());
                    sb.Clear();
                    sb.Append(c);
                    linked = false;
                }
                else if (!inQuote && IsOperator(c))
                {
                    if (linked)
                        throw new Exception($"Operation syntax error at line {lineNumber}");
                    linked = true;
                    sb.Append(c);
                }
                else if ((c != ' ' && c != '\t') || inQuote)
                {
                    // Flush completed token when whitespace precedes a non-linked, non-quoted char
                    if ((last == ' ' || last == '\t') && !linked && !inQuote && sb.Length > 0)
                    {
                        paramLine.Add(sb.ToString());
                        sb.Clear();
                    }
                    sb.Append(inQuote ? c : char.ToUpperInvariant(c));
                    if (c == '"') inQuote = !inQuote;
                    linked = false;
                }

                last = c;
            }

            if (sb.Length > 0)
                paramLine.Add(sb.ToString());

            CompileParamLine(paramLine, lineNumber, scriptID);
        }

        private void CompileParamLine(List<string> paramLine, int lineNumber, byte scriptID)
        {
            if (paramLine.Count == 0)
                return;

            string firstParam = paramLine[0];

            // Label declaration
            if (firstParam.StartsWith(':'))
            {
                if (paramLine.Count > 1)
                    throw new Exception("Unnecessary parameters after label declaration");
                if (firstParam.Length < 2)
                    throw new Exception("Bad label name");

                string labelName = firstParam.Substring(1);
                if (!labelName.Contains('~') && scriptID > 0 && scriptID < _includeScriptList.Count)
                {
                    // Preserve Pascal's distinction between source local labels
                    // (:76 -> HAGGLE~76) and compiler-generated flow labels
                    // (::11 -> HAGGLE~:11) by keeping the local label text as-is.
                    labelName = _includeScriptList[scriptID] + "~" + labelName;
                }

                BuildLabel(labelName, _codeSize);
                return;
            }

            // Macro commands (IF, WHILE, ELSE, ELSEIF, END, INCLUDE, WAITON)
            if (HandleMacroCommand(paramLine, lineNumber, scriptID))
                return;

            // Regular command — expressions in each token are compiled by CompileParam
            CompileCommand(paramLine, lineNumber, scriptID);
        }




        // ── Operator group constants for BreakDown (matching Pascal precedence) ─────────────
        // Group1 = lowest priority (split first) — comparisons, logical, concat
        // Group2 = medium priority — additive
        // Group3 = highest priority (split last) — multiplicative
        private static readonly string OpsGroup1 =
            "=<>&" + ScriptConstants.OP_GREATEREQUAL + ScriptConstants.OP_LESSEREQUAL
                   + ScriptConstants.OP_AND + ScriptConstants.OP_OR + ScriptConstants.OP_XOR
                   + ScriptConstants.OP_NOTEQUAL;
        private const string OpsGroup2 = "+-";
        private const string OpsGroup3 = "*/%";

        // ── Binary expression tree node ──────────────────────────────────────────────────────
        private sealed class ExprNode
        {
            public char Op { get; set; } = ScriptConstants.OP_NONE;
            public string? LeafValue { get; set; }
            public ExprNode? Left { get; set; }
            public ExprNode? Right { get; set; }
        }

        /// <summary>
        /// Splits <paramref name="eq"/> on the first character in <paramref name="ops"/>
        /// found at bracket-depth 0, outside quotes.  Returns false when no match is found.
        /// </summary>
        private static bool SplitOperator(string eq, string ops,
            out string v1, out string v2, out char op)
        {
            v1 = v2 = "";
            op = ScriptConstants.OP_NONE;
            bool inQ = false;
            int depth = 0;
            for (int i = 0; i < eq.Length; i++)
            {
                char c = eq[i];
                if (c == '"') { inQ = !inQ; continue; }
                if (inQ) continue;
                if (c == '(') { depth++; continue; }
                if (c == ')') { depth--; continue; }
                if (depth > 0) continue;
                if (ops.IndexOf(c) >= 0)
                {
                    if (i == 0 && IsNumericLiteralSign(eq, i))
                        continue;
                    if (i == 0)
                        throw new Exception($"SplitOperator: operator '{(int)c}' at position 0 in \"{eq}\"");
                    if (i == eq.Length - 1)
                        throw new Exception($"SplitOperator: operator '{(int)c}' at end of \"{eq}\"");
                    v1 = eq.Substring(0, i);
                    v2 = eq.Substring(i + 1);
                    op = c;
                    return true;
                }
            }
            return false;
        }

        /// <summary>
        /// Recursively decomposes an expression string into an operator-precedence binary tree,
        /// matching Pascal's <c>BreakDown</c> function.
        /// </summary>
        private static ExprNode BreakDown(string eq)
        {
            eq = eq.Trim();
            // Strip matched outer parentheses (while the whole expression is wrapped)
            while (eq.StartsWith("(") && eq.EndsWith(")"))
            {
                int depth = 0;
                bool isOuter = true;
                bool inQuote = false;
                for (int i = 0; i < eq.Length; i++)
                {
                    char c = eq[i];
                    if (c == '"')
                    {
                        inQuote = !inQuote;
                        continue;
                    }

                    if (inQuote)
                        continue;

                    if (c == '(') depth++;
                    else if (c == ')') depth--;
                    if (depth == 0 && i < eq.Length - 1) { isOuter = false; break; }
                }
                if (!isOuter) break;
                eq = eq.Substring(1, eq.Length - 2).Trim();
            }

            if (SplitOperator(eq, OpsGroup1, out string v1, out string v2, out char opFound) ||
                SplitOperator(eq, OpsGroup2, out v1, out v2, out opFound) ||
                SplitOperator(eq, OpsGroup3, out v1, out v2, out opFound))
            {
                return new ExprNode { Op = opFound, Left = BreakDown(v1), Right = BreakDown(v2) };
            }

            return new ExprNode { Op = ScriptConstants.OP_NONE, LeafValue = eq };
        }

        /// <summary>
        /// Recursively emits opcodes for the expression tree rooted at <paramref name="node"/>.
        /// Returns the name of the variable or literal that holds the result.
        /// Matches Pascal's <c>CompileTree</c>.
        /// </summary>
        private string CompileTree(ExprNode node, int lineNumber, byte scriptID)
        {
            _sysVarCount++;
            string result = scriptID > 0 ? "$" + _sysVarCount : "$$" + _sysVarCount;

            if (node.Op == ScriptConstants.OP_NONE)
                return node.LeafValue!;

            string v1 = CompileTree(node.Left!, lineNumber, scriptID);
            string v2 = CompileTree(node.Right!, lineNumber, scriptID);

            char op = node.Op;
            if (op == '&')
            {
                // String concatenation -> MERGETEXT src1 src2 dest
                RecurseCmd(new[] { "MERGETEXT", v1, v2, result }, lineNumber, scriptID);
            }
            else if (op == '=')
                RecurseCmd(new[] { "ISEQUAL", result, v1, v2 }, lineNumber, scriptID);
            else if (op == '>')
                RecurseCmd(new[] { "ISGREATER", result, v1, v2 }, lineNumber, scriptID);
            else if (op == '<')
                RecurseCmd(new[] { "ISLESSER", result, v1, v2 }, lineNumber, scriptID);
            else if (op == ScriptConstants.OP_GREATEREQUAL)
                RecurseCmd(new[] { "ISGREATEREQUAL", result, v1, v2 }, lineNumber, scriptID);
            else if (op == ScriptConstants.OP_LESSEREQUAL)
                RecurseCmd(new[] { "ISLESSEREQUAL", result, v1, v2 }, lineNumber, scriptID);
            else if (op == ScriptConstants.OP_NOTEQUAL)
                RecurseCmd(new[] { "ISNOTEQUAL", result, v1, v2 }, lineNumber, scriptID);
            else if (op == ScriptConstants.OP_AND)
            {
                RecurseCmd(new[] { "SETVAR", result, v1 }, lineNumber, scriptID);
                RecurseCmd(new[] { "AND", result, v2 }, lineNumber, scriptID);
            }
            else if (op == ScriptConstants.OP_OR)
            {
                RecurseCmd(new[] { "SETVAR", result, v1 }, lineNumber, scriptID);
                RecurseCmd(new[] { "OR", result, v2 }, lineNumber, scriptID);
            }
            else if (op == ScriptConstants.OP_XOR)
            {
                RecurseCmd(new[] { "SETVAR", result, v1 }, lineNumber, scriptID);
                RecurseCmd(new[] { "XOR", result, v2 }, lineNumber, scriptID);
            }
            else if (op == '+')
            {
                RecurseCmd(new[] { "SETVAR", result, v1 }, lineNumber, scriptID);
                RecurseCmd(new[] { "ADD", result, v2 }, lineNumber, scriptID);
            }
            else if (op == '-')
            {
                RecurseCmd(new[] { "SETVAR", result, v1 }, lineNumber, scriptID);
                RecurseCmd(new[] { "SUBTRACT", result, v2 }, lineNumber, scriptID);
            }
            else if (op == '*')
            {
                RecurseCmd(new[] { "SETVAR", result, v1 }, lineNumber, scriptID);
                RecurseCmd(new[] { "MULTIPLY", result, v2 }, lineNumber, scriptID);
            }
            else if (op == '/')
            {
                RecurseCmd(new[] { "SETVAR", result, v1 }, lineNumber, scriptID);
                RecurseCmd(new[] { "DIVIDE", result, v2 }, lineNumber, scriptID);
            }
            else if (op == '%')
            {
                RecurseCmd(new[] { "SETVAR", result, v1 }, lineNumber, scriptID);
                RecurseCmd(new[] { "MODULUS", result, v2 }, lineNumber, scriptID);
            }
            else
            {
                throw new Exception($"CompileTree: unknown operator code {(int)op}");
            }

            return result;
        }

        /// <summary>
        /// Compiles <paramref name="param"/> through the expression tree and returns the
        /// variable name or literal that holds its value.  If it is already a leaf
        /// (no operators), it is returned as-is.  Matches Pascal's inline use of
        /// BreakDown + CompileTree before the final CompileParameter call.
        /// </summary>
        private string CompileParamToVar(string param, int lineNumber, byte scriptID)
        {
            ExprNode root = BreakDown(param.Trim());
            if (root.Op == ScriptConstants.OP_NONE)
                return root.LeafValue!;
            return CompileTree(root, lineNumber, scriptID);
        }

        /// <summary>
        /// Full Pascal-style parameter compile: run through BreakDown/CompileTree then
        /// emit <see cref="CompileParameter"/> for the resulting variable or literal.
        /// </summary>
        private void CompileParam(string param, int lineNumber, byte scriptID)
        {
            string result = CompileParamToVar(param, lineNumber, scriptID);
            CompileParameter(result, lineNumber, scriptID, null);
        }

        private void CompileParam(string param, int lineNumber, byte scriptID, List<byte> cmdCode)
        {
            string result = CompileParamToVar(param, lineNumber, scriptID);
            CompileParameter(result, lineNumber, scriptID, cmdCode);
        }

        private bool HandleMacroCommand(List<string> paramLine, int lineNumber, byte scriptID)
        {
            string cmd = paramLine[0].ToUpperInvariant();

            switch (cmd)
            {
                case "WHILE":
                    HandleWhile(paramLine, lineNumber, scriptID);
                    return true;

                case "IF":
                    HandleIf(paramLine, lineNumber, scriptID);
                    return true;

                case "ELSE":
                    HandleElse(paramLine, lineNumber, scriptID);
                    return true;

                case "ELSEIF":
                    HandleElseIf(paramLine, lineNumber, scriptID);
                    return true;

                case "END":
                    HandleEnd(paramLine, lineNumber, scriptID);
                    return true;

                case "INCLUDE":
                    HandleInclude(paramLine);
                    return true;

                case "WAITON":
                    HandleWaitOn(paramLine, lineNumber, scriptID);
                    return true;

                default:
                    return false;
            }
        }

        private void HandleWhile(List<string> paramLine, int lineNumber, byte scriptID)
        {
            if (paramLine.Count < 2)
                throw new Exception("No parameters to compare with WHILE macro");

            // Concatenate all parameters after WHILE into a single condition
            string condition = string.Join(" ", paramLine.Skip(1));

            var conStruct = new ConditionStruct
            {
                IsWhile = true,
                ConLabel = "::" + (++_ifLabelCount),
                EndLabel = "::" + (++_ifLabelCount)
            };

            _ifStack.Push(conStruct);
            RecurseCmd(new[] { conStruct.ConLabel }, lineNumber, scriptID);

            // Compile the condition to a temporary variable
            string tempVar = CompileParamToVar(condition, lineNumber, scriptID);

            // BRANCH to EndLabel if condition is false
            RecurseCmd(new[] { "BRANCH", tempVar, conStruct.EndLabel }, lineNumber, scriptID);
        }

        private void HandleIf(List<string> paramLine, int lineNumber, byte scriptID)
        {
            if (paramLine.Count < 2)
                throw new Exception("No parameters to compare with IF macro");

            // Concatenate all parameters after IF into a single condition
            string condition = string.Join(" ", paramLine.Skip(1));

            var conStruct = new ConditionStruct
            {
                IsWhile = false,
                AtElse = false,
                ConLabel = "::" + (++_ifLabelCount),
                EndLabel = "::" + (++_ifLabelCount)
            };

            _ifStack.Push(conStruct);

            // Compile the condition to a temporary variable
            string tempVar = CompileParamToVar(condition, lineNumber, scriptID);

            // BRANCH to ConLabel if condition is false (tempVar != "1")
            RecurseCmd(new[] { "BRANCH", tempVar, conStruct.ConLabel }, lineNumber, scriptID);
        }

        private void HandleElse(List<string> paramLine, int lineNumber, byte scriptID)
        {
            if (paramLine.Count > 1)
                throw new Exception("Unnecessary parameters after ELSE macro");

            if (_ifStack.Count == 0)
                throw new Exception("ELSE without IF");

            var conStruct = _ifStack.Peek();

            if (conStruct.IsWhile)
                throw new Exception("Cannot use ELSE with WHILE");

            if (conStruct.AtElse)
                throw new Exception("IF macro syntax error");

            conStruct.AtElse = true;
            RecurseCmd(new[] { "GOTO", conStruct.EndLabel }, lineNumber, scriptID);
            RecurseCmd(new[] { conStruct.ConLabel }, lineNumber, scriptID);
        }

        private void HandleElseIf(List<string> paramLine, int lineNumber, byte scriptID)
        {
            if (paramLine.Count < 2)
                throw new Exception("No parameters to compare with ELSEIF macro");

            if (_ifStack.Count == 0)
                throw new Exception("ELSEIF without IF");

            var conStruct = _ifStack.Peek();

            if (conStruct.IsWhile)
                throw new Exception("Cannot use ELSEIF with WHILE");

            if (conStruct.AtElse)
                throw new Exception("IF macro syntax error");

            // Concatenate all parameters after ELSEIF into a single condition
            string condition = string.Join(" ", paramLine.Skip(1));

            RecurseCmd(new[] { "GOTO", conStruct.EndLabel }, lineNumber, scriptID);
            RecurseCmd(new[] { conStruct.ConLabel }, lineNumber, scriptID);
            conStruct.ConLabel = "::" + (++_ifLabelCount);

            // Compile the condition to a temporary variable
            string tempVar = CompileParamToVar(condition, lineNumber, scriptID);

            // BRANCH to new ConLabel if condition is false
            RecurseCmd(new[] { "BRANCH", tempVar, conStruct.ConLabel }, lineNumber, scriptID);
        }

        private void HandleEnd(List<string> paramLine, int lineNumber, byte scriptID)
        {
            if (paramLine.Count > 1)
                throw new Exception("Unnecessary parameters after END macro");

            if (_ifStack.Count == 0)
                throw new Exception("END without IF");

            var conStruct = _ifStack.Pop();

            if (conStruct.IsWhile)
                RecurseCmd(new[] { "GOTO", conStruct.ConLabel }, lineNumber, scriptID);
            else
                RecurseCmd(new[] { conStruct.ConLabel }, lineNumber, scriptID);

            RecurseCmd(new[] { conStruct.EndLabel }, lineNumber, scriptID);
        }

        private void HandleInclude(List<string> paramLine)
        {
            if (paramLine.Count > 2)
                throw new Exception("Unnecessary parameters after INCLUDE macro");
            if (paramLine.Count < 2)
                throw new Exception("No file name supplied for INCLUDE macro");

            string filename = paramLine[1];
            if (filename.StartsWith('"') && filename.EndsWith('"'))
                filename = filename.Substring(1, filename.Length - 2);

            IncludeFile(filename);
        }

        private void HandleWaitOn(List<string> paramLine, int lineNumber, byte scriptID)
        {
            if (paramLine.Count > 2)
                throw new Exception("Unnecessary parameters after WAITON macro");
            if (paramLine.Count < 2)
                throw new Exception("No wait text supplied for WAITON macro");

            _waitOnCount++;
            string triggerName = "WAITON" + _waitOnCount;
            string labelName = ":WAITON" + _waitOnCount;

            RecurseCmd(new[] { "SETTEXTTRIGGER", triggerName, labelName, paramLine[1] }, lineNumber, scriptID);
            RecurseCmd(new[] { "PAUSE" }, lineNumber, scriptID);
            RecurseCmd(new[] { labelName }, lineNumber, scriptID);
        }

        private void RecurseCmd(string[] cmdLine, int lineNumber, byte scriptID)
        {
            // Convert array to list and compile directly without re-parsing
            var paramList = new List<string>(cmdLine);
            CompileParamLine(paramList, lineNumber, scriptID);
        }

        private void CompileCommand(List<string> paramLine, int lineNumber, byte scriptID)
        {
            if (paramLine.Count == 0)
                return;

            string cmdName = paramLine[0].ToUpperInvariant();
            if (StrictIncludes && paramLine.Count > 1 && (cmdName == "GOTO" || cmdName == "GOSUB"))
                TrackStrictNamespaceReference(paramLine[1], lineNumber, scriptID, "label", cmdName);

            // Look up command in ScriptRef
            int cmdID = -1;
            if (_scriptRef is ScriptRef scriptRef)
            {
                cmdID = scriptRef.FindCmd(cmdName);
            }

            if (cmdID < 0)
            {
                // Unknown command - might be a label reference for GOTO/GOSUB
                if (!cmdName.StartsWith(':'))
                    throw new Exception($"Unknown command: {cmdName}");
            }

            // Build the command in a local buffer first. Recursive expression compilation
            // emits temp opcodes directly into the global stream, and Pascal appends the
            // parent command only after those helper opcodes have been written.
            var cmdCode = new List<byte>();
            ushort lineWord = (ushort)lineNumber;
            ushort cmdWord = (ushort)(cmdID >= 0 ? cmdID : 255);
            cmdCode.Add(scriptID);
            cmdCode.AddRange(BitConverter.GetBytes(lineWord));
            cmdCode.AddRange(BitConverter.GetBytes(cmdWord));

            // Compile parameters — each token is run through the expression tree compiler
            for (int i = 1; i < paramLine.Count; i++)
            {
                string param = CanonicalizeTriggerName(cmdName, i - 1, paramLine[i]);
                CompileParam(param, lineNumber, scriptID, cmdCode);
            }

            // Null-terminate the parameter list (Pascal format)
            cmdCode.Add(0);
            AppendCode(cmdCode.ToArray());

            _cmdCount++;
        }

        private void TrackStrictNamespaceReference(string referenceName, int lineNumber, byte scriptID, string referenceKind, string? commandName = null)
        {
            if (!StrictIncludes)
                return;

            string target = referenceName.Trim();
            if (!LooksLikeStaticNamespaceReference(target, referenceKind))
                return;

            _strictNamespaceReferences.Add(new StrictNamespaceReference
            {
                ReferenceName = target,
                ReferenceKind = referenceKind,
                CommandName = commandName,
                ScriptName = _scriptFile,
                LineNumber = lineNumber,
                ScriptId = scriptID
            });
        }

        private static bool LooksLikeStaticNamespaceReference(string value, string referenceKind)
        {
            if (string.IsNullOrWhiteSpace(value))
                return false;

            return referenceKind switch
            {
                // Strict include validation is intentionally control-flow oriented:
                // namespaced variables do not require the include source to be present,
                // but labels do because execution can transfer into them.
                "label" => value.StartsWith(':') && !string.IsNullOrWhiteSpace(value.TrimStart(':')),
                _ => false
            };
        }

        private bool TryNormalizeStaticLabelReferenceForLookup(string label, byte scriptId, out string normalizedLabel)
        {
            normalizedLabel = string.Empty;

            if (string.IsNullOrWhiteSpace(label))
                return false;

            string candidate = label.Trim();
            if (!candidate.StartsWith(':'))
                return false;

            candidate = candidate.ToUpperInvariant();

            if (!candidate.Contains('~'))
            {
                if (scriptId > 0 && scriptId < _includeScriptList.Count)
                    candidate = ":" + _includeScriptList[scriptId] + "~" + candidate.Substring(1);
            }
            else if (candidate.StartsWith(":~", StringComparison.Ordinal))
            {
                candidate = ":" + candidate.Substring(2);
            }

            if (candidate.Length <= 1)
                return false;

            normalizedLabel = candidate.Substring(1);
            return true;
        }

        private void ValidateStrictNamespaceReferences()
        {
            if (_strictNamespaceReferences.Count == 0)
                return;

            var includedNamespaces = new HashSet<string>(
                _includeScriptList.Skip(1).Where(name => !string.IsNullOrWhiteSpace(name)),
                StringComparer.OrdinalIgnoreCase);

            foreach (StrictNamespaceReference reference in _strictNamespaceReferences)
            {
                string referenceBody = reference.ReferenceKind switch
                {
                    "label" => reference.ReferenceName.TrimStart(':'),
                    "variable" => reference.ReferenceName.TrimStart('$'),
                    "program variable" => reference.ReferenceName.TrimStart('%'),
                    _ => reference.ReferenceName
                };

                if (reference.ReferenceKind == "label" &&
                    TryNormalizeStaticLabelReferenceForLookup(reference.ReferenceName, reference.ScriptId, out string normalizedLabel) &&
                    FindLabel(normalizedLabel) < 0)
                {
                    string missingLabelSubject = reference.CommandName != null
                        ? $"{reference.CommandName} target '{reference.ReferenceName}'"
                        : $"{reference.ReferenceKind} '{reference.ReferenceName}'";

                    throw new Exception(
                        $"Error on line {reference.LineNumber} in '{reference.ScriptName}': " +
                        $"Strict includes: {missingLabelSubject} references a label that was not defined " +
                        "in the compiled source/include closure.");
                }

                int separatorIndex = referenceBody.IndexOf('~');
                if (separatorIndex < 0)
                    continue;

                string targetNamespace = referenceBody.Substring(0, separatorIndex);
                if (string.IsNullOrWhiteSpace(targetNamespace))
                    continue;

                string localNamespace = GetScriptNamespace(reference.ScriptId);
                bool isLocalNamespace = !string.IsNullOrWhiteSpace(localNamespace) &&
                                        string.Equals(targetNamespace, localNamespace, StringComparison.OrdinalIgnoreCase);
                if (isLocalNamespace || includedNamespaces.Contains(targetNamespace))
                    continue;

                string subject = reference.CommandName != null
                    ? $"{reference.CommandName} target '{reference.ReferenceName}'"
                    : $"{reference.ReferenceKind} '{reference.ReferenceName}'";

                throw new Exception(
                    $"Error on line {reference.LineNumber} in '{reference.ScriptName}': " +
                    $"Strict includes: {subject} references namespace '{targetNamespace}', " +
                    "which is not local and was not brought in by an INCLUDE statement.");
            }
        }

        private void ValidateCompiledStaticLabelReferences()
        {
            if (_code.Length == 0)
                return;

            PreparedScriptProgram prepared;
            try
            {
                prepared = PreparedScriptDecoder.Decode(this);
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Strict includes: failed to decode final bytecode for label validation: {ex.Message}",
                    ex);
            }

            foreach (PreparedInstruction instruction in prepared.Instructions)
            {
                if (instruction.IsLabel)
                    continue;

                string commandName = instruction.CommandName.ToUpperInvariant();
                switch (commandName)
                {
                    case "GOTO":
                    case "GOSUB":
                        ValidateCompiledStaticLabelTarget(instruction, 0, commandName);
                        break;

                    case "BRANCH":
                        ValidateCompiledStaticLabelTarget(instruction, 1, commandName);
                        break;

                    case "SETTEXTTRIGGER":
                    case "SETTEXTLINETRIGGER":
                    case "SETTEXTOUTTRIGGER":
                    case "SETDELAYTRIGGER":
                    case "SETEVENTTRIGGER":
                        ValidateCompiledStaticLabelTarget(instruction, 1, commandName);
                        break;

                    case "ADDMENU":
                        if (!IsExplicitEmptyCompiledTarget(instruction, 4))
                            ValidateCompiledStaticLabelTarget(instruction, 4, commandName);
                        break;
                }
            }
        }

        private void ValidateCompiledStaticLabelTarget(PreparedInstruction instruction, int paramIndex, string commandName)
        {
            if (paramIndex < 0 || paramIndex >= instruction.Params.Length)
                return;

            PreparedParam param = instruction.Params[paramIndex];
            if (param.ParamType != ScriptConstants.PARAM_CONST && param.ParamType != ScriptConstants.PARAM_CHAR)
                return;

            if (!TryResolveReachabilityLabel(instruction, param, out string qualifiedLabel))
                return;

            if (FindLabel(qualifiedLabel) >= 0)
                return;

            string sourceName = instruction.ScriptId < _includeScriptList.Count
                ? _includeScriptList[instruction.ScriptId]
                : Path.GetFileName(_scriptFile);

            throw new Exception(
                $"Error on line {instruction.LineNumber} in '{sourceName}': " +
                $"Strict includes: final bytecode {commandName} target '{param.LiteralValue}' " +
                $"resolves to missing label '{qualifiedLabel}'.");
        }

        private static bool IsExplicitEmptyCompiledTarget(PreparedInstruction instruction, int paramIndex)
        {
            if (paramIndex < 0 || paramIndex >= instruction.Params.Length)
                return false;

            PreparedParam param = instruction.Params[paramIndex];
            if (param.ParamType == ScriptConstants.PARAM_CONST)
                return string.IsNullOrWhiteSpace(param.LiteralValue);

            if (param.ParamType == ScriptConstants.PARAM_CHAR)
                return param.CharCode == 0;

            return false;
        }

        private static string CanonicalizeTriggerName(string cmdName, int paramIndex, string param)
        {
            if (string.IsNullOrEmpty(param))
                return param;

            // Pascal canonicalizes a couple of legacy handwritten include trigger names
            // into library sysconsts before emission. These show up in the original Pack2
            // sources as ANSI / line, but in compiled bytecode and decompiled output as
            // LIBSILENT / LIBMULTILINE.
            bool isTriggerNameParam =
                paramIndex == 0 &&
                (cmdName == "SETTEXTLINETRIGGER" ||
                 cmdName == "SETTEXTTRIGGER" ||
                 cmdName == "SETTEXTOUTTRIGGER" ||
                 cmdName == "SETDELAYTRIGGER" ||
                 cmdName == "KILLTRIGGER");

            if (!isTriggerNameParam)
                return param;

            return param.ToUpperInvariant() switch
            {
                "LINE" => "LIBMULTILINE",
                "ANSI" => "LIBSILENT",
                _ => param
            };
        }

        private void WriteCodeByte(List<byte>? cmdCode, byte value)
        {
            if (cmdCode != null)
                cmdCode.Add(value);
            else
                AppendCode(new[] { value });
        }

        private void WriteCodeBytes(List<byte>? cmdCode, byte[] bytes)
        {
            if (cmdCode != null)
                cmdCode.AddRange(bytes);
            else
                AppendCode(bytes);
        }

        private void CompileParameter(string param, int lineNumber, byte scriptID, List<byte>? cmdCode)
        {
            byte paramType = IdentifyParam(param);

            // Write parameter type
            WriteCodeByte(cmdCode, paramType);

            // Handle different parameter types
            if (paramType == ScriptConstants.PARAM_CONST)
            {
                // String constant - remove quotes
                string value = param;
                if (value.StartsWith('"') && value.EndsWith('"'))
                {
                    value = value.Substring(1, value.Length - 2);
                    value = value.Replace("*", "\r"); // Replace * with CR
                }
                else
                {
                    // Bare identifier (trigger name, numeric literal, etc.) — match Pascal's
                    // implicit ToUpperCase behaviour for unquoted string constants.
                    if (value.StartsWith(':'))
                        value = QualifyLabelReference(value, scriptID);
                    value = value.ToUpperInvariant();
                }

                var newParam = new CmdParam { Value = value };
                int id = _paramList.Count;
                _paramList.Add(newParam);

                // Write 32-bit parameter ID
                WriteCodeBytes(cmdCode, BitConverter.GetBytes(id));

                // NOTE: PARAM_CONST does NOT have array indexes in TWX bytecode format
                // Only PARAM_VAR, PARAM_PROGVAR, and PARAM_SYSCONST have array index bytes
            }
            else if (paramType == ScriptConstants.PARAM_VAR)
            {
                // Convert dot notation to bracket index notation:
                // $sector.density  ->  $sector["density"]
                string convertedParam = ConvertDotNotation(param);

                // Variable - strip only bracketed index contents while preserving
                // any suffix outside the brackets, e.g.:
                //   $port[$ship].multiple -> $port.multiple
                string varName = ExtractBaseNamePreservingSuffix(convertedParam);

                // Match Pascal: all include-local $vars are namespaced, including
                // explicit $$-prefixed variables such as $$FILETEST.
                if (scriptID > 0 && scriptID < _includeScriptList.Count && !varName.Contains('~'))
                {
                    varName = varName.Length > 1 && char.IsDigit(varName[1])
                        ? "$" + _includeScriptList[scriptID] + "~" + varName
                        : "$" + _includeScriptList[scriptID] + "~" + varName.Substring(1);
                }
                else
                {
                    TrackStrictNamespaceReference(varName, lineNumber, scriptID, "variable");
                }

                // Find or create variable
                int id = FindOrCreateVariable(varName);

                // Write 32-bit variable ID
                WriteCodeBytes(cmdCode, BitConverter.GetBytes(id));

                // Write array indexes (pass scriptID so variable names inside indexes are extended)
                WriteArrayIndexes(convertedParam, lineNumber, scriptID, cmdCode);
            }
            else if (paramType == ScriptConstants.PARAM_PROGVAR)
            {
                // Convert dot notation to bracket index notation
                string convertedParam = ConvertDotNotation(param);

                // Program variable - strip only bracketed index contents while
                // preserving any suffix outside the brackets.
                string varName = ExtractBaseNamePreservingSuffix(convertedParam);

                // Extend name for included scripts (skip system variables starting with %%)
                if (scriptID > 0 && scriptID < _includeScriptList.Count && !varName.Contains('~') && !varName.StartsWith("%%"))
                {
                    varName = varName.Length > 1 && char.IsDigit(varName[1])
                        ? "%" + _includeScriptList[scriptID] + "~" + varName
                        : "%" + _includeScriptList[scriptID] + "~" + varName.Substring(1);
                }
                else
                {
                    TrackStrictNamespaceReference(varName, lineNumber, scriptID, "program variable");
                }

                // Find or create variable
                int id = FindOrCreateVariable(varName);

                // Write 32-bit variable ID
                WriteCodeBytes(cmdCode, BitConverter.GetBytes(id));

                // Write array indexes (pass scriptID so variable names inside indexes are extended)
                WriteArrayIndexes(convertedParam, lineNumber, scriptID, cmdCode);
            }
            else if (paramType == ScriptConstants.PARAM_SYSCONST)
            {
                // System constant - extract base name without array indexes
                string constName = param;

                // Remove array indexes to get base constant name
                int indexLevel = 0;
                StringBuilder baseName = new StringBuilder();
                foreach (char c in constName)
                {
                    if (c == '[')
                        indexLevel++;
                    else if (c == ']')
                        indexLevel--;
                    else if (indexLevel == 0)
                        baseName.Append(c);
                }

                string baseConstName = baseName.ToString();
                int constID = -1;

                if (_scriptRef is ScriptRef scriptRef)
                {
                    constID = scriptRef.FindSysConst(baseConstName);
                }

                if (constID < 0)
                    throw new Exception($"Unknown system constant: {baseConstName}");

                // Write 16-bit system constant ID
                WriteCodeBytes(cmdCode, BitConverter.GetBytes((ushort)constID));

                // Write array indexes
                WriteArrayIndexes(param, lineNumber, scriptID, cmdCode);
            }
            else if (paramType == ScriptConstants.PARAM_CHAR)
            {
                // Character code (#32, etc.)
                string charStr = param.Substring(1); // Remove #
                if (!int.TryParse(charStr, out int charCode) || charCode < 0 || charCode > 255)
                    throw new Exception($"Invalid character code: {param}");

                // Write 1 byte character code directly (NOT a parameter ID!)
                // Format: PARAM_CHAR type byte + 1 byte char code
                WriteCodeByte(cmdCode, (byte)charCode);
            }
        }

        private int FindOrCreateVariable(string varName)
        {
            // Search for existing variable - case-insensitive to match Pascal TWX 2.x behaviour
            for (int i = 0; i < _paramList.Count; i++)
            {
                if (_paramList[i] is VarParam varParam &&
                    string.Equals(varParam.Name, varName, StringComparison.OrdinalIgnoreCase))
                    return i;
            }

            // Create new variable
            var newVar = new VarParam { Name = varName, Value = "0" };
            _paramList.Add(newVar);
            return _paramList.Count - 1;
        }

        private string ConvertDotNotation(string param)
        {
            // Pascal keeps dotted $ / % names flat in the parameter table.
            // Decompiler output relies on that for exact round-tripping.
            return param;
        }

        private static string ExtractBaseNamePreservingSuffix(string param)
        {
            if (string.IsNullOrEmpty(param))
                return param;

            int indexLevel = 0;
            var baseName = new StringBuilder(param.Length);
            foreach (char c in param)
            {
                if (c == '[')
                {
                    indexLevel++;
                    continue;
                }

                if (c == ']')
                {
                    if (indexLevel > 0)
                        indexLevel--;
                    continue;
                }

                if (indexLevel == 0)
                    baseName.Append(c);
            }

            return baseName.ToString();
        }

        private List<string> ExtractArrayIndexes(string param)
        {
            // Extract array indexes from a parameter like VAR[index1][index2]
            // Returns list of index expressions
            var indexes = new List<string>();
            int level = 0;
            StringBuilder currentIndex = new StringBuilder();
            bool inIndex = false;

            foreach (char c in param)
            {
                if (c == '[')
                {
                    if (level == 0)
                    {
                        inIndex = true;
                        currentIndex.Clear();
                    }
                    else
                    {
                        currentIndex.Append(c);
                    }
                    level++;
                }
                else if (c == ']')
                {
                    level--;
                    if (level == 0)
                    {
                        indexes.Add(currentIndex.ToString());
                        inIndex = false;
                    }
                    else
                    {
                        currentIndex.Append(c);
                    }
                }
                else if (inIndex)
                {
                    currentIndex.Append(c);
                }
            }

            return indexes;
        }

        private void WriteArrayIndexes(string param, int lineNumber, byte scriptID = 0, List<byte>? cmdCode = null)
        {
            // Parse and write array indexes from parameter
            var indexes = ExtractArrayIndexes(param);

            if (indexes.Count == 0)
            {
                // No indexes
                WriteCodeByte(cmdCode, 0);
                return;
            }

            // Write index count
            WriteCodeByte(cmdCode, (byte)indexes.Count);

            // Write each index: type byte + data (format matches TWX decompiler ReadIndexValues)
            foreach (string indexExpr in indexes)
            {
                // Pre-compile any expression in the index (e.g. ($emptyShipCount+1) → $$1).
                // For simple variable/constant leaves this is a no-op.
                string compiledIndex = CompileParamToVar(indexExpr, lineNumber, scriptID);

                // Each index can be a variable, constant, or sysconst
                byte indexType = IdentifyParam(compiledIndex);

                // Write type byte first
                WriteCodeByte(cmdCode, indexType);

                if (indexType == ScriptConstants.PARAM_VAR || indexType == ScriptConstants.PARAM_PROGVAR)
                {
                    // Variable index – extend name for include scripts
                    string indexVarName = ExtractBaseNamePreservingSuffix(compiledIndex);

                    if (scriptID > 0 && scriptID < _includeScriptList.Count && !indexVarName.Contains('~'))
                    {
                        if (indexVarName.StartsWith("$"))
                            indexVarName = indexVarName.Length > 1 && char.IsDigit(indexVarName[1])
                                ? "$" + _includeScriptList[scriptID] + "~" + indexVarName
                                : "$" + _includeScriptList[scriptID] + "~" + indexVarName.Substring(1);
                        else if (indexVarName.StartsWith("%") && !indexVarName.StartsWith("%%"))
                            indexVarName = indexVarName.Length > 1 && char.IsDigit(indexVarName[1])
                                ? "%" + _includeScriptList[scriptID] + "~" + indexVarName
                                : "%" + _includeScriptList[scriptID] + "~" + indexVarName.Substring(1);
                    }
                    else if (indexVarName.StartsWith("$"))
                    {
                        TrackStrictNamespaceReference(indexVarName, lineNumber, scriptID, "variable");
                    }
                    else if (indexVarName.StartsWith("%"))
                    {
                        TrackStrictNamespaceReference(indexVarName, lineNumber, scriptID, "program variable");
                    }

                    int indexId = FindOrCreateVariable(indexVarName);
                    WriteCodeBytes(cmdCode, BitConverter.GetBytes(indexId));
                    WriteArrayIndexes(compiledIndex, lineNumber, scriptID, cmdCode); // Recursive for nested arrays
                }
                else if (indexType == ScriptConstants.PARAM_SYSCONST)
                {
                    // System constant - write 16-bit ID + recursively write its indexes
                    string constName = compiledIndex;
                    int indexLevel = 0;
                    StringBuilder baseName = new StringBuilder();
                    foreach (char c in constName)
                    {
                        if (c == '[') indexLevel++;
                        else if (c == ']') indexLevel--;
                        else if (indexLevel == 0) baseName.Append(c);
                    }

                    int indexId = -1;
                    if (_scriptRef is ScriptRef scriptRef)
                    {
                        indexId = scriptRef.FindSysConst(baseName.ToString());
                    }

                    if (indexId < 0)
                        throw new Exception($"Unknown system constant in array index: {compiledIndex}");

                    WriteCodeBytes(cmdCode, BitConverter.GetBytes((ushort)indexId));
                    WriteArrayIndexes(compiledIndex, lineNumber, scriptID, cmdCode); // Recursive for nested arrays
                }
                else if (indexType == ScriptConstants.PARAM_CONST)
                {
                    // Constant index - write 32-bit parameter ID
                    string value = compiledIndex;
                    if (value.StartsWith('"') && value.EndsWith('"'))
                        value = value.Substring(1, value.Length - 2);

                    var newParam = new CmdParam { Value = value };
                    int indexId = _paramList.Count;
                    _paramList.Add(newParam);
                    WriteCodeBytes(cmdCode, BitConverter.GetBytes(indexId));
                }
                else if (indexType == ScriptConstants.PARAM_CHAR)
                {
                    // Character index - write 1 byte
                    if (compiledIndex.StartsWith('#'))
                    {
                        byte charCode = byte.Parse(compiledIndex.Substring(1));
                        WriteCodeByte(cmdCode, charCode);
                    }
                }
            }
        }

        private static void AddScriptPathCandidates(List<string> candidates, HashSet<string> seen, string baseDirectory, string filename)
        {
            if (string.IsNullOrWhiteSpace(baseDirectory))
                return;

            string basePath = Path.GetFullPath(baseDirectory);
            string target = Path.Combine(basePath, filename);
            string extension = Path.GetExtension(target);

            void AddCandidate(string path)
            {
                string fullPath = Path.GetFullPath(path);
                if (seen.Add(fullPath))
                    candidates.Add(fullPath);
            }

            if (!string.IsNullOrEmpty(extension))
            {
                AddCandidate(target);
                return;
            }

            AddCandidate(target);
            AddCandidate(target + ".ts");
            AddCandidate(target + ".cts");
            AddCandidate(target + ".inc");
        }

        private static string? ResolveExistingPathCaseInsensitive(string path)
        {
            string fullPath = Path.GetFullPath(path);
            if (File.Exists(fullPath))
                return fullPath;

            string? root = Path.GetPathRoot(fullPath);
            if (string.IsNullOrEmpty(root))
                return null;

            string current = root;
            string relative = fullPath.Substring(root.Length);
            string[] parts = relative.Split(
                new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar },
                StringSplitOptions.RemoveEmptyEntries);

            foreach (string part in parts)
            {
                if (!Directory.Exists(current))
                    return null;

                string? match = Directory.EnumerateFileSystemEntries(current)
                    .FirstOrDefault(entry => string.Equals(Path.GetFileName(entry), part, StringComparison.OrdinalIgnoreCase));

                if (string.IsNullOrEmpty(match))
                    return null;

                current = match;
            }

            return File.Exists(current) ? current : null;
        }

        private string ResolveIncludePath(string filename)
        {
            filename = filename.Replace('\\', Path.DirectorySeparatorChar);
            string searchRoot = !string.IsNullOrWhiteSpace(_rootScriptDirectory)
                ? _rootScriptDirectory
                : Path.GetFullPath(Directory.GetCurrentDirectory());

            var candidates = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (Path.IsPathRooted(filename))
            {
                AddScriptPathCandidates(candidates, seen, Path.GetDirectoryName(filename) ?? string.Empty, Path.GetFileName(filename));
            }
            else
            {
                // Match Pascal FetchScript behavior as closely as practical:
                // start at the script root, then walk upward so scripts kept in
                // nested folders can still resolve sibling "include/" trees.
                string? probeRoot = searchRoot;
                while (!string.IsNullOrWhiteSpace(probeRoot))
                {
                    AddScriptPathCandidates(candidates, seen, probeRoot, filename);
                    AddScriptPathCandidates(candidates, seen, Path.Combine(probeRoot, "scripts"), filename);

                    string? parent = Directory.GetParent(probeRoot)?.FullName;
                    if (string.IsNullOrWhiteSpace(parent)
                        || string.Equals(parent, probeRoot, StringComparison.OrdinalIgnoreCase))
                    {
                        break;
                    }

                    probeRoot = parent;
                }

                // Final compatibility fallback: resolve relative to the current
                // include file directory for decompiled or ad-hoc layouts.
                AddScriptPathCandidates(candidates, seen, _scriptDirectory, filename);
            }

            foreach (string candidate in candidates)
            {
                string? resolved = ResolveExistingPathCaseInsensitive(candidate);
                if (!string.IsNullOrEmpty(resolved))
                    return resolved;
            }

            string searched = candidates.Count > 0
                ? string.Join(", ", candidates)
                : filename;
            throw new FileNotFoundException($"Include file not found: {filename} (searched: {searched})");
        }

        private void IncludeFile(string filename)
        {
            string fullPath = ResolveIncludePath(filename);
            AddSourceDependency(fullPath);
            if (!_compiledIncludePaths.Add(fullPath))
                return;

            List<string> scriptText;
            if (TrimIncludes &&
                _trimmedIncludeSources != null &&
                _trimmedIncludeSources.TryGetValue(fullPath, out List<string>? trimmedSource))
            {
                scriptText = trimmedSource;
            }
            else
            {
                scriptText = LoadSourceLines(fullPath);
            }

            // Get the actual filename from the filesystem (preserves correct case)
            // This is important because include statements may use different case than the actual file
            // e.g., "include\move" should get the actual filename "Move.ts" on case-insensitive filesystems
            // On case-insensitive filesystems, FileInfo.Name returns the name as passed in, not the actual case
            // So we need to query the directory to get the real filename
            string? directory = Path.GetDirectoryName(fullPath);
            string searchFileName = Path.GetFileName(fullPath);
            string actualFileName = searchFileName; // fallback

            if (!string.IsNullOrEmpty(directory) && Directory.Exists(directory))
            {
                // Find the actual file with correct case from the directory listing
                var filesInDir = Directory.GetFiles(directory);
                foreach (var file in filesInDir)
                {
                    string fileNameInDir = Path.GetFileName(file);
                    if (string.Equals(fileNameInDir, searchFileName, StringComparison.OrdinalIgnoreCase))
                    {
                        actualFileName = fileNameInDir;
                        break;
                    }
                }
            }

            string includeName = Path.GetFileNameWithoutExtension(actualFileName).ToUpperInvariant();
            string previousScriptDirectory = _scriptDirectory;
            string previousScriptFile = _scriptFile;
            _scriptDirectory = directory ?? previousScriptDirectory;

            try
            {
                CompileFromStrings(scriptText, includeName);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error in include '{includeName}': {ex.Message}", ex);
            }
            finally
            {
                _scriptDirectory = previousScriptDirectory;
                _scriptFile = previousScriptFile;
            }
        }

        private string ResolveIncludePathForPlanning(string filename, string currentDirectory)
        {
            string previousScriptDirectory = _scriptDirectory;
            _scriptDirectory = currentDirectory;
            try
            {
                return ResolveIncludePath(filename);
            }
            finally
            {
                _scriptDirectory = previousScriptDirectory;
            }
        }

        private static List<string> TokenizeSourceLine(string line)
        {
            var tokens = new List<string>();
            if (string.IsNullOrWhiteSpace(line))
                return tokens;

            var token = new StringBuilder();
            bool inQuote = false;
            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (!inQuote && c == '/' && i + 1 < line.Length && line[i + 1] == '/')
                    break;

                if (!inQuote && char.IsWhiteSpace(c))
                {
                    if (token.Length > 0)
                    {
                        tokens.Add(token.ToString());
                        token.Clear();
                    }
                    continue;
                }

                token.Append(c);
                if (c == '"')
                    inQuote = !inQuote;
            }

            if (token.Length > 0)
                tokens.Add(token.ToString());

            return tokens;
        }

        private static bool IsSubstantiveSourceLine(string line)
        {
            if (string.IsNullOrWhiteSpace(line))
                return false;

            string trimmed = line.TrimStart();
            return !(trimmed.StartsWith("#", StringComparison.Ordinal) ||
                     trimmed.StartsWith("//", StringComparison.Ordinal));
        }

        private static bool IsLabelDeclarationLine(string line, out string labelToken)
        {
            labelToken = string.Empty;
            var tokens = TokenizeSourceLine(line.TrimStart());
            if (tokens.Count != 1)
                return false;

            if (!tokens[0].StartsWith(":", StringComparison.Ordinal))
                return false;

            labelToken = tokens[0];
            return true;
        }

        private static bool IsUnconditionalTransferLine(string line)
        {
            var tokens = TokenizeSourceLine(line.TrimStart());
            if (tokens.Count == 0)
                return false;

            string cmd = tokens[0].ToUpperInvariant();
            if (cmd == "RETURN" || cmd == "HALT")
                return true;

            return cmd == "GOTO" && tokens.Count >= 2 && tokens[1].StartsWith(":", StringComparison.Ordinal);
        }

        private static bool TryNormalizeSourceLabelToken(string token, string currentNamespace, bool allowRootLocal, out string normalizedLabel)
        {
            normalizedLabel = string.Empty;
            if (string.IsNullOrWhiteSpace(token))
                return false;

            token = token.Trim();
            if (token.StartsWith('"') && token.EndsWith('"') && token.Length >= 2)
                token = token.Substring(1, token.Length - 2);

            if (!token.StartsWith(":", StringComparison.Ordinal))
                return false;

            string label = token.Substring(1);
            if (string.IsNullOrWhiteSpace(label))
                return false;

            if (label.StartsWith(":", StringComparison.Ordinal))
                return false;

            if (label.StartsWith("~", StringComparison.Ordinal))
            {
                if (label.Length == 1)
                    return false;

                normalizedLabel = label.Substring(1).ToUpperInvariant();
                return true;
            }

            if (label.Contains('~'))
            {
                normalizedLabel = label.ToUpperInvariant();
                return true;
            }

            if (string.IsNullOrEmpty(currentNamespace))
            {
                if (!allowRootLocal)
                    return false;

                normalizedLabel = label.ToUpperInvariant();
                return true;
            }

            normalizedLabel = (currentNamespace + "~" + label).ToUpperInvariant();
            return true;
        }

        private static string NormalizeTrimLabelToken(string token, string currentNamespace, bool allowRootLocal = false)
        {
            return TryNormalizeSourceLabelToken(token, currentNamespace, allowRootLocal, out string normalizedLabel)
                ? normalizedLabel
                : string.Empty;
        }

        private List<string> ExtractQualifiedLabelReferences(IEnumerable<string> lines, string currentNamespace, out bool dynamicTargets, bool allowRootLocal = false)
        {
            var references = new List<string>();
            dynamicTargets = false;

            foreach (string rawLine in lines)
            {
                if (!IsSubstantiveSourceLine(rawLine))
                    continue;

                string line = rawLine.TrimStart();
                var tokens = TokenizeSourceLine(line);
                if (tokens.Count == 0)
                    continue;

                if (tokens[0].StartsWith(":", StringComparison.Ordinal))
                    continue;

                string cmd = tokens[0].ToUpperInvariant();
                string target = string.Empty;

                switch (cmd)
                {
                    case "GOTO":
                    case "GOSUB":
                        if (tokens.Count >= 2)
                            target = tokens[1];
                        break;

                    case "BRANCH":
                        if (tokens.Count >= 3)
                            target = tokens[2];
                        break;

                    case "SETTEXTTRIGGER":
                    case "SETTEXTLINETRIGGER":
                    case "SETTEXTOUTTRIGGER":
                    case "SETDELAYTRIGGER":
                    case "SETEVENTTRIGGER":
                        if (tokens.Count >= 3)
                            target = tokens[2];
                        break;

                    case "ADDMENU":
                        if (tokens.Count >= 6)
                            target = tokens[5];
                        break;
                }

                if (string.IsNullOrEmpty(target) || target == "\"\"")
                    continue;

                string normalized = NormalizeTrimLabelToken(target, currentNamespace, allowRootLocal);
                if (!string.IsNullOrEmpty(normalized))
                {
                    references.Add(normalized);
                }
                else
                {
                    dynamicTargets = true;
                }
            }

            return references;
        }

        private void CollectTrimFileRecursive(string fullPath, Dictionary<string, TrimFileInfo> files)
        {
            fullPath = Path.GetFullPath(fullPath);
            if (files.ContainsKey(fullPath))
                return;

            List<string> lines = LoadSourceLines(fullPath);
            var info = new TrimFileInfo
            {
                FullPath = fullPath,
                Namespace = Path.GetFileNameWithoutExtension(fullPath).ToUpperInvariant(),
                Lines = lines
            };
            files[fullPath] = info;

            string currentDirectory = Path.GetDirectoryName(fullPath) ?? string.Empty;
            foreach (string rawLine in lines)
            {
                if (!IsSubstantiveSourceLine(rawLine))
                    continue;

                var tokens = TokenizeSourceLine(rawLine.TrimStart());
                if (tokens.Count < 2)
                    continue;

                if (!string.Equals(tokens[0], "INCLUDE", StringComparison.OrdinalIgnoreCase))
                    continue;

                string includeRef = tokens[1];
                if (includeRef.StartsWith('"') && includeRef.EndsWith('"') && includeRef.Length >= 2)
                    includeRef = includeRef.Substring(1, includeRef.Length - 2);

                string includeFullPath = ResolveIncludePathForPlanning(includeRef, currentDirectory);
                info.IncludePaths.Add(includeFullPath);
                CollectTrimFileRecursive(includeFullPath, files);
            }
        }

        private void AnalyzeTrimFile(TrimFileInfo info)
        {
            info.Blocks.Clear();
            info.BlocksByLabel.Clear();
            info.HasExecutablePreamble = false;
            info.TrimDisabled = false;
            info.TrimDisabledReason = string.Empty;

            TrimBlock? currentBlock = null;
            int firstLabelIndex = -1;
            int macroDepth = 0;

            for (int i = 0; i < info.Lines.Count; i++)
            {
                string line = info.Lines[i];
                if (IsLabelDeclarationLine(line, out string labelToken))
                {
                    if (macroDepth > 0)
                    {
                        info.TrimDisabled = true;
                        info.TrimDisabledReason = "Label appears inside active IF/WHILE macro block";
                        return;
                    }

                    string labelName = NormalizeTrimLabelToken(labelToken, info.Namespace);
                    if (string.IsNullOrEmpty(labelName))
                    {
                        info.TrimDisabled = true;
                        info.TrimDisabledReason = "Unsupported local or compiler-generated label";
                        return;
                    }

                    if (currentBlock != null)
                    {
                        currentBlock.EndLineIndexExclusive = i;
                        info.Blocks.Add(currentBlock);
                        info.BlocksByLabel[currentBlock.Label] = currentBlock;
                    }

                    if (firstLabelIndex < 0)
                        firstLabelIndex = i;

                    currentBlock = new TrimBlock
                    {
                        Label = labelName,
                        StartLineIndex = i,
                        EndLineIndexExclusive = info.Lines.Count
                    };
                }
                else if (firstLabelIndex < 0 && IsSubstantiveSourceLine(line))
                {
                    info.HasExecutablePreamble = true;
                }

                var tokens = TokenizeSourceLine(line.TrimStart());
                if (tokens.Count == 0 || tokens[0].StartsWith(":", StringComparison.Ordinal))
                    continue;

                string cmd = tokens[0].ToUpperInvariant();
                if (cmd == "IF" || cmd == "WHILE")
                {
                    macroDepth++;
                }
                else if (cmd == "END")
                {
                    if (macroDepth > 0)
                        macroDepth--;
                }
            }

            if (currentBlock != null)
            {
                currentBlock.EndLineIndexExclusive = info.Lines.Count;
                info.Blocks.Add(currentBlock);
                info.BlocksByLabel[currentBlock.Label] = currentBlock;
            }

            if (info.HasExecutablePreamble)
            {
                info.TrimDisabled = true;
                info.TrimDisabledReason = "Executable preamble before first label";
                return;
            }

            if (info.Blocks.Count == 0)
            {
                info.TrimDisabled = true;
                info.TrimDisabledReason = "No labels found";
                return;
            }

            foreach (TrimBlock block in info.Blocks)
            {
                List<string> blockLines = info.Lines
                    .GetRange(block.StartLineIndex, block.EndLineIndexExclusive - block.StartLineIndex);

                List<string> refs = ExtractQualifiedLabelReferences(blockLines, info.Namespace, out bool dynamicTargets);
                block.References.AddRange(refs);

                if (dynamicTargets)
                {
                    if (!PruneIncludeBranches)
                    {
                        info.TrimDisabled = true;
                        info.TrimDisabledReason = "Dynamic or unsupported label targets";
                        return;
                    }

                    block.HasDynamicTargets = true;
                }

                bool fallsThrough = true;
                for (int i = block.EndLineIndexExclusive - 1; i >= block.StartLineIndex; i--)
                {
                    string candidate = info.Lines[i];
                    if (!IsSubstantiveSourceLine(candidate))
                        continue;

                    if (IsLabelDeclarationLine(candidate, out _))
                    {
                        fallsThrough = true;
                    }
                    else
                    {
                        fallsThrough = !IsUnconditionalTransferLine(candidate);
                    }
                    break;
                }

                block.FallsThrough = fallsThrough;
            }
        }

        private Dictionary<string, List<string>> BuildTrimmedIncludeSources(string rootFullPath)
        {
            var files = new Dictionary<string, TrimFileInfo>(StringComparer.OrdinalIgnoreCase);
            CollectTrimFileRecursive(rootFullPath, files);

            foreach (string path in files.Keys)
                AddSourceDependency(path);

            string rootFull = Path.GetFullPath(rootFullPath);
            var includeFiles = files.Values
                .Where(f => !string.Equals(f.FullPath, rootFull, StringComparison.OrdinalIgnoreCase))
                .ToList();

            bool duplicateNamespaces = includeFiles
                .GroupBy(f => f.Namespace, StringComparer.OrdinalIgnoreCase)
                .Any(g => g.Select(x => x.FullPath).Distinct(StringComparer.OrdinalIgnoreCase).Count() > 1);
            if (duplicateNamespaces)
                return new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

            foreach (TrimFileInfo info in includeFiles)
                AnalyzeTrimFile(info);

            DynamicReachabilityHints? dynamicHints = PruneIncludeBranches
                ? BuildDynamicReachabilityHints()
                : null;
            var namespaceMap = includeFiles.ToDictionary(f => f.Namespace, f => f, StringComparer.OrdinalIgnoreCase);
            var reachableLabelsByFile = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
            var expandedFullFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var workQueue = new Queue<(TrimFileInfo File, string Label)>();

            void EnqueueEntireFile(TrimFileInfo file)
            {
                if (file.TrimDisabled)
                {
                    if (!expandedFullFiles.Add(file.FullPath))
                        return;

                    List<string> fullRefs = ExtractQualifiedLabelReferences(file.Lines, file.Namespace, out _);
                    foreach (string nextRef in fullRefs)
                        EnqueueLabel(nextRef);
                    return;
                }

                if (!reachableLabelsByFile.TryGetValue(file.FullPath, out HashSet<string>? labels))
                {
                    labels = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    reachableLabelsByFile[file.FullPath] = labels;
                }

                foreach (TrimBlock block in file.Blocks)
                {
                    if (labels.Add(block.Label))
                        workQueue.Enqueue((file, block.Label));
                }
            }

            void EnqueueLabel(string qualifiedLabel)
            {
                int tilde = qualifiedLabel.IndexOf('~');
                if (tilde <= 0)
                    return;

                string ns = qualifiedLabel.Substring(0, tilde);
                if (!namespaceMap.TryGetValue(ns, out TrimFileInfo? file))
                    return;

                if (file.TrimDisabled)
                {
                    EnqueueEntireFile(file);
                    return;
                }

                if (!reachableLabelsByFile.TryGetValue(file.FullPath, out HashSet<string>? labels))
                {
                    labels = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    reachableLabelsByFile[file.FullPath] = labels;
                }

                if (labels.Add(qualifiedLabel))
                    workQueue.Enqueue((file, qualifiedLabel));
            }

            void EnqueueDynamicHints()
            {
                if (dynamicHints == null)
                    return;

                foreach (string pinnedLabel in dynamicHints.PinnedLabels)
                    EnqueueLabel(pinnedLabel);

                foreach (string pinnedNamespace in dynamicHints.PinnedNamespaces)
                {
                    if (namespaceMap.TryGetValue(pinnedNamespace, out TrimFileInfo? pinnedFile))
                        EnqueueEntireFile(pinnedFile);
                }
            }

            List<string> rootRefs = ExtractQualifiedLabelReferences(
                files[rootFull].Lines,
                string.Empty,
                out bool rootDynamicTargets,
                allowRootLocal: PruneIncludeBranches);
            HashSet<string> pinnedNamespaces = new(StringComparer.OrdinalIgnoreCase);
            bool pinRootLabels = false;
            if (rootDynamicTargets)
            {
                if (dynamicHints != null)
                {
                    pinnedNamespaces = dynamicHints.PinnedNamespaces;
                    pinRootLabels = dynamicHints.PinRootLabels;
                }
                else
                {
                    pinnedNamespaces = BuildPinnedDynamicNamespaces(out pinRootLabels);
                }

                // If the root script has dynamic targets and we cannot infer any
                // include namespaces to preserve, fall back to the current safe
                // behavior and skip source trimming for this artifact.
                if (pinnedNamespaces.Count == 0 && !pinRootLabels)
                    return new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            }

            foreach (string rootRef in rootRefs)
                EnqueueLabel(rootRef);

            EnqueueDynamicHints();

            foreach (string pinnedNamespace in pinnedNamespaces)
            {
                if (namespaceMap.TryGetValue(pinnedNamespace, out TrimFileInfo? file))
                    EnqueueEntireFile(file);
            }

            while (workQueue.Count > 0)
            {
                (TrimFileInfo file, string label) = workQueue.Dequeue();
                if (!file.BlocksByLabel.TryGetValue(label, out TrimBlock? block))
                    continue;

                foreach (string nextRef in block.References)
                    EnqueueLabel(nextRef);

                if (block.HasDynamicTargets)
                    EnqueueDynamicHints();

                if (!block.FallsThrough)
                    continue;

                int blockIndex = file.Blocks.FindIndex(b => string.Equals(b.Label, block.Label, StringComparison.OrdinalIgnoreCase));
                if (blockIndex >= 0 && blockIndex + 1 < file.Blocks.Count)
                    EnqueueLabel(file.Blocks[blockIndex + 1].Label);
            }

            var trimmed = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            foreach (TrimFileInfo info in includeFiles)
            {
                if (info.TrimDisabled)
                    continue;

                if (!reachableLabelsByFile.TryGetValue(info.FullPath, out HashSet<string>? reachableLabels))
                {
                    trimmed[info.FullPath] = new List<string>();
                    continue;
                }

                var keptLines = new List<string>();
                foreach (TrimBlock block in info.Blocks)
                {
                    if (!reachableLabels.Contains(block.Label))
                        continue;

                    keptLines.AddRange(info.Lines.GetRange(block.StartLineIndex, block.EndLineIndexExclusive - block.StartLineIndex));
                }

                trimmed[info.FullPath] = keptLines;
            }

            return trimmed;
        }

        private void PruneCompiledBytecode()
        {
            var report = new BytecodePruneReport
            {
                Attempted = true,
                OriginalCodeBytes = _codeSize,
                OriginalParamCount = _paramList.Count,
                OriginalLabelCount = _labelList.Count
            };
            LastBytecodePruneReport = report;

            if (_code.Length == 0)
            {
                report.Status = "empty";
                report.Reason = "No compiled code";
                return;
            }

            try
            {
                // Dynamic GOTO/GOSUB targets are valid TWX script behavior.  The
                // bytecode pruner must preserve labels assigned to variables even
                // when include-branch source pruning is not enabled.
                DynamicReachabilityHints dynamicHints = BuildDynamicReachabilityHints();
                MaterializeDynamicLabelAliases(dynamicHints);
                var labelsPinnedBeforePrune = new HashSet<string>(
                    dynamicHints.PinnedLabels.Where(label => FindLabel(label) >= 0),
                    StringComparer.OrdinalIgnoreCase);
                PreparedScriptProgram prepared = PreparedScriptDecoder.Decode(this);
                PreparedInstruction[] instructions = prepared.Instructions;
                HashSet<string> pinnedNamespaces;
                bool pinRootLabels;
                if (dynamicHints.HasAnyHints)
                {
                    pinnedNamespaces = dynamicHints.PinnedNamespaces;
                    pinRootLabels = dynamicHints.PinRootLabels;
                }
                else
                {
                    pinnedNamespaces = BuildPinnedDynamicNamespaces(out pinRootLabels);
                }
                report.OriginalInstructionCount = instructions.Length;
                if (instructions.Length == 0)
                {
                    report.Status = "empty";
                    report.Reason = "No decoded instructions";
                    return;
                }

                var reachable = new bool[instructions.Length];
                var workQueue = new Queue<int>();
                bool unsupportedFlow = false;

                void EnqueueInstruction(int instructionIndex)
                {
                    if (instructionIndex < 0 || instructionIndex >= instructions.Length)
                        return;

                    if (reachable[instructionIndex])
                        return;

                    reachable[instructionIndex] = true;
                    workQueue.Enqueue(instructionIndex);
                }

                bool IsPinnedNamespace(byte scriptId)
                {
                    string scriptNamespace = GetScriptNamespace(scriptId);
                    if (string.IsNullOrEmpty(scriptNamespace))
                        return pinRootLabels;

                    return pinnedNamespaces.Contains(scriptNamespace);
                }

                void EnqueuePinnedLabelSets()
                {
                    foreach (ScriptLabel label in _labelList)
                    {
                        if (label.Location == _codeSize)
                            continue;

                        string labelName = label.Name;
                        bool keepLabel = dynamicHints?.PinnedLabels.Contains(labelName) == true;
                        if (!keepLabel)
                        {
                            int tildeIndex = labelName.IndexOf('~');
                            keepLabel = tildeIndex > 0
                                ? pinnedNamespaces.Contains(labelName.Substring(0, tildeIndex))
                                : pinRootLabels;
                        }

                        if (!keepLabel)
                            continue;

                        if (prepared.TryGetInstructionIndex(label.Location, out int instructionIndex))
                            EnqueueInstruction(instructionIndex);
                    }
                }

                bool TryEnqueueLabelTarget(PreparedInstruction instruction, int paramIndex)
                {
                    if (paramIndex < 0 || paramIndex >= instruction.Params.Length)
                        return false;

                    if (!TryResolveReachabilityLabel(instruction, instruction.Params[paramIndex], out string qualifiedLabel))
                        return false;

                    int targetOffset = FindLabel(qualifiedLabel);
                    if (targetOffset < 0)
                        return false;

                    if (targetOffset == _codeSize)
                        return true;

                    if (!prepared.TryGetInstructionIndex(targetOffset, out int instructionIndex))
                        return false;

                    EnqueueInstruction(instructionIndex);
                    return true;
                }

                bool TryEnqueueDynamicFallback()
                {
                    if (dynamicHints == null || !dynamicHints.HasAnyHints)
                        return false;

                    EnqueuePinnedLabelSets();
                    return true;
                }

                bool IsExplicitEmptyTarget(PreparedInstruction instruction, int paramIndex)
                {
                    if (paramIndex < 0 || paramIndex >= instruction.Params.Length)
                        return false;

                    PreparedParam param = instruction.Params[paramIndex];
                    if (param.ParamType == ScriptConstants.PARAM_CONST)
                        return string.IsNullOrWhiteSpace(param.LiteralValue);

                    if (param.ParamType == ScriptConstants.PARAM_CHAR)
                        return param.CharCode == 0;

                    return false;
                }

                void EnqueueNamespaceFallback(PreparedInstruction instruction, int paramIndex)
                {
                    string? preferredNamespace = null;

                    if (paramIndex >= 0 &&
                        paramIndex < instruction.Params.Length &&
                        TryResolveReachabilityLabel(instruction, instruction.Params[paramIndex], out string qualifiedLabel))
                    {
                        int tildeIndex = qualifiedLabel.IndexOf('~');
                        if (tildeIndex > 0)
                            preferredNamespace = qualifiedLabel.Substring(0, tildeIndex);
                    }

                    string scriptNamespace = !string.IsNullOrEmpty(preferredNamespace)
                        ? preferredNamespace
                        : GetScriptNamespace(instruction.ScriptId);

                    foreach (ScriptLabel label in _labelList)
                    {
                        string labelName = label.Name;
                        bool keepLabel;
                        if (!string.IsNullOrEmpty(scriptNamespace))
                        {
                            keepLabel = labelName.StartsWith(scriptNamespace + "~", StringComparison.OrdinalIgnoreCase);
                        }
                        else
                        {
                            keepLabel = labelName.IndexOf('~') < 0;
                        }

                        if (!keepLabel || label.Location == _codeSize)
                            continue;

                        if (prepared.TryGetInstructionIndex(label.Location, out int labelInstructionIndex))
                            EnqueueInstruction(labelInstructionIndex);
                    }
                }

                EnqueueInstruction(0);
                EnqueuePinnedLabelSets();

                while (workQueue.Count > 0)
                {
                    int instructionIndex = workQueue.Dequeue();
                    PreparedInstruction instruction = instructions[instructionIndex];
                    if (instruction.IsLabel)
                    {
                        EnqueueInstruction(instruction.NextInstructionIndex);
                        continue;
                    }

                    string commandName = instruction.CommandName.ToUpperInvariant();
                    bool fallThrough = true;

                    switch (commandName)
                    {
                        case "GOTO":
                            if (!TryEnqueueLabelTarget(instruction, 0))
                                unsupportedFlow = !(TryEnqueueDynamicFallback() || IsPinnedNamespace(instruction.ScriptId));
                            fallThrough = false;
                            break;

                        case "GOSUB":
                            if (!TryEnqueueLabelTarget(instruction, 0))
                                unsupportedFlow = !(TryEnqueueDynamicFallback() || IsPinnedNamespace(instruction.ScriptId));
                            break;

                        case "BRANCH":
                            if (!TryEnqueueLabelTarget(instruction, 1))
                                unsupportedFlow = !(TryEnqueueDynamicFallback() || IsPinnedNamespace(instruction.ScriptId));
                            break;

                        case "SETTEXTTRIGGER":
                        case "SETTEXTLINETRIGGER":
                        case "SETTEXTOUTTRIGGER":
                        case "SETDELAYTRIGGER":
                        case "SETEVENTTRIGGER":
                            if (!TryEnqueueLabelTarget(instruction, 1))
                            {
                                if (!TryEnqueueDynamicFallback())
                                    EnqueueNamespaceFallback(instruction, 1);
                            }
                            break;

                        case "ADDMENU":
                            if (!IsExplicitEmptyTarget(instruction, 4) &&
                                !TryEnqueueLabelTarget(instruction, 4))
                            {
                                if (!TryEnqueueDynamicFallback())
                                    EnqueueNamespaceFallback(instruction, 4);
                            }
                            break;

                        case "RETURN":
                        case "HALT":
                            fallThrough = false;
                            break;
                    }

                    if (unsupportedFlow)
                    {
                        report.Status = "skipped";
                        report.Reason = $"Unsupported dynamic or unresolved target in {instruction.CommandName}";
                        return;
                    }

                    if (fallThrough)
                        EnqueueInstruction(instruction.NextInstructionIndex);
                }

                report.ReachableInstructionCount = reachable.Count(isReachable => isReachable);

                var usedParamIds = new HashSet<int>();
                for (int i = 0; i < instructions.Length; i++)
                {
                    if (!reachable[i] || instructions[i].IsLabel)
                        continue;

                    foreach (PreparedParam param in instructions[i].Params)
                        CollectUsedParamIds(param, usedParamIds);
                }

                bool addedBaseVar;
                do
                {
                    addedBaseVar = false;
                    foreach (int paramId in usedParamIds.ToArray())
                    {
                        if (paramId < 0 || paramId >= _paramList.Count)
                            continue;

                        if (_paramList[paramId] is not VarParam varParam)
                            continue;

                        if (!TryFindArithmeticBaseParamId(varParam.Name, out int baseParamId))
                            continue;

                        if (usedParamIds.Add(baseParamId))
                            addedBaseVar = true;
                    }
                } while (addedBaseVar);

                List<int> sortedParamIds = usedParamIds.OrderBy(id => id).ToList();
                var oldToNewParamIds = new Dictionary<int, int>();
                for (int i = 0; i < sortedParamIds.Count; i++)
                    oldToNewParamIds[sortedParamIds[i]] = i;
                report.ReachableParamCount = sortedParamIds.Count;

                var newCode = new List<byte>(_code.Length);
                var oldToNewOffsets = new Dictionary<int, int>();
                int reachableCommandCount = 0;

                for (int i = 0; i < instructions.Length; i++)
                {
                    if (!reachable[i])
                        continue;

                    PreparedInstruction instruction = instructions[i];
                    oldToNewOffsets[instruction.RawOffset] = newCode.Count;
                    EncodePreparedInstruction(newCode, instruction, oldToNewParamIds);
                    if (!instruction.IsLabel)
                        reachableCommandCount++;
                }

                int oldCodeSize = _codeSize;
                int newCodeSize = newCode.Count;
                var newLabels = new List<ScriptLabel>();
                var newLabelDict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                foreach (ScriptLabel label in _labelList)
                {
                    int newLocation;
                    if (label.Location == oldCodeSize)
                    {
                        newLocation = newCodeSize;
                    }
                    else if (!oldToNewOffsets.TryGetValue(label.Location, out newLocation))
                    {
                        continue;
                    }

                    var newLabel = new ScriptLabel
                    {
                        Name = label.Name,
                        Location = newLocation
                    };
                    newLabels.Add(newLabel);
                    if (!newLabelDict.ContainsKey(newLabel.Name))
                        newLabelDict[newLabel.Name] = newLocation;
                }

                bool codeChanged = newCodeSize != oldCodeSize;
                bool paramsChanged = sortedParamIds.Count != _paramList.Count;
                bool labelsChanged = newLabels.Count != _labelList.Count;
                if (!labelsChanged)
                {
                    for (int i = 0; i < newLabels.Count; i++)
                    {
                        if (newLabels[i].Location != _labelList[i].Location ||
                            !string.Equals(newLabels[i].Name, _labelList[i].Name, StringComparison.Ordinal))
                        {
                            labelsChanged = true;
                            break;
                        }
                    }
                }
                report.ReachableLabelCount = newLabels.Count;
                report.PrunedCodeBytes = newCodeSize;

                if (labelsPinnedBeforePrune.Count > 0)
                {
                    var retainedLabels = new HashSet<string>(
                        newLabels.Select(label => label.Name),
                        StringComparer.OrdinalIgnoreCase);
                    string? missingPinnedLabel = labelsPinnedBeforePrune.FirstOrDefault(label => !retainedLabels.Contains(label));
                    if (!string.IsNullOrEmpty(missingPinnedLabel))
                    {
                        report.Status = "skipped";
                        report.Reason = $"Pinned variable-held label '{missingPinnedLabel}' would be pruned";
                        return;
                    }
                }

                if (!codeChanged && !paramsChanged && !labelsChanged)
                {
                    report.Status = "unchanged";
                    report.Reason = "All decoded instructions remained reachable";
                    return;
                }

                _code = newCode.ToArray();
                _codeSize = newCodeSize;
                _paramList = sortedParamIds.Select(id => _paramList[id]).ToList();
                _labelList = newLabels;
                _labelDict = newLabelDict;
                _cmdCount = reachableCommandCount;
                _preparedProgram = null;
                report.Changed = true;
                report.Status = "pruned";
                report.Reason = "Removed unreachable instructions";
            }
            catch (Exception ex)
            {
                report.Status = "error";
                report.Reason = ex.Message;
                GlobalModules.DebugLog($"[ScriptCmp.PruneCompiledBytecode] Skipped for '{_scriptFile}': {ex.Message}\n");
            }
        }

        private static void CollectUsedParamIds(PreparedParam param, HashSet<int> usedParamIds)
        {
            if (param.ParamId >= 0)
                usedParamIds.Add(param.ParamId);

            foreach (PreparedParam index in param.Indexes)
                CollectUsedParamIds(index, usedParamIds);
        }

        private bool TryResolveReachabilityLabel(PreparedInstruction instruction, PreparedParam param, out string qualifiedLabel)
        {
            qualifiedLabel = string.Empty;

            if (param.ParamType != ScriptConstants.PARAM_CONST && param.ParamType != ScriptConstants.PARAM_CHAR)
                return false;

            return TryQualifyCompiledLabelToken(instruction.ScriptId, param.LiteralValue, out qualifiedLabel);
        }

        private DynamicReachabilityHints BuildDynamicReachabilityHints()
        {
            var hints = new DynamicReachabilityHints();
            var dynamicTargetVariables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var fallbackNamespacesByVariable = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
            var literalLabelsByVariable = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
            var aliasSourcesByVariable = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
            var opaqueAssignedVariables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            string rootPath = Path.GetFullPath(string.IsNullOrWhiteSpace(_rootScriptFile) ? _scriptFile : _rootScriptFile);

            foreach (SourceDependencyStamp dependency in _sourceDependencies)
            {
                if (!dependency.Path.EndsWith(".ts", StringComparison.OrdinalIgnoreCase))
                    continue;

                List<string> lines = LoadSourceLines(dependency.Path);
                string currentNamespace = dependency.Path.Equals(rootPath, StringComparison.OrdinalIgnoreCase)
                    ? string.Empty
                    : Path.GetFileNameWithoutExtension(dependency.Path).ToUpperInvariant();

                foreach (string rawLine in lines)
                {
                    string line = rawLine.TrimStart();
                    if (string.IsNullOrEmpty(line) || line[0] == '\'')
                        continue;

                    List<string> tokens = TokenizeSourceLine(line);
                    if (tokens.Count == 0)
                        continue;

                    if (TryGetDynamicControlTarget(tokens, currentNamespace, out string targetToken, allowRootLocal: true))
                    {
                        if (TryNormalizeSourceVariableToken(targetToken, currentNamespace, out string normalizedVariable))
                        {
                            dynamicTargetVariables.Add(normalizedVariable);
                            AddToLookup(fallbackNamespacesByVariable, normalizedVariable, currentNamespace);
                        }
                        else
                        {
                            AddDynamicFallbackScope(hints, currentNamespace);
                            foreach (Match match in DynamicNamespaceRegex.Matches(targetToken))
                            {
                                if (match.Groups.Count > 1 && !string.IsNullOrWhiteSpace(match.Groups[1].Value))
                                    hints.PinnedNamespaces.Add(match.Groups[1].Value.ToUpperInvariant());
                            }
                        }
                    }

                    if (TryGetLiteralLabelAssignment(tokens, currentNamespace, out string literalVariable, out string qualifiedLabel, allowRootLocal: true))
                    {
                        AddToLookup(literalLabelsByVariable, literalVariable, qualifiedLabel);
                        hints.PinnedLabels.Add(qualifiedLabel);
                    }
                    else if (TryGetVariableAliasAssignment(tokens, currentNamespace, out string destinationVariable, out string sourceVariable))
                    {
                        AddToLookup(aliasSourcesByVariable, destinationVariable, sourceVariable);
                    }
                    else if (TryGetOpaqueVariableAssignment(tokens, currentNamespace, out string opaqueVariable))
                    {
                        opaqueAssignedVariables.Add(opaqueVariable);
                    }
                }
            }

            foreach (string dynamicVariable in dynamicTargetVariables)
            {
                var visitedVariables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var pendingVariables = new Queue<string>();
                var resolvedLabels = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                pendingVariables.Enqueue(dynamicVariable);

                bool resolvedAnyLabels = false;
                bool needsFallback = false;

                while (pendingVariables.Count > 0)
                {
                    string variable = pendingVariables.Dequeue();
                    if (!visitedVariables.Add(variable))
                        continue;

                    if (literalLabelsByVariable.TryGetValue(variable, out HashSet<string>? labels))
                    {
                        foreach (string label in labels)
                        {
                            hints.PinnedLabels.Add(label);
                            resolvedLabels.Add(label);
                        }
                        resolvedAnyLabels = true;
                    }

                    if (opaqueAssignedVariables.Contains(variable))
                        needsFallback = true;

                    if (aliasSourcesByVariable.TryGetValue(variable, out HashSet<string>? aliases))
                    {
                        foreach (string alias in aliases)
                            pendingVariables.Enqueue(alias);
                    }
                }

                if (!resolvedAnyLabels || needsFallback)
                {
                    if (fallbackNamespacesByVariable.TryGetValue(dynamicVariable, out HashSet<string>? fallbackScopes))
                    {
                        foreach (string fallbackScope in fallbackScopes)
                            AddDynamicFallbackScope(hints, fallbackScope);
                    }
                }

                if (resolvedLabels.Count > 0 &&
                    fallbackNamespacesByVariable.TryGetValue(dynamicVariable, out HashSet<string>? dynamicFallbackScopes))
                {
                    foreach (string fallbackScope in dynamicFallbackScopes)
                    {
                        if (string.IsNullOrEmpty(fallbackScope))
                            continue;

                        foreach (string label in resolvedLabels)
                        {
                            if (label.IndexOf('~') >= 0)
                                continue;

                            AddLabelAlias(hints, fallbackScope + "~" + label, label);
                        }
                    }
                }
            }

            return hints;
        }

        private void MaterializeDynamicLabelAliases(DynamicReachabilityHints hints)
        {
            if (hints.LabelAliases.Count == 0)
                return;

            foreach ((string aliasLabel, string targetLabel) in hints.LabelAliases)
            {
                if (FindLabel(aliasLabel) >= 0)
                {
                    hints.PinnedLabels.Add(aliasLabel);
                    continue;
                }

                int targetOffset = FindLabel(targetLabel);
                if (targetOffset < 0)
                    continue;

                BuildLabel(aliasLabel, targetOffset);
                hints.PinnedLabels.Add(aliasLabel);
            }
        }

        private HashSet<string> BuildPinnedDynamicNamespaces(out bool pinRootLabels)
        {
            pinRootLabels = false;
            var pinned = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var dynamicTargetVariables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            string rootPath = Path.GetFullPath(string.IsNullOrWhiteSpace(_rootScriptFile) ? _scriptFile : _rootScriptFile);

            foreach (SourceDependencyStamp dependency in _sourceDependencies)
            {
                if (!dependency.Path.EndsWith(".ts", StringComparison.OrdinalIgnoreCase))
                    continue;

                List<string> lines = LoadSourceLines(dependency.Path);
                string currentNamespace = dependency.Path.Equals(rootPath, StringComparison.OrdinalIgnoreCase)
                    ? string.Empty
                    : Path.GetFileNameWithoutExtension(dependency.Path).ToUpperInvariant();

                foreach (string rawLine in lines)
                {
                    string line = rawLine.TrimStart();
                    if (string.IsNullOrEmpty(line) || line[0] == '\'')
                        continue;

                    List<string> tokens = TokenizeSourceLine(line);
                    if (!TryGetDynamicControlTarget(tokens, currentNamespace, out string targetToken))
                        continue;

                    if (string.IsNullOrEmpty(currentNamespace))
                        pinRootLabels = true;
                    else
                        pinned.Add(currentNamespace);

                    foreach (Match match in DynamicNamespaceRegex.Matches(targetToken))
                    {
                        if (match.Groups.Count > 1 && !string.IsNullOrWhiteSpace(match.Groups[1].Value))
                            pinned.Add(match.Groups[1].Value.ToUpperInvariant());
                    }

                    if (TryNormalizeSourceVariableToken(targetToken, currentNamespace, out string normalizedVariable))
                        dynamicTargetVariables.Add(normalizedVariable);
                }
            }

            if (dynamicTargetVariables.Count == 0)
                return pinned;

            bool addedAliasSource;
            do
            {
                addedAliasSource = false;

                foreach (SourceDependencyStamp dependency in _sourceDependencies)
                {
                    if (!dependency.Path.EndsWith(".ts", StringComparison.OrdinalIgnoreCase))
                        continue;

                    List<string> lines = LoadSourceLines(dependency.Path);
                    string currentNamespace = dependency.Path.Equals(rootPath, StringComparison.OrdinalIgnoreCase)
                        ? string.Empty
                        : Path.GetFileNameWithoutExtension(dependency.Path).ToUpperInvariant();

                    foreach (string rawLine in lines)
                    {
                        string line = rawLine.TrimStart();
                        if (string.IsNullOrEmpty(line) || line[0] == '\'')
                            continue;

                        List<string> tokens = TokenizeSourceLine(line);
                        if (!TryGetVariableAliasAssignment(tokens, currentNamespace, out string destinationVariable, out string sourceVariable))
                            continue;

                        if (!dynamicTargetVariables.Contains(destinationVariable))
                            continue;

                        if (dynamicTargetVariables.Add(sourceVariable))
                            addedAliasSource = true;
                    }
                }
            }
            while (addedAliasSource);

            foreach (SourceDependencyStamp dependency in _sourceDependencies)
            {
                if (!dependency.Path.EndsWith(".ts", StringComparison.OrdinalIgnoreCase))
                    continue;

                List<string> lines = LoadSourceLines(dependency.Path);
                string currentNamespace = dependency.Path.Equals(rootPath, StringComparison.OrdinalIgnoreCase)
                    ? string.Empty
                    : Path.GetFileNameWithoutExtension(dependency.Path).ToUpperInvariant();

                foreach (string rawLine in lines)
                {
                    string line = rawLine.TrimStart();
                    if (string.IsNullOrEmpty(line) || line[0] == '\'')
                        continue;

                    List<string> tokens = TokenizeSourceLine(line);
                    if (!TryGetLiteralLabelAssignment(tokens, currentNamespace, out string normalizedVariable, out string qualifiedLabel))
                        continue;

                    if (!dynamicTargetVariables.Contains(normalizedVariable))
                        continue;

                    int tildeIndex = qualifiedLabel.IndexOf('~');
                    if (tildeIndex > 0)
                    {
                        pinned.Add(qualifiedLabel.Substring(0, tildeIndex));
                    }
                    else
                    {
                        pinRootLabels = true;
                    }
                }
            }

            return pinned;
        }

        private static bool TryGetDynamicControlTarget(List<string> tokens, string currentNamespace, out string targetToken, bool allowRootLocal = false)
        {
            targetToken = string.Empty;
            if (tokens.Count == 0 || tokens[0].StartsWith(":", StringComparison.Ordinal))
                return false;

            string cmd = tokens[0].ToUpperInvariant();
            switch (cmd)
            {
                case "GOTO":
                case "GOSUB":
                    if (tokens.Count >= 2)
                        targetToken = tokens[1];
                    break;

                case "BRANCH":
                    if (tokens.Count >= 3)
                        targetToken = tokens[2];
                    break;

                case "SETTEXTTRIGGER":
                case "SETTEXTLINETRIGGER":
                case "SETTEXTOUTTRIGGER":
                case "SETDELAYTRIGGER":
                case "SETEVENTTRIGGER":
                    if (tokens.Count >= 3)
                        targetToken = tokens[2];
                    break;

                case "ADDMENU":
                    if (tokens.Count >= 6)
                        targetToken = tokens[5];
                    break;
            }

            if (string.IsNullOrEmpty(targetToken) || targetToken == "\"\"")
                return false;

            return string.IsNullOrEmpty(NormalizeTrimLabelToken(targetToken, currentNamespace, allowRootLocal));
        }

        private static bool TryNormalizeSourceVariableToken(string token, string currentNamespace, out string normalizedVariable)
        {
            normalizedVariable = string.Empty;
            if (string.IsNullOrWhiteSpace(token))
                return false;

            string value = token.Trim();
            if (value.Length == 0)
                return false;

            char sigil = value[0];
            if (sigil != '$' && sigil != '%')
                return false;

            string baseName = ExtractBaseNamePreservingSuffix(value);
            if (string.IsNullOrWhiteSpace(baseName))
                return false;

            bool isProgramVar = baseName[0] == '%';
            if (!baseName.Contains('~'))
            {
                if (!string.IsNullOrEmpty(currentNamespace) &&
                    !(isProgramVar && baseName.StartsWith("%%", StringComparison.Ordinal)))
                {
                    baseName = baseName.Length > 1 && char.IsDigit(baseName[1])
                        ? baseName[0] + currentNamespace + "~" + baseName
                        : baseName[0] + currentNamespace + "~" + baseName.Substring(1);
                }
            }
            else if (baseName.StartsWith("~", StringComparison.Ordinal) && baseName.Length > 1)
            {
                baseName = baseName.Substring(1);
            }

            normalizedVariable = baseName.ToUpperInvariant();
            return true;
        }

        private static bool TryGetLiteralLabelAssignment(List<string> tokens, string currentNamespace, out string normalizedVariable, out string qualifiedLabel, bool allowRootLocal = false)
        {
            normalizedVariable = string.Empty;
            qualifiedLabel = string.Empty;

            if (tokens.Count < 3 || tokens[0].StartsWith(":", StringComparison.Ordinal))
                return false;

            if (!string.Equals(tokens[0], "SETVAR", StringComparison.OrdinalIgnoreCase))
                return false;

            if (!TryNormalizeSourceVariableToken(tokens[1], currentNamespace, out normalizedVariable))
                return false;

            qualifiedLabel = NormalizeTrimLabelToken(tokens[2], currentNamespace, allowRootLocal);
            return !string.IsNullOrEmpty(qualifiedLabel);
        }

        private static bool TryGetOpaqueVariableAssignment(List<string> tokens, string currentNamespace, out string normalizedVariable)
        {
            normalizedVariable = string.Empty;

            if (tokens.Count < 3 || tokens[0].StartsWith(":", StringComparison.Ordinal))
                return false;

            if (!string.Equals(tokens[0], "SETVAR", StringComparison.OrdinalIgnoreCase))
                return false;

            if (!TryNormalizeSourceVariableToken(tokens[1], currentNamespace, out normalizedVariable))
                return false;

            if (TryNormalizeSourceVariableToken(tokens[2], currentNamespace, out _))
                return false;

            return !TryNormalizeSourceLabelToken(tokens[2], currentNamespace, allowRootLocal: true, out _);
        }

        private static void AddToLookup(Dictionary<string, HashSet<string>> lookup, string key, string value)
        {
            if (!lookup.TryGetValue(key, out HashSet<string>? values))
            {
                values = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                lookup[key] = values;
            }

            values.Add(value);
        }

        private static void AddLabelAlias(DynamicReachabilityHints hints, string aliasLabel, string targetLabel)
        {
            if (string.IsNullOrWhiteSpace(aliasLabel) || string.IsNullOrWhiteSpace(targetLabel))
                return;

            if (string.Equals(aliasLabel, targetLabel, StringComparison.OrdinalIgnoreCase))
                return;

            if (!hints.LabelAliases.ContainsKey(aliasLabel))
                hints.LabelAliases[aliasLabel] = targetLabel;
        }

        private static void AddDynamicFallbackScope(DynamicReachabilityHints hints, string currentNamespace)
        {
            if (string.IsNullOrEmpty(currentNamespace))
                hints.PinRootLabels = true;
            else
                hints.PinnedNamespaces.Add(currentNamespace);
        }

        private static bool TryGetVariableAliasAssignment(List<string> tokens, string currentNamespace, out string destinationVariable, out string sourceVariable)
        {
            destinationVariable = string.Empty;
            sourceVariable = string.Empty;

            if (tokens.Count < 3 || tokens[0].StartsWith(":", StringComparison.Ordinal))
                return false;

            if (!string.Equals(tokens[0], "SETVAR", StringComparison.OrdinalIgnoreCase))
                return false;

            if (!TryNormalizeSourceVariableToken(tokens[1], currentNamespace, out destinationVariable))
                return false;

            return TryNormalizeSourceVariableToken(tokens[2], currentNamespace, out sourceVariable);
        }

        private bool TryQualifyCompiledLabelToken(byte scriptId, string token, out string qualifiedLabel)
        {
            qualifiedLabel = string.Empty;
            if (string.IsNullOrWhiteSpace(token))
                return false;

            string value = token.Trim();
            if (!value.StartsWith(":", StringComparison.Ordinal))
                return false;

            string labelName = value.Substring(1);
            if (string.IsNullOrWhiteSpace(labelName))
                return false;

            if (labelName.StartsWith("~", StringComparison.Ordinal))
            {
                if (labelName.Length == 1)
                    return false;

                qualifiedLabel = labelName.Substring(1).ToUpperInvariant();
                return true;
            }

            if (labelName.Contains('~'))
            {
                qualifiedLabel = labelName.ToUpperInvariant();
                return true;
            }

            string scriptNamespace = GetScriptNamespace(scriptId);
            qualifiedLabel = !string.IsNullOrEmpty(scriptNamespace)
                ? (scriptNamespace + "~" + labelName).ToUpperInvariant()
                : labelName.ToUpperInvariant();
            return true;
        }

        private bool TryFindArithmeticBaseParamId(string varName, out int baseParamId)
        {
            baseParamId = -1;

            if (!TryExtractArithmeticBaseName(varName, out string baseVarName))
                return false;

            for (int i = 0; i < _paramList.Count; i++)
            {
                if (_paramList[i] is VarParam varParam &&
                    string.Equals(varParam.Name, baseVarName, StringComparison.OrdinalIgnoreCase))
                {
                    baseParamId = i;
                    return true;
                }
            }

            return false;
        }

        private static bool TryExtractArithmeticBaseName(string varName, out string baseVarName)
        {
            baseVarName = string.Empty;
            if (string.IsNullOrEmpty(varName) || varName[0] != '$')
                return false;

            int opIndex = -1;
            for (int i = 2; i < varName.Length; i++)
            {
                char c = varName[i];
                if (c == '+' || c == '-' || c == '*' || c == '/')
                {
                    opIndex = i;
                    break;
                }

                if (!(char.IsLetterOrDigit(c) || c == '_'))
                    return false;
            }

            if (opIndex < 0 || opIndex + 1 >= varName.Length)
                return false;

            if (!double.TryParse(varName.Substring(opIndex + 1), NumberStyles.Float, CultureInfo.InvariantCulture, out _))
                return false;

            baseVarName = varName.Substring(0, opIndex);
            return true;
        }

        private static void EncodePreparedInstruction(List<byte> code, PreparedInstruction instruction, Dictionary<int, int> oldToNewParamIds)
        {
            code.Add(instruction.ScriptId);
            code.AddRange(BitConverter.GetBytes(instruction.LineNumber));
            code.AddRange(BitConverter.GetBytes(instruction.CommandId));

            if (instruction.IsLabel)
            {
                code.AddRange(BitConverter.GetBytes(0));
                return;
            }

            foreach (PreparedParam param in instruction.Params)
                EncodePreparedParam(code, param, oldToNewParamIds);

            code.Add(0);
        }

        private static void EncodePreparedParam(List<byte> code, PreparedParam param, Dictionary<int, int> oldToNewParamIds)
        {
            code.Add(param.ParamType);

            switch (param.ParamType)
            {
                case ScriptConstants.PARAM_CONST:
                case ScriptConstants.PARAM_VAR:
                case ScriptConstants.PARAM_PROGVAR:
                    if (!oldToNewParamIds.TryGetValue(param.ParamId, out int mappedParamId))
                        throw new Exception($"Parameter ID {param.ParamId} was pruned but is still referenced");

                    code.AddRange(BitConverter.GetBytes(mappedParamId));
                    if (param.ParamType != ScriptConstants.PARAM_CONST)
                        EncodePreparedIndexes(code, param.Indexes, oldToNewParamIds);
                    break;

                case ScriptConstants.PARAM_SYSCONST:
                    code.AddRange(BitConverter.GetBytes(param.SysConstId));
                    EncodePreparedIndexes(code, param.Indexes, oldToNewParamIds);
                    break;

                case ScriptConstants.PARAM_CHAR:
                    code.Add(param.CharCode);
                    break;

                default:
                    throw new Exception($"Unsupported parameter type {param.ParamType} during bytecode pruning");
            }
        }

        private static void EncodePreparedIndexes(List<byte> code, PreparedParam[] indexes, Dictionary<int, int> oldToNewParamIds)
        {
            if (indexes.Length > byte.MaxValue)
                throw new Exception("Too many array indexes to encode");

            code.Add((byte)indexes.Length);
            foreach (PreparedParam index in indexes)
                EncodePreparedParam(code, index, oldToNewParamIds);
        }

        #endregion

        #region File I/O Methods

        private void ResetLoadMetrics()
        {
            LastSourceCacheHit = false;
            LastPreparedCacheHit = false;
            LastSourceCacheValidationTicks = 0;
            LastCompileTicks = 0;
            LastLoadTicks = 0;
            LastPrepareTicks = 0;
            LastDependencyCount = 0;
        }

        private static double StopwatchTicksToMilliseconds(long ticks)
        {
            return ticks * 1000.0 / Stopwatch.Frequency;
        }

        private static string BuildSourceCacheKey(string fullPath, string descFile, bool trimIncludes, bool pruneBytecode, bool strictIncludes, bool pruneIncludeBranches)
        {
            string descPart = string.IsNullOrWhiteSpace(descFile)
                ? string.Empty
                : Path.GetFullPath(descFile);
            return fullPath + "|" + descPart +
                   "|trim=" + (trimIncludes ? "1" : "0") +
                   "|prune=" + (pruneBytecode ? "1" : "0") +
                   "|strictIncludes=" + (strictIncludes ? "1" : "0") +
                   "|pruneIncludeBranches=" + (pruneIncludeBranches ? "1" : "0");
        }

        private static SourceDependencyStamp CaptureDependencyStamp(string path)
        {
            string fullPath = Path.GetFullPath(path);
            var info = new FileInfo(fullPath);
            return new SourceDependencyStamp(fullPath, info.LastWriteTimeUtc.Ticks, info.Exists ? info.Length : -1);
        }

        private static CompiledScriptStamp CaptureCompiledStamp(string path)
        {
            string fullPath = Path.GetFullPath(path);
            var info = new FileInfo(fullPath);
            return new CompiledScriptStamp(fullPath, info.LastWriteTimeUtc.Ticks, info.Exists ? info.Length : -1);
        }

        private static bool IsCompiledScriptArtifact(string path)
        {
            string extension = Path.GetExtension(path);
            return extension.Equals(".cts", StringComparison.OrdinalIgnoreCase) ||
                   extension.Equals(".twx", StringComparison.OrdinalIgnoreCase);
        }

        private void AddSourceDependency(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return;

            string fullPath = Path.GetFullPath(path);
            if (!File.Exists(fullPath))
                return;

            if (_sourceDependencies.Any(d => d.Path.Equals(fullPath, StringComparison.OrdinalIgnoreCase)))
                return;

            _sourceDependencies.Add(CaptureDependencyStamp(fullPath));
        }

        private static bool IsCacheEntryValid(SourceScriptCacheEntry entry)
        {
            foreach (SourceDependencyStamp dependency in entry.Dependencies)
            {
                if (!File.Exists(dependency.Path))
                    return false;

                var info = new FileInfo(dependency.Path);
                if (info.LastWriteTimeUtc.Ticks != dependency.LastWriteUtcTicks || info.Length != dependency.Length)
                    return false;
            }

            return true;
        }

        private static bool IsCompiledCacheEntryValid(CompiledScriptCacheEntry entry)
        {
            if (!File.Exists(entry.Path))
                return false;

            var info = new FileInfo(entry.Path);
            return entry.Length <= GlobalModules.PreparedScriptCacheLimitBytes &&
                   info.LastWriteTimeUtc.Ticks == entry.LastWriteUtcTicks &&
                   info.Length == entry.Length;
        }

        private bool TryLoadFromCompiledCache(string filename)
        {
            string fullPath = Path.GetFullPath(filename);
            if (!IsCompiledScriptArtifact(fullPath))
                return false;

            long validationStart = Stopwatch.GetTimestamp();
            CompiledScriptCacheEntry? entry;

            lock (_compiledCacheLock)
            {
                if (!_compiledScriptCache.TryGetValue(fullPath, out entry))
                {
                    LastSourceCacheValidationTicks = Stopwatch.GetTimestamp() - validationStart;
                    return false;
                }

                if (!IsCompiledCacheEntryValid(entry))
                {
                    _compiledScriptCache.Remove(fullPath);
                    LastSourceCacheValidationTicks = Stopwatch.GetTimestamp() - validationStart;
                    return false;
                }
            }

            LastSourceCacheValidationTicks = Stopwatch.GetTimestamp() - validationStart;

            long loadStart = Stopwatch.GetTimestamp();
            LoadFromBytes(entry.CompiledBytes, fullPath);
            LastLoadTicks = Stopwatch.GetTimestamp() - loadStart;

            if (entry.PreparedTemplate != null)
            {
                _preparedProgram = PreparedScriptTemplateCloner.CloneForExecution(entry.PreparedTemplate, this);
                LastPreparedCacheHit = true;
            }

            if (GlobalModules.EnableVmMetrics)
            {
                GlobalModules.VmMetricLog($"[VM LOAD] phase=compiled-cache script='{fullPath}' validationMs={StopwatchTicksToMilliseconds(LastSourceCacheValidationTicks):F3} loadMs={StopwatchTicksToMilliseconds(LastLoadTicks):F3} preparedTemplateHit={(LastPreparedCacheHit ? 1 : 0)}\n");
            }

            return true;
        }

        private static void StoreCompiledCacheEntry(string filename, byte[] compiledBytes)
        {
            string fullPath = Path.GetFullPath(filename);
            if (!IsCompiledScriptArtifact(fullPath))
                return;

            CompiledScriptStamp stamp = CaptureCompiledStamp(fullPath);
            if (stamp.Length < 0 || stamp.Length > GlobalModules.PreparedScriptCacheLimitBytes)
                return;

            var entry = new CompiledScriptCacheEntry
            {
                Path = stamp.Path,
                LastWriteUtcTicks = stamp.LastWriteUtcTicks,
                Length = stamp.Length,
                CompiledBytes = compiledBytes,
                PreparedTemplate = null
            };

            lock (_compiledCacheLock)
            {
                _compiledScriptCache[fullPath] = entry;
            }
        }

        private bool TryLoadFromSourceCache(string cacheKey, string filename)
        {
            if (!GlobalModules.EnableSourceScriptCache)
                return false;

            long validationStart = Stopwatch.GetTimestamp();
            SourceScriptCacheEntry? entry;

            lock (_sourceCacheLock)
            {
                if (!_sourceScriptCache.TryGetValue(cacheKey, out entry))
                {
                    LastSourceCacheValidationTicks = Stopwatch.GetTimestamp() - validationStart;
                    return false;
                }

                if (!IsCacheEntryValid(entry))
                {
                    _sourceScriptCache.Remove(cacheKey);
                    LastSourceCacheValidationTicks = Stopwatch.GetTimestamp() - validationStart;
                    return false;
                }
            }

            LastSourceCacheValidationTicks = Stopwatch.GetTimestamp() - validationStart;

            long loadStart = Stopwatch.GetTimestamp();
            LoadFromBytes(entry.CompiledBytes, filename);
            LastLoadTicks = Stopwatch.GetTimestamp() - loadStart;
            LastSourceCacheHit = true;
            LastDependencyCount = entry.Dependencies.Count;
            _sourceCacheKey = cacheKey;
            _sourceDependencies.Clear();
            _sourceDependencies.AddRange(entry.Dependencies);

            if (entry.PreparedTemplate != null)
            {
                _preparedProgram = PreparedScriptTemplateCloner.CloneForExecution(entry.PreparedTemplate, this);
                LastPreparedCacheHit = true;
            }

            if (GlobalModules.EnableVmMetrics)
            {
                GlobalModules.VmMetricLog($"[VM LOAD] phase=source-cache script='{filename}' cacheHit=1 deps={LastDependencyCount} validationMs={StopwatchTicksToMilliseconds(LastSourceCacheValidationTicks):F3} loadMs={StopwatchTicksToMilliseconds(LastLoadTicks):F3} preparedTemplateHit={(LastPreparedCacheHit ? 1 : 0)}\n");
            }

            return true;
        }

        private void StoreSourceCacheEntry()
        {
            if (!GlobalModules.EnableSourceScriptCache || string.IsNullOrWhiteSpace(_sourceCacheKey))
                return;

            byte[] compiledBytes = WriteToBytes();
            var entry = new SourceScriptCacheEntry
            {
                CacheKey = _sourceCacheKey,
                CompiledBytes = compiledBytes,
                Dependencies = new List<SourceDependencyStamp>(_sourceDependencies),
                PreparedTemplate = null
            };

            lock (_sourceCacheLock)
            {
                _sourceScriptCache[_sourceCacheKey] = entry;
            }
        }

        private bool TryLoadPreparedTemplateFromSourceCache(out PreparedScriptProgram? preparedProgram)
        {
            preparedProgram = null;

            if (!GlobalModules.EnableSourceScriptCache || string.IsNullOrWhiteSpace(_sourceCacheKey))
                return false;

            lock (_sourceCacheLock)
            {
                if (!_sourceScriptCache.TryGetValue(_sourceCacheKey, out SourceScriptCacheEntry? entry))
                    return false;

                if (entry.PreparedTemplate == null || !IsCacheEntryValid(entry))
                    return false;

                preparedProgram = PreparedScriptTemplateCloner.CloneForExecution(entry.PreparedTemplate, this);
                return true;
            }
        }

        private void StorePreparedTemplateInSourceCache(PreparedScriptProgram preparedProgram)
        {
            if (!GlobalModules.EnableSourceScriptCache || string.IsNullOrWhiteSpace(_sourceCacheKey))
                return;

            lock (_sourceCacheLock)
            {
                if (_sourceScriptCache.TryGetValue(_sourceCacheKey, out SourceScriptCacheEntry? entry) && IsCacheEntryValid(entry))
                {
                    entry.PreparedTemplate ??= PreparedScriptTemplateCloner.CreateTemplate(preparedProgram);
                }
            }
        }

        private void StorePreparedTemplateInCompiledCache(PreparedScriptProgram preparedProgram)
        {
            if (string.IsNullOrWhiteSpace(_scriptFile))
                return;

            string fullPath = Path.GetFullPath(_scriptFile);
            if (!IsCompiledScriptArtifact(fullPath))
                return;

            lock (_compiledCacheLock)
            {
                if (_compiledScriptCache.TryGetValue(fullPath, out CompiledScriptCacheEntry? entry) &&
                    IsCompiledCacheEntryValid(entry))
                {
                    entry.PreparedTemplate ??= PreparedScriptTemplateCloner.CreateTemplate(preparedProgram);
                }
            }
        }

        public static void InvalidateCompiledScriptCache(string filename)
        {
            if (string.IsNullOrWhiteSpace(filename))
                return;

            string fullPath = Path.GetFullPath(filename);
            lock (_compiledCacheLock)
            {
                _compiledScriptCache.Remove(fullPath);
            }
        }

        public static ScriptCacheSnapshot CaptureCacheSnapshot()
        {
            var entries = new List<ScriptCacheEntrySnapshot>();

            lock (_sourceCacheLock)
            {
                List<string>? invalidKeys = null;
                foreach ((string cacheKey, SourceScriptCacheEntry entry) in _sourceScriptCache)
                {
                    if (!IsCacheEntryValid(entry))
                    {
                        invalidKeys ??= new List<string>();
                        invalidKeys.Add(cacheKey);
                        continue;
                    }

                    entries.Add(BuildSourceCacheSnapshot(entry));
                }

                if (invalidKeys != null)
                {
                    foreach (string invalidKey in invalidKeys)
                        _sourceScriptCache.Remove(invalidKey);
                }
            }

            lock (_compiledCacheLock)
            {
                List<string>? invalidKeys = null;
                foreach ((string scriptPath, CompiledScriptCacheEntry entry) in _compiledScriptCache)
                {
                    if (!IsCompiledCacheEntryValid(entry))
                    {
                        invalidKeys ??= new List<string>();
                        invalidKeys.Add(scriptPath);
                        continue;
                    }

                    entries.Add(BuildCompiledCacheSnapshot(entry));
                }

                if (invalidKeys != null)
                {
                    foreach (string invalidKey in invalidKeys)
                        _compiledScriptCache.Remove(invalidKey);
                }
            }

            entries.Sort(static (left, right) =>
            {
                int byName = StringComparer.OrdinalIgnoreCase.Compare(left.DisplayName, right.DisplayName);
                if (byName != 0)
                    return byName;

                int byKind = left.Kind.CompareTo(right.Kind);
                return byKind != 0
                    ? byKind
                    : StringComparer.OrdinalIgnoreCase.Compare(left.ScriptPath, right.ScriptPath);
            });

            return new ScriptCacheSnapshot(entries);
        }

        public static bool PrewarmCompiledScript(string filename, ScriptRef? scriptRef, string scriptDirectory, bool forceRefresh, out string? error)
        {
            error = null;
            if (string.IsNullOrWhiteSpace(filename))
            {
                error = "Script path is required.";
                return false;
            }

            string fullPath = Path.GetFullPath(filename);
            if (!File.Exists(fullPath))
            {
                error = $"Script file not found: {fullPath}";
                return false;
            }

            if (!IsCompiledScriptArtifact(fullPath))
            {
                error = $"Only compiled scripts can be prewarmed: {fullPath}";
                return false;
            }

            if (forceRefresh)
                InvalidateCompiledScriptCache(fullPath);

            try
            {
                using var cmp = new ScriptCmp(scriptRef, scriptDirectory);
                cmp.LoadFromFile(fullPath);
                cmp.PrepareForExecution();
                return true;
            }
            catch (Exception ex)
            {
                error = ex.Message;
                return false;
            }
        }

        private static ScriptCacheEntrySnapshot BuildSourceCacheSnapshot(SourceScriptCacheEntry entry)
        {
            string scriptPath = ExtractSourcePathFromCacheKey(entry.CacheKey);
            string displayName = BuildCacheDisplayName(scriptPath);
            long preparedBytes = EstimatePreparedTemplateBytes(entry.PreparedTemplate);
            long estimatedBytes =
                EstimateObjectInstanceBytes(ReferenceSizeBytes * 3) +
                EstimateStringBytes(entry.CacheKey) +
                EstimateByteArrayBytes(entry.CompiledBytes) +
                EstimateDependencyListBytes(entry.Dependencies) +
                preparedBytes;

            return new ScriptCacheEntrySnapshot(
                ScriptCacheKind.Source,
                scriptPath,
                displayName,
                estimatedBytes,
                entry.CompiledBytes.Length,
                preparedBytes,
                entry.PreparedTemplate?.Instructions.Length ?? 0,
                entry.Dependencies.Count);
        }

        private static ScriptCacheEntrySnapshot BuildCompiledCacheSnapshot(CompiledScriptCacheEntry entry)
        {
            string displayName = BuildCacheDisplayName(entry.Path);
            long preparedBytes = EstimatePreparedTemplateBytes(entry.PreparedTemplate);
            long estimatedBytes =
                EstimateObjectInstanceBytes(ReferenceSizeBytes * 3 + sizeof(long) * 2) +
                EstimateStringBytes(entry.Path) +
                EstimateByteArrayBytes(entry.CompiledBytes) +
                preparedBytes;

            return new ScriptCacheEntrySnapshot(
                ScriptCacheKind.Compiled,
                entry.Path,
                displayName,
                estimatedBytes,
                entry.CompiledBytes.Length,
                preparedBytes,
                entry.PreparedTemplate?.Instructions.Length ?? 0,
                0);
        }

        private static string ExtractSourcePathFromCacheKey(string cacheKey)
        {
            if (string.IsNullOrWhiteSpace(cacheKey))
                return string.Empty;

            int separator = cacheKey.IndexOf('|');
            return separator < 0
                ? cacheKey
                : cacheKey[..separator];
        }

        private static string BuildCacheDisplayName(string scriptPath)
        {
            if (string.IsNullOrWhiteSpace(scriptPath))
                return "(unknown)";

            string fileName = Path.GetFileNameWithoutExtension(scriptPath);
            fileName = fileName.TrimStart('_');
            return string.IsNullOrWhiteSpace(fileName)
                ? Path.GetFileName(scriptPath)
                : fileName;
        }

        private static long EstimateDependencyListBytes(List<SourceDependencyStamp> dependencies)
        {
            long bytes = EstimateObjectInstanceBytes(ReferenceSizeBytes + sizeof(int) * 2);
            bytes += EstimateValueTypeArrayBytes(ReferenceSizeBytes + sizeof(long) * 2, dependencies.Count);

            foreach (SourceDependencyStamp dependency in dependencies)
                bytes += EstimateStringBytes(dependency.Path);

            return bytes;
        }

        private static long EstimatePreparedTemplateBytes(PreparedScriptProgram? preparedProgram)
        {
            if (preparedProgram == null)
                return 0;

            var visited = new HashSet<object>(ObjectReferenceComparer.Instance);
            return EstimatePreparedProgramBytes(preparedProgram, visited);
        }

        private static long EstimatePreparedProgramBytes(PreparedScriptProgram preparedProgram, HashSet<object> visited)
        {
            if (!visited.Add(preparedProgram))
                return 0;

            long bytes = EstimateObjectInstanceBytes(ReferenceSizeBytes * 2 + sizeof(int));
            bytes += EstimateValueTypeArrayBytes(sizeof(int), preparedProgram.Instructions.Length);

            PreparedInstruction[] instructions = preparedProgram.Instructions;
            if (visited.Add(instructions))
                bytes += EstimateReferenceArrayBytes(instructions.Length);

            foreach (PreparedInstruction instruction in instructions)
                bytes += EstimatePreparedInstructionBytes(instruction, visited);

            return bytes;
        }

        private static long EstimatePreparedInstructionBytes(PreparedInstruction instruction, HashSet<object> visited)
        {
            if (!visited.Add(instruction))
                return 0;

            long bytes = EstimateObjectInstanceBytes(
                sizeof(int) * 3 +
                sizeof(byte) +
                sizeof(ushort) * 3 +
                sizeof(bool) * 3 +
                (ReferenceSizeBytes * 6));

            bytes += EstimateStringBytes(instruction.CommandName, visited);
            bytes += EstimatePreparedParamArrayBytes(instruction.Params, visited);
            bytes += EstimateValueTypeArrayBytes(sizeof(int), instruction.DynamicParamIndexes.Length, instruction.DynamicParamIndexes, visited);

            return bytes;
        }

        private static long EstimatePreparedParamArrayBytes(PreparedParam[] parameters, HashSet<object> visited)
        {
            long bytes = 0;
            if (visited.Add(parameters))
                bytes += EstimateReferenceArrayBytes(parameters.Length);

            foreach (PreparedParam parameter in parameters)
                bytes += EstimatePreparedParamBytes(parameter, visited);

            return bytes;
        }

        private static long EstimatePreparedParamBytes(PreparedParam parameter, HashSet<object> visited)
        {
            if (!visited.Add(parameter))
                return 0;

            long bytes = EstimateObjectInstanceBytes(
                sizeof(int) * 2 +
                sizeof(ushort) +
                sizeof(byte) +
                sizeof(bool) * 2 +
                sizeof(char) +
                sizeof(double) +
                (ReferenceSizeBytes * 7));

            bytes += EstimateStringBytes(parameter.LiteralValue, visited);
            bytes += EstimateStringBytes(parameter.ProgVarName, visited);
            bytes += EstimatePreparedParamArrayBytes(parameter.Indexes, visited);

            return bytes;
        }

        private static long EstimateStringBytes(string? value)
        {
            return EstimateStringBytes(value, null);
        }

        private static long EstimateStringBytes(string? value, HashSet<object>? visited)
        {
            if (string.IsNullOrEmpty(value))
                return 0;

            if (visited != null && !visited.Add(value))
                return 0;

            return AlignToPointerBoundary(ObjectHeaderBytes + sizeof(int) + sizeof(char) * value.Length + sizeof(char));
        }

        private static long EstimateByteArrayBytes(byte[]? bytes)
        {
            return bytes == null ? 0 : EstimateValueTypeArrayBytes(sizeof(byte), bytes.Length);
        }

        private static long EstimateReferenceArrayBytes(int length)
        {
            return EstimateArrayBytes(ReferenceSizeBytes, length);
        }

        private static long EstimateValueTypeArrayBytes(int elementSize, int length)
        {
            return EstimateArrayBytes(elementSize, length);
        }

        private static long EstimateValueTypeArrayBytes<T>(int elementSize, int length, T[] array, HashSet<object> visited)
        {
            if (!visited.Add(array))
                return 0;

            return EstimateArrayBytes(elementSize, length);
        }

        private static long EstimateArrayBytes(int elementSize, int length)
        {
            return AlignToPointerBoundary(ArrayHeaderBytes + (long)elementSize * Math.Max(0, length));
        }

        private static long EstimateObjectInstanceBytes(int fieldBytes)
        {
            return AlignToPointerBoundary(ObjectHeaderBytes + fieldBytes);
        }

        private static long AlignToPointerBoundary(long bytes)
        {
            long remainder = bytes & 7;
            return remainder == 0 ? bytes : bytes + (8 - remainder);
        }

        private static List<string> SplitSourceLines(string text)
        {
            var lines = new List<string>();
            using var reader = new StringReader(text);
            string? line;
            while ((line = reader.ReadLine()) != null)
                lines.Add(line);

            return lines;
        }

        private static string LoadSourceText(string filename)
        {
            byte[] bytes = File.ReadAllBytes(filename);

            if (LegacyScriptEncryption.IsEncryptedIncludePath(filename))
                return LegacyScriptEncryption.DecryptToString(bytes);

            if (!LegacyScriptEncryption.LooksLikePlainText(bytes)
                && LegacyScriptEncryption.TryDecryptToString(bytes, out string decrypted)
                && LegacyScriptEncryption.LooksLikeScriptText(decrypted))
            {
                return decrypted;
            }

            return Encoding.Latin1.GetString(bytes);
        }

        private static List<string> LoadSourceLines(string filename)
        {
            return SplitSourceLines(LoadSourceText(filename));
        }

        public void WriteToFile(string filename)
        {
            using (var fs = new FileStream(filename, FileMode.Create, FileAccess.Write))
            using (var writer = new BinaryWriter(fs))
            {
                WriteToWriter(writer);
            }
        }

        public byte[] WriteToBytes()
        {
            using var stream = new MemoryStream();
            using var writer = new BinaryWriter(stream, Encoding.Latin1, leaveOpen: true);
            WriteToWriter(writer);
            writer.Flush();
            return stream.ToArray();
        }

        private void WriteToWriter(BinaryWriter writer)
        {
            byte[] descBytes = Encoding.ASCII.GetBytes(string.Join("\r\n", _description));
            writer.Write((byte)10);
            writer.Write(Encoding.ASCII.GetBytes("TWX SCRIPT"));
            writer.Write((byte)0);
            writer.Write((ushort)ScriptConstants.CompiledScriptVersion);
            writer.Write((byte)0);
            writer.Write((byte)0);
            writer.Write(descBytes.Length);
            writer.Write(_codeSize);
            writer.Write(descBytes);
            writer.Write(_code);

            foreach (var param in _paramList)
            {
                if (param is VarParam varParam)
                {
                    writer.Write((byte)2);
                    string encrypted = ApplyEncryption(varParam.Value, 113);
                    writer.Write(encrypted.Length);
                    writer.Write(Encoding.Latin1.GetBytes(encrypted));

                    encrypted = ApplyEncryption(varParam.Name, 113);
                    writer.Write(encrypted.Length);
                    writer.Write(Encoding.Latin1.GetBytes(encrypted));
                }
                else
                {
                    writer.Write((byte)1);
                    string encrypted = ApplyEncryption(param.Value, 113);
                    writer.Write(encrypted.Length);
                    writer.Write(Encoding.Latin1.GetBytes(encrypted));
                }
            }

            writer.Write((byte)0);

            foreach (var include in _includeScriptList)
            {
                writer.Write(include.Length);
                writer.Write(Encoding.ASCII.GetBytes(include));
            }
            writer.Write(0);

            foreach (var label in _labelList)
            {
                writer.Write(label.Location);
                writer.Write(label.Name.Length);
                writer.Write(Encoding.ASCII.GetBytes(label.Name));
            }
        }

        /// <summary>
        /// Reads the 24-byte Pascal TScriptFileHeader from a BinaryReader.
        /// Layout (Win32 default alignment, BlockWrite'd verbatim by the Pascal compiler):
        ///   offset  0    : ShortString length byte (always 10 = 0x0A for "TWX SCRIPT")
        ///   offset  1-10 : ShortString characters  ("TWX SCRIPT")
        ///   offset 11    : 1 alignment pad byte
        ///   offset 12-13 : Version   (Word/uint16, little-endian)
        ///   offset 14-15 : 2 alignment pad bytes
        ///   offset 16-19 : DescSize  (Integer/int32, little-endian)
        ///   offset 20-23 : CodeSize  (Integer/int32, little-endian)
        /// Returns (progName, version, descSize, codeSize). Throws on bad magic or short file.
        /// </summary>
        public static (string progName, int version, int descSize, int codeSize, int headerSize) ReadScriptFileHeader(BinaryReader reader)
        {
            long startPosition = reader.BaseStream.Position;
            byte[] hdr = reader.ReadBytes(24);
            if (hdr.Length < 21)
                throw new Exception("File is too short to be a compiled TWX script");

            reader.BaseStream.Seek(startPosition, SeekOrigin.Begin);

            if (hdr[0] == 10 && Encoding.ASCII.GetString(hdr, 1, 10) == "TWX SCRIPT")
            {
                reader.BaseStream.Seek(startPosition + 24, SeekOrigin.Begin);
                return (
                    "TWX SCRIPT",
                    BitConverter.ToUInt16(hdr, 12),
                    BitConverter.ToInt32(hdr, 16),
                    BitConverter.ToInt32(hdr, 20),
                    24);
            }

            if (Encoding.ASCII.GetString(hdr, 0, 10) == "TWX SCRIPT" && hdr[10] == 0)
            {
                // Older compiled artifacts store a null-terminated header string
                // instead of the Pascal shortstring byte length.
                reader.BaseStream.Seek(startPosition + 21, SeekOrigin.Begin);
                return (
                    "TWX SCRIPT",
                    BitConverter.ToUInt16(hdr, 11),
                    BitConverter.ToInt32(hdr, 13),
                    BitConverter.ToInt32(hdr, 17),
                    21);
            }

            throw new Exception("File is not a compiled TWX script");
        }

        public void LoadFromFile(string filename)
        {
            ResetLoadMetrics();
            string fullPath = Path.GetFullPath(filename);
            if (TryLoadFromCompiledCache(fullPath))
                return;

            long loadStart = Stopwatch.GetTimestamp();
            byte[] compiledBytes = File.ReadAllBytes(fullPath);
            LoadFromBytes(compiledBytes, fullPath);
            StoreCompiledCacheEntry(fullPath, compiledBytes);

            LastLoadTicks = Stopwatch.GetTimestamp() - loadStart;
            if (GlobalModules.EnableVmMetrics)
            {
                GlobalModules.VmMetricLog($"[VM LOAD] phase=compiled-load script='{fullPath}' loadMs={StopwatchTicksToMilliseconds(LastLoadTicks):F3} codeBytes={_codeSize} params={_paramList.Count} labels={_labelList.Count}\n");
            }
        }

        public void LoadFromBytes(byte[] compiledBytes, string filename)
        {
            using var stream = new MemoryStream(compiledBytes, writable: false);
            using var reader = new BinaryReader(stream, Encoding.Latin1, leaveOpen: true);
            LoadFromReader(reader, filename, compiledBytes.Length);
        }

        private void LoadFromReader(BinaryReader reader, string filename, long length)
        {
            _preparedProgram = null;
            if (_codeSize > 0)
                throw new Exception("Code already exists - cannot load from file");

            GlobalModules.DebugLog($"[DEBUG] Loading file: {filename} ({length} bytes)\n");

            var (progName, version, descSize, codeSize, headerSize) = ReadScriptFileHeader(reader);

            GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] File: {filename}\n");
            GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] File size: {length} bytes\n");
            GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] Header string: '{progName}', Version: {version}, DescSize: {descSize}, CodeSize: {codeSize}, HeaderSize: {headerSize}\n");

            if (version < 2 || version > ScriptConstants.CompiledScriptVersion)
                throw new Exception($"Script file is an incorrect version ({version}); supported versions are 2-{ScriptConstants.CompiledScriptVersion}");

            _version = version;

            byte[] descBytes = descSize > 0 ? reader.ReadBytes(descSize) : Array.Empty<byte>();
            string description = descSize > 0 ? Encoding.ASCII.GetString(descBytes) : string.Empty;
            if (!string.IsNullOrEmpty(description))
                _description = new List<string>(description.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None));
            else
                _description = new List<string>();

            GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] Stream position before reading code: {reader.BaseStream.Position}\n");

            _code = reader.ReadBytes(codeSize);
            _codeSize = codeSize;

            GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] Read {codeSize} bytes of code, position now: {reader.BaseStream.Position}\n");

            byte paramType = reader.ReadByte();
            while (paramType > 0)
            {
                if (paramType == 1)
                {
                    int len = reader.ReadInt32();
                    string val = Encoding.Latin1.GetString(reader.ReadBytes(len));
                    var param = new CmdParam
                    {
                        Value = ApplyEncryption(val, 113)
                    };
                    _paramList.Add(param);
                }
                else
                {
                    int len = reader.ReadInt32();
                    string val = Encoding.Latin1.GetString(reader.ReadBytes(len));
                    var param = new VarParam
                    {
                        Value = ApplyEncryption(val, 113)
                    };

                    len = reader.ReadInt32();
                    val = Encoding.Latin1.GetString(reader.ReadBytes(len));
                    param.Name = ApplyEncryption(val, 113);

                    _paramList.Add(param);
                }

                paramType = reader.ReadByte();
            }

            GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] Read {_paramList.Count} parameters, position now: {reader.BaseStream.Position}\n");
            GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] File length: {length}, bytes remaining: {length - reader.BaseStream.Position}\n");

            if (reader.BaseStream.Position + 4 <= reader.BaseStream.Length)
            {
                GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] Attempting to read includeLen...\n");
                try
                {
                    int includeLen = reader.ReadInt32();
                    GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] Read includeLen: {includeLen}\n");
                    while (includeLen > 0)
                    {
                        string include = Encoding.ASCII.GetString(reader.ReadBytes(includeLen));
                        _includeScriptList.Add(include);
                        includeLen = reader.ReadInt32();
                    }
                }
                catch (EndOfStreamException ex)
                {
                    GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] Hit EOF while reading includes: {ex.Message}\n");
                }
            }
            else
            {
                GlobalModules.DebugLog($"[ScriptCmp.LoadFromFile] No include scripts section (EOF at {reader.BaseStream.Position})\n");
            }

            while (reader.BaseStream.Position < reader.BaseStream.Length)
            {
                int location = reader.ReadInt32();
                int len = reader.ReadInt32();
                string name = Encoding.ASCII.GetString(reader.ReadBytes(len));

                var label = new ScriptLabel
                {
                    Name = name,
                    Location = location
                };
                _labelList.Add(label);
                if (!_labelDict.ContainsKey(name))
                    _labelDict[name] = location;
            }

            _scriptFile = filename;
        }

        public void AddParam(CmdParam param)
        {
            _paramList.Add(param);
        }

        #endregion
    }

    #endregion
}
