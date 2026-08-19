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
using System.Globalization;
using System.Threading;

namespace TWXProxy.Core
{
    /// <summary>
    /// Exception thrown by script execution errors
    /// </summary>
    public class ScriptException : Exception
    {
        public ScriptException(string message) : base(message) { }
        public ScriptException(string message, Exception innerException) : base(message, innerException) { }
    }

    /// <summary>
    /// Command action result from script command execution
    /// </summary>
    public enum CmdAction
    {
        None,
        Stop,
        Pause,
        Auth
    }

    /// <summary>
    /// Script command handler delegate
    /// </summary>
    public delegate CmdAction ScriptCmdHandler(object script, CmdParam[] parameters);

    /// <summary>
    /// System constant handler delegate
    /// </summary>
    public delegate string ScriptConstHandler(string[] indexes);

    internal static class ScriptOwnerNormalizer
    {
        public static string Normalize(string? rawOwner)
        {
            if (string.IsNullOrWhiteSpace(rawOwner))
                return string.Empty;

            string owner = rawOwner.Trim();
            if (owner.StartsWith("(") && owner.EndsWith(")") && owner.Length > 1)
                owner = owner[1..^1].Trim();

            const string ownedByPrefix = "owned by ";
            if (owner.StartsWith(ownedByPrefix, StringComparison.OrdinalIgnoreCase))
                owner = owner[ownedByPrefix.Length..].Trim();

            return owner;
        }
    }

    internal static class ScriptTimeFormatter
    {
        private const string CanonicalTimeFormat = "h:mm:ss tt";

        public static string Format(DateTime value)
        {
            return value.ToString(CanonicalTimeFormat, CultureInfo.InvariantCulture).ToUpperInvariant();
        }
    }

    /// <summary>
    /// Base class for all command parameters processed within a script.
    /// These parameters are identified during script compilation and stored in a list within the
    /// script. While the compiled script is interpreted these parameters are passed to the
    /// script command handling functions.
    /// </summary>
    public class CmdParam : IDisposable
    {
        private string _strValue = "0";
        private double _decValue = 0;
        private byte _sigDigits = 0;
        private bool _isNumeric = true;
        private bool _numChanged = false;
        private bool _isTemporary = false;

        public CmdParam()
        {
            // Defaults already set in field initializers
        }

        public virtual void Dispose()
        {
            _strValue = string.Empty;
        }

        public void SetBool(bool value)
        {
            if (value)
            {
                _strValue = "1";
                _decValue = 1;
                _sigDigits = 0;
                _isNumeric = true;
                _numChanged = false;
            }
            else
            {
                _strValue = "0";
                _decValue = 0;
                _sigDigits = 0;
                _isNumeric = true;
                _numChanged = false;
            }
        }

        public virtual string Value
        {
            get
            {
                // If it is a number, then the string value needs to be determined
                if (_isNumeric && _numChanged)
                {
                    if (_sigDigits == 0)
                    {
                        double truncated = Math.Truncate(_decValue);
                        if (_decValue == truncated)
                        {
                            // Value is already an integer — format without decimal point
                            _strValue = ((long)truncated).ToString();
                        }
                        else
                        {
                            // SigDigits == 0 means Pascal DecimalPrecision == 0 (the default).
                            // Pascal uses Trunc() which truncates toward zero (not rounding).
                            // e.g. 3.9 → "3", -3.9 → "-3"  (matches Pascal IntToStr(Trunc(x)))
                            // _decValue retains full precision for subsequent arithmetic.
                            _strValue = ((long)Math.Truncate(_decValue)).ToString();
                        }
                        _numChanged = false;
                    }
                    else
                    {
                        _strValue = _decValue.ToString($"F{_sigDigits}", CultureInfo.InvariantCulture);
                        _numChanged = false;
                    }
                }
                return _strValue;
            }
            set
            {
                _strValue = value;
                _isNumeric = false;
            }
        }

        public double DecValue
        {
            get
            {
                if (!_isNumeric)
                {
                    // Pascal TWX: empty string is treated as 0 in numeric contexts
                    if (_strValue.Length == 0)
                    {
                        _decValue = 0;
                        _isNumeric = true;
                        _sigDigits = 0;
                        _numChanged = false;
                        return 0;
                    }

                    if (double.TryParse(
                            _strValue,
                            NumberStyles.Float | NumberStyles.AllowThousands,
                            CultureInfo.InvariantCulture,
                            out double result))
                    {
                        _decValue = result;

                        // Determine significant digits from string representation
                        int decPos = _strValue.IndexOf('.');
                        if (decPos == -1)
                            _sigDigits = 0;
                        else
                            _sigDigits = (byte)(_strValue.Length - decPos - 1);

                        _isNumeric = true;
                        _numChanged = false; // meaning _strValue & _decValue are sync'd
                    }
                    else
                    {
                        throw new ScriptException($"'{_strValue}' is not a number");
                    }
                }
                return _decValue;
            }
            set
            {
                _decValue = value;
                _isNumeric = true;
                _numChanged = true; // Signals a conversion when Value is queried
            }
        }

        public byte SigDigits
        {
            get => _sigDigits;
            set => _sigDigits = value;
        }

        public bool IsNumeric => _isNumeric;

        public bool IsTemporary
        {
            get => _isTemporary;
            set => _isTemporary = value;
        }
    }

    /// <summary>
    /// Represents a script command
    /// </summary>
    public class ScriptCmd
    {
        public string Name { get; set; } = string.Empty;
        public int MinParams { get; set; }
        public int MaxParams { get; set; }
        public ParamKind[] ParamKinds { get; set; } = Array.Empty<ParamKind>();
        public ParamKind DefParamKind { get; set; } = ParamKind.Value;
        public ScriptCmdHandler? OnCmd { get; set; }

        public ParamKind GetParamKind(int index)
        {
            if (index >= 0 && index < ParamKinds.Length)
                return ParamKinds[index];
            return DefParamKind;
        }

        public void SetParamKinds(ParamKind[] kinds)
        {
            ParamKinds = kinds;
        }
    }

    /// <summary>
    /// Represents a system constant
    /// </summary>
    public class ScriptSysConst
    {
        public string Name { get; set; } = string.Empty;
        public ScriptConstHandler? OnRead { get; set; }

        public string Read(string[] indexes)
        {
            if (OnRead != null)
                return OnRead(indexes);
            return string.Empty;
        }
    }

    /// <summary>
    /// ScriptRef: Reference container for script commands and system constants
    /// </summary>
    public partial class ScriptRef
    {
        private readonly List<ScriptCmd> _cmdList;
        private readonly List<ScriptSysConst> _sysConstList;

        private static readonly AsyncLocal<Script?> _executingScript = new();

        public ScriptRef()
        {
            _cmdList = new List<ScriptCmd>();
            _sysConstList = new List<ScriptSysConst>();

            // Build command and constant lists
            BuildCommandList();
            BuildSysConstList();
        }

        public ScriptCmd GetCmd(int index) => _cmdList[index];
        public ScriptSysConst GetSysConst(int index) => _sysConstList[index];
        public int CmdCount => _cmdList.Count;
        public int SysConstCount => _sysConstList.Count;

        public void AddCommand(string name, int minParams, int maxParams,
            ScriptCmdHandler onCmd, ParamKind[] paramKinds, ParamKind defParamKind)
        {
            var cmd = new ScriptCmd
            {
                Name = name.ToUpperInvariant(),
                MinParams = minParams,
                MaxParams = maxParams,
                OnCmd = onCmd,
                DefParamKind = defParamKind
            };
            cmd.SetParamKinds(paramKinds);
            _cmdList.Add(cmd);
        }

        public void AddSysConstant(string name, ScriptConstHandler onRead)
        {
            var sysConst = new ScriptSysConst
            {
                Name = name.ToUpperInvariant(),
                OnRead = onRead
            };
            _sysConstList.Add(sysConst);
        }

        public int FindCmd(string name)
        {
            string upperName = ResolveCommandAlias(name.ToUpperInvariant());
            for (int i = 0; i < _cmdList.Count; i++)
            {
                if (_cmdList[i].Name == upperName)
                    return i;
            }
            return -1;
        }

        private static string ResolveCommandAlias(string upperName)
        {
            return upperName switch
            {
                "SILENCECLIENTS" => "SETDEAFCLIENTS",
                "QUICKSTATS" => "QUIKSTATS",
                _ => upperName
            };
        }

        public string GetCommandName(int id)
        {
            if (id >= 0 && id < _cmdList.Count)
                return _cmdList[id].Name;
            return string.Empty;
        }

        public int FindSysConst(string name)
        {
            string upperName = name.ToUpperInvariant();
            for (int i = 0; i < _sysConstList.Count; i++)
            {
                if (_sysConstList[i].Name == upperName)
                    return i;
            }
            return -1;
        }

        public string GetSysConstName(int id)
        {
            if (id >= 0 && id < _sysConstList.Count)
                return _sysConstList[id].Name;
            return string.Empty;
        }

        private void BuildCommandList()
        {
            // CRITICAL: This order MUST match Pascal TWX 2.x for bytecode compatibility
            // Commands are indexed by ID in compiled .cts files, changing order breaks existing scripts

            AddCommand("ADD", 2, 2, CmdAdd, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 0
            AddCommand("ADDMENU", 7, 7, CmdAddMenu, Array.Empty<ParamKind>(), ParamKind.Value); // 1
            AddCommand("AND", 2, 2, CmdAnd, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 2
            AddCommand("BRANCH", 2, 2, CmdBranch, Array.Empty<ParamKind>(), ParamKind.Value); // 3
            AddCommand("CLIENTMESSAGE", 1, 1, CmdClientMessage, Array.Empty<ParamKind>(), ParamKind.Value); // 4
            AddCommand("CLOSEMENU", 0, 0, CmdCloseMenu, Array.Empty<ParamKind>(), ParamKind.Value); // 5
            AddCommand("CONNECT", 0, 0, CmdConnect, Array.Empty<ParamKind>(), ParamKind.Value); // 6
            AddCommand("CUTTEXT", 4, 4, CmdCutText, new[] { ParamKind.Value, ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 7
            AddCommand("DELETE", 1, 1, CmdDelete, Array.Empty<ParamKind>(), ParamKind.Value); // 8
            AddCommand("DISCONNECT", 0, 1, CmdDisconnect, Array.Empty<ParamKind>(), ParamKind.Value); // 9
            AddCommand("DIVIDE", 2, 2, CmdDivide, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 10
            AddCommand("ECHO", 1, -1, CmdEcho, Array.Empty<ParamKind>(), ParamKind.Value); // 11
            AddCommand("FILEEXISTS", 2, 2, CmdFileExists, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 12
            AddCommand("GETCHARCODE", 2, 2, CmdGetCharCode, new[] { ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 13
            AddCommand("GETCONSOLEINPUT", 1, 2, CmdGetConsoleInput, new[] { ParamKind.Variable }, ParamKind.Value); // 14
            AddCommand("GETCOURSE", 3, 3, CmdGetCourse, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 15
            AddCommand("GETDATE", 1, 1, CmdGetDate, new[] { ParamKind.Variable }, ParamKind.Value); // 16
            AddCommand("GETDISTANCE", 3, 3, CmdGetDistance, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 17
            AddCommand("GETINPUT", 2, 3, CmdGetInput, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 18
            AddCommand("GETLENGTH", 2, 2, CmdGetLength, new[] { ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 19
            AddCommand("GETMENUVALUE", 2, 2, CmdGetMenuValue, Array.Empty<ParamKind>(), ParamKind.Value); // 20
            AddCommand("GETOUTTEXT", 1, 1, CmdGetOutText, new[] { ParamKind.Variable }, ParamKind.Value); // 21
            AddCommand("GETRND", 3, 3, CmdGetRnd, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 22
            AddCommand("GETSECTOR", 2, 2, CmdGetSector, new[] { ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 23
            AddCommand("GETSECTORPARAMETER", 3, 3, CmdGetSectorParameter, new[] { ParamKind.Value, ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 24
            AddCommand("GETTEXT", 4, 4, CmdGetText, new[] { ParamKind.Value, ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 25
            AddCommand("GETTIME", 1, 2, CmdGetTime, new[] { ParamKind.Variable }, ParamKind.Value); // 26
            AddCommand("GOSUB", 1, 1, CmdGosub, Array.Empty<ParamKind>(), ParamKind.Value); // 27
            AddCommand("GOTO", 1, 1, CmdGoto, Array.Empty<ParamKind>(), ParamKind.Value); // 28
            AddCommand("GETWORD", 3, 4, CmdGetWord, new[] { ParamKind.Value, ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 29
            AddCommand("GETWORDPOS", 3, 3, CmdGetWordPos, new[] { ParamKind.Value, ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 30
            AddCommand("HALT", 0, 0, CmdHalt, Array.Empty<ParamKind>(), ParamKind.Value); // 31
            AddCommand("ISEQUAL", 3, 3, CmdIsEqual, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 32
            AddCommand("ISGREATER", 3, 3, CmdIsGreater, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 33
            AddCommand("ISGREATEREQUAL", 3, 3, CmdIsGreaterEqual, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 34
            AddCommand("ISLESSER", 3, 3, CmdIsLesser, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 35
            AddCommand("ISLESSEREQUAL", 3, 3, CmdIsLesserEqual, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 36
            AddCommand("ISNOTEQUAL", 3, 3, CmdIsNotEqual, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 37
            AddCommand("ISNUMBER", 2, 2, CmdIsNumber, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 38
            AddCommand("KILLWINDOW", 1, 1, CmdKillWindow, Array.Empty<ParamKind>(), ParamKind.Value); // 39
            AddCommand("KILLALLTRIGGERS", 0, 0, CmdKillAllTriggers, Array.Empty<ParamKind>(), ParamKind.Value); // 40
            AddCommand("KILLTRIGGER", 1, 1, CmdKillTrigger, Array.Empty<ParamKind>(), ParamKind.Value); // 41
            AddCommand("LOAD", 1, 1, CmdLoad, Array.Empty<ParamKind>(), ParamKind.Value); // 42
            AddCommand("LOADVAR", 1, 1, CmdLoadVar, new[] { ParamKind.Variable }, ParamKind.Value); // 43
            AddCommand("LOGGING", 1, 1, CmdLogging, Array.Empty<ParamKind>(), ParamKind.Value); // 44
            AddCommand("LOWERCASE", 1, 1, CmdLowerCase, new[] { ParamKind.Variable }, ParamKind.Value); // 45
            AddCommand("MERGETEXT", 2, 3, CmdMergeText, new[] { ParamKind.Value, ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 46
            AddCommand("MULTIPLY", 2, 2, CmdMultiply, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 47
            AddCommand("OPENMENU", 1, 2, CmdOpenMenu, Array.Empty<ParamKind>(), ParamKind.Value); // 48
            AddCommand("OR", 2, 2, CmdOr, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 49
            AddCommand("PAUSE", 0, 0, CmdPause, Array.Empty<ParamKind>(), ParamKind.Value); // 50
            AddCommand("PROCESSIN", 2, 2, CmdProcessIn, Array.Empty<ParamKind>(), ParamKind.Value); // 51
            AddCommand("PROCESSOUT", 1, 1, CmdProcessOut, Array.Empty<ParamKind>(), ParamKind.Value); // 52
            AddCommand("READ", 3, 3, CmdRead, new[] { ParamKind.Value, ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 53
            AddCommand("RENAME", 2, 2, CmdRename, Array.Empty<ParamKind>(), ParamKind.Value); // 54
            AddCommand("REPLACETEXT", 3, 3, CmdReplaceText, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 55
            AddCommand("REQRECORDING", 0, 0, CmdReqRecording, Array.Empty<ParamKind>(), ParamKind.Value); // 56
            AddCommand("RETURN", 0, 0, CmdReturn, Array.Empty<ParamKind>(), ParamKind.Value); // 57
            AddCommand("ROUND", 1, 2, CmdRound, new[] { ParamKind.Variable }, ParamKind.Value); // 58
            AddCommand("SAVEVAR", 1, 1, CmdSaveVar, new[] { ParamKind.Variable }, ParamKind.Value); // 59
            AddCommand("SEND", 1, -1, CmdSend, Array.Empty<ParamKind>(), ParamKind.Value); // 60
            AddCommand("SETARRAY", 2, -1, CmdSetArray, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 61
            AddCommand("SETDELAYTRIGGER", 3, 3, CmdSetDelayTrigger, Array.Empty<ParamKind>(), ParamKind.Value); // 62
            AddCommand("SETEVENTTRIGGER", 3, 4, CmdSetEventTrigger, Array.Empty<ParamKind>(), ParamKind.Value); // 63
            AddCommand("SETMENUHELP", 2, 2, CmdSetMenuHelp, Array.Empty<ParamKind>(), ParamKind.Value); // 64
            AddCommand("SETMENUVALUE", 2, 2, CmdSetMenuValue, Array.Empty<ParamKind>(), ParamKind.Value); // 65
            AddCommand("SETMENUOPTIONS", 4, 4, CmdSetMenuOptions, Array.Empty<ParamKind>(), ParamKind.Value); // 66
            AddCommand("SETPRECISION", 1, 1, CmdSetPrecision, Array.Empty<ParamKind>(), ParamKind.Value); // 67
            AddCommand("SETPROGVAR", 2, 2, CmdSetProgVar, Array.Empty<ParamKind>(), ParamKind.Value); // 68
            AddCommand("SETSECTORPARAMETER", 3, 3, CmdSetSectorParameter, new[] { ParamKind.Value, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 69
            AddCommand("SETTEXTLINETRIGGER", 2, 3, CmdSetTextLineTrigger, Array.Empty<ParamKind>(), ParamKind.Value); // 70
            AddCommand("SETTEXTOUTTRIGGER", 2, 3, CmdSetTextOutTrigger, Array.Empty<ParamKind>(), ParamKind.Value); // 71
            AddCommand("SETTEXTTRIGGER", 2, 3, CmdSetTextTrigger, Array.Empty<ParamKind>(), ParamKind.Value); // 72
            AddCommand("SETVAR", 2, -1, CmdSetVar, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 73
            AddCommand("SETWINDOWCONTENTS", 2, 2, CmdSetWindowContents, Array.Empty<ParamKind>(), ParamKind.Value); // 74
            AddCommand("SOUND", 1, 1, CmdSound, Array.Empty<ParamKind>(), ParamKind.Value); // 75
            AddCommand("STOP", 1, 1, CmdStop, Array.Empty<ParamKind>(), ParamKind.Value); // 76
            AddCommand("STRIPTEXT", 2, 2, CmdStripText, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 77
            AddCommand("SUBTRACT", 2, 2, CmdSubtract, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 78
            AddCommand("SYS_CHECK", 0, 0, CmdSys_Check, Array.Empty<ParamKind>(), ParamKind.Value); // 79
            AddCommand("SYS_FAIL", 0, 0, CmdSys_Fail, Array.Empty<ParamKind>(), ParamKind.Value); // 80
            AddCommand("SYS_KILL", 0, 0, CmdSys_Kill, Array.Empty<ParamKind>(), ParamKind.Value); // 81
            AddCommand("SYS_NOAUTH", 0, 0, CmdSys_NoAuth, Array.Empty<ParamKind>(), ParamKind.Value); // 82
            AddCommand("SYS_NOP", 0, 0, CmdSys_Nop, Array.Empty<ParamKind>(), ParamKind.Value); // 83
            AddCommand("SYS_SHOWMSG", 0, 0, CmdSys_ShowMsg, Array.Empty<ParamKind>(), ParamKind.Value); // 84
            AddCommand("SYSTEMSCRIPT", 0, 0, CmdSystemScript, Array.Empty<ParamKind>(), ParamKind.Value); // 85
            AddCommand("UPPERCASE", 1, 1, CmdUpperCase, new[] { ParamKind.Variable }, ParamKind.Value); // 86
            AddCommand("XOR", 2, 2, CmdXor, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 87
            AddCommand("WAITFOR", 1, 1, CmdWaitFor, Array.Empty<ParamKind>(), ParamKind.Value); // 88
            AddCommand("WINDOW", 4, 5, CmdWindow, Array.Empty<ParamKind>(), ParamKind.Value); // 89
            AddCommand("WRITE", 2, 2, CmdWrite, Array.Empty<ParamKind>(), ParamKind.Value); // 90
            AddCommand("GETTIMER", 1, 1, CmdGetTimer, new[] { ParamKind.Variable }, ParamKind.Value); // 91
            AddCommand("READTOARRAY", 2, 2, CmdReadToArray, new[] { ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 92
            AddCommand("CLEARALLAVOIDS", 0, 0, CmdClearAllAvoids, Array.Empty<ParamKind>(), ParamKind.Value); // 93
            AddCommand("CLEARAVOID", 1, 1, CmdClearAvoid, Array.Empty<ParamKind>(), ParamKind.Value); // 94
            AddCommand("GETALLCOURSES", 2, 2, CmdGetAllCourses, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 95
            AddCommand("GETFILELIST", 1, 2, CmdGetFileList, new[] { ParamKind.Variable }, ParamKind.Value); // 96
            AddCommand("GETNEARESTWARPS", 2, 2, CmdGetNearestWarps, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 97
            AddCommand("GETSCRIPTVERSION", 2, 2, CmdGetScriptVersion, new[] { ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 98
            AddCommand("LISTACTIVESCRIPTS", 1, 1, CmdListActiveScripts, new[] { ParamKind.Variable }, ParamKind.Value); // 99
            AddCommand("LISTAVOIDS", 1, 1, CmdListAvoids, new[] { ParamKind.Variable }, ParamKind.Value); // 100
            AddCommand("LISTSECTORPARAMETERS", 2, 2, CmdListSectorParameters, new[] { ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 101
            AddCommand("SETAVOID", 1, 1, CmdSetAvoid, Array.Empty<ParamKind>(), ParamKind.Value); // 102
            AddCommand("CUTLENGTHS", 3, 3, CmdCutLengths, new[] { ParamKind.Value, ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 103
            AddCommand("FORMAT", 3, 3, CmdFormat, new[] { ParamKind.Value, ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 104
            AddCommand("GETDIRLIST", 1, 3, CmdGetDirList, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 105
            AddCommand("GETWORDCOUNT", 2, 2, CmdGetWordCount, new[] { ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 106
            AddCommand("MAKEDIR", 1, 1, CmdMakeDir, Array.Empty<ParamKind>(), ParamKind.Value); // 107
            AddCommand("PADLEFT", 2, 3, CmdPadLeft, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 108
            AddCommand("PADRIGHT", 2, 3, CmdPadRight, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value); // 109
            AddCommand("REMOVEDIR", 1, 1, CmdRemoveDir, Array.Empty<ParamKind>(), ParamKind.Value); // 110
            AddCommand("SETMENUKEY", 1, 1, CmdSetMenuKey, Array.Empty<ParamKind>(), ParamKind.Value); // 111
            AddCommand("SPLITTEXT", 2, 3, CmdSplitText, new[] { ParamKind.Value, ParamKind.Variable }, ParamKind.Value); // 112
            AddCommand("TRIM", 1, 1, CmdTrim, new[] { ParamKind.Variable }, ParamKind.Value); // 113
            AddCommand("TRUNCATE", 1, 1, CmdTruncate, new[] { ParamKind.Variable }, ParamKind.Value); // 114
            // Commands added in 2.06 / TWX27+ (must remain in Pascal order)
            AddCommand("GETDEAFCLIENTS", 1, 1, CmdGetDeafClients, new[] { ParamKind.Variable }, ParamKind.Value); // 115
            AddCommand("SETDEAFCLIENTS", 0, 1, CmdSetDeafClients, Array.Empty<ParamKind>(), ParamKind.Value); // 116
            AddCommand("SAVEGLOBAL", 1, 1, CmdSaveGlobal, new[] { ParamKind.Variable }, ParamKind.Value); // 117
            AddCommand("LOADGLOBAL", 1, 1, CmdLoadGlobal, new[] { ParamKind.Variable }, ParamKind.Value); // 118
            AddCommand("CLEARGLOBALS", 0, 0, CmdClearGlobals, Array.Empty<ParamKind>(), ParamKind.Value); // 119
            AddCommand("SWITCHBOT", 0, 2, CmdSwitchBot, Array.Empty<ParamKind>(), ParamKind.Value); // 120
            AddCommand("STRIPANSI", 2, 2, CmdStripANSI, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 121
            AddCommand("ADDQUICKTEXT", 2, 2, CmdAddQuickText, Array.Empty<ParamKind>(), ParamKind.Value); // 122
            AddCommand("CLEARQUICKTEXT", 0, 1, CmdClearQuickText, Array.Empty<ParamKind>(), ParamKind.Value); // 123
            AddCommand("GETBOTLIST", 1, 1, CmdGetBotList, new[] { ParamKind.Variable }, ParamKind.Value); // 124
            AddCommand("SETAUTOTRIGGER", 3, 4, CmdSetAutoTrigger, Array.Empty<ParamKind>(), ParamKind.Value); // 125
            AddCommand("SETAUTOTEXTTRIGGER", 3, 4, CmdSetAutoTrigger, Array.Empty<ParamKind>(), ParamKind.Value); // 126
            AddCommand("REQVERSION", 1, 1, CmdReqVersion, Array.Empty<ParamKind>(), ParamKind.Value); // 127
            AddCommand("SORT", 2, 2, CmdSort, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 128
            AddCommand("FIND", 3, 4, CmdFind, new[] { ParamKind.Value, ParamKind.Value, ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 129
            AddCommand("FINDALL", 3, 3, CmdFindAll, new[] { ParamKind.Value, ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 130
            AddCommand("MODULUS", 2, 2, CmdModulus, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 131
            AddCommand("DIREXISTS", 2, 2, CmdDirExists, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 132
            AddCommand("LABELEXISTS", 2, 2, CmdLabelExists, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 133
            AddCommand("OPENINSTANCE", 0, -1, CmdOpenInstance, Array.Empty<ParamKind>(), ParamKind.Value); // 134
            AddCommand("CLOSEINSTANCE", 1, 1, CmdCloseInstance, Array.Empty<ParamKind>(), ParamKind.Value); // 135
            AddCommand("COPYDATABASE", 2, 2, CmdCopyDatabase, Array.Empty<ParamKind>(), ParamKind.Value); // 136
            AddCommand("CREATEDATABASE", 2, -1, CmdCreateDatabase, Array.Empty<ParamKind>(), ParamKind.Value); // 137
            AddCommand("DELETEDATABASE", 1, 2, CmdDeleteDatabase, Array.Empty<ParamKind>(), ParamKind.Value); // 138
            AddCommand("EDITDATABASE", 1, -1, CmdEditDatabase, Array.Empty<ParamKind>(), ParamKind.Value); // 139
            AddCommand("LISTDATABASES", 1, 1, CmdListDatabases, new[] { ParamKind.Variable }, ParamKind.Value); // 140
            AddCommand("OPENDATABASE", 1, 1, CmdOpenDatabase, Array.Empty<ParamKind>(), ParamKind.Value); // 141
            AddCommand("CLOSEDATABASE", 0, 0, CmdCloseDatabase, Array.Empty<ParamKind>(), ParamKind.Value); // 142
            AddCommand("RESETDATABASE", 1, 2, CmdResetDatabase, Array.Empty<ParamKind>(), ParamKind.Value); // 143
            AddCommand("STARTTIMER", 1, 1, CmdStartTimer, Array.Empty<ParamKind>(), ParamKind.Value); // 144
            AddCommand("STOPTIMER", 1, 1, CmdStopTimer, Array.Empty<ParamKind>(), ParamKind.Value); // 145
            AddCommand("STOPALL", 0, 1, CmdStopAll, Array.Empty<ParamKind>(), ParamKind.Value); // 146
            AddCommand("CONCAT", 2, -1, CmdConcat, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value); // 147
            AddCommand("SAVEHELP", 2, 5, CmdSaveHelp, Array.Empty<ParamKind>(), ParamKind.Value); // 148
            AddCommand("LISTGLOBALS", 2, 2, CmdListGlobals, new[] { ParamKind.Variable, ParamKind.Variable }, ParamKind.Value); // 149
            AddCommand("ECHOEX", 1, -1, CmdEchoEx, Array.Empty<ParamKind>(), ParamKind.Value); // 150
            AddCommand("LIBCMD", 1, -1, CmdLibCmd, Array.Empty<ParamKind>(), ParamKind.Value); // 151

            // TWX 2.7 commands
            AddCommand("GETDATETIME", 1, 1, CmdGetDateTime, new[] { ParamKind.Variable }, ParamKind.Value);
            AddCommand("DATETIMEDIFF", 3, 4, CmdDateTimeDiff, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value);
            AddCommand("DATETIMETOSTR", 2, 3, CmdDateTimeToStr, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value);
            AddCommand("CENTER", 2, 3, CmdCenter, new[] { ParamKind.Variable, ParamKind.Value }, ParamKind.Value);
            AddCommand("REPEAT", 2, 3, CmdRepeat, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value);

            // C#-only extensions live after the Pascal/TWX27 IDs so they do not disturb .cts compatibility.
            AddCommand("WAITON", 1, 1, CmdWaitOn, Array.Empty<ParamKind>(), ParamKind.Value);
            AddCommand("DIAGLOG", 1, -1, CmdDiagLog, Array.Empty<ParamKind>(), ParamKind.Value);
            AddCommand("DIAGMODE", 1, 1, CmdDiagMode, Array.Empty<ParamKind>(), ParamKind.Value);
            AddCommand("AUTOHAGGLE", 1, 1, CmdAutoHaggle, Array.Empty<ParamKind>(), ParamKind.Value);
            AddCommand("NATIVEBOT", 1, 1, CmdNativeBot, Array.Empty<ParamKind>(), ParamKind.Value);
            AddCommand("QUIKSTATS", 0, 0, CmdQuikStats, Array.Empty<ParamKind>(), ParamKind.Value);
            AddCommand("GETCOURSES", 3, 3, CmdGetCourses, new[] { ParamKind.Variable, ParamKind.Value, ParamKind.Value }, ParamKind.Value);
        }

        private void BuildSysConstList()
        {
            // CRITICAL: This order MUST match Pascal TWX 2.x for bytecode compatibility
            // SysConsts are indexed by ID in compiled .cts files, changing order breaks existing scripts

            // 0-15: ANSI color codes
            for (int i = 0; i <= 15; i++)
            {
                int colorIndex = i; // Capture for closure
                AddSysConstant($"ANSI_{i}", (indexes) => AnsiCodes.GetAnsiCode(colorIndex));
            }

            // 16-25: Connection and basic state 
            AddSysConstant("CONNECTED", (indexes) => GetConnected()); // 16
            AddSysConstant("CURRENTANSILINE", (indexes) => GetCurrentAnsiLine()); // 17
            AddSysConstant("CURRENTLINE", (indexes) => GetCurrentLine()); // 18
            AddSysConstant("DATE", (indexes) => DateTime.Now.ToString("MM/dd/yyyy")); // 19
            AddSysConstant("FALSE", (indexes) => "0"); // 20
            AddSysConstant("GAME", (indexes) => GetGame()); // 21
            AddSysConstant("GAMENAME", (indexes) => GetGameName()); // 22
            AddSysConstant("LICENSENAME", (indexes) => string.Empty); // 23
            AddSysConstant("LOGINNAME", (indexes) => GetLoginName()); // 24
            AddSysConstant("PASSWORD", (indexes) => GetPassword()); // 25

            // 26-37: Port information (indexed by sector number: PORT.CLASS[$CurSector])
            AddSysConstant("PORT.CLASS", (indexes) =>
            {
                // Pascal: returns '-1' if SPort.Name is empty (no port), else ClassIndex
                var s = GetSectorByIndex(indexes);
                if (s?.SectorPort == null || string.IsNullOrEmpty(s.SectorPort.Name)) return "-1";
                return s.SectorPort.ClassIndex.ToString();
            }); // 26
            AddSysConstant("PORT.BUYFUEL", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return (s?.SectorPort != null && s.SectorPort.BuyProduct.GetValueOrDefault(ProductType.FuelOre)) ? "1" : "0";
            }); // 27
            AddSysConstant("PORT.BUYORG", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return (s?.SectorPort != null && s.SectorPort.BuyProduct.GetValueOrDefault(ProductType.Organics)) ? "1" : "0";
            }); // 28
            AddSysConstant("PORT.BUYEQUIP", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return (s?.SectorPort != null && s.SectorPort.BuyProduct.GetValueOrDefault(ProductType.Equipment)) ? "1" : "0";
            }); // 29
            AddSysConstant("PORT.EXISTS", (indexes) =>
            {
                // Pascal: checks SPort.Name = '' (empty name means no port)
                var s = GetSectorByIndex(indexes);
                return (s?.SectorPort != null && !string.IsNullOrEmpty(s.SectorPort.Name)) ? "1" : "0";
            }); // 30
            AddSysConstant("PORT.FUEL", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return s?.SectorPort?.ProductAmount.GetValueOrDefault(ProductType.FuelOre).ToString() ?? "0";
            }); // 31
            AddSysConstant("PORT.NAME", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return s?.SectorPort?.Name ?? string.Empty;
            }); // 32
            AddSysConstant("PORT.ORG", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return s?.SectorPort?.ProductAmount.GetValueOrDefault(ProductType.Organics).ToString() ?? "0";
            }); // 33
            AddSysConstant("PORT.EQUIP", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return s?.SectorPort?.ProductAmount.GetValueOrDefault(ProductType.Equipment).ToString() ?? "0";
            }); // 34
            AddSysConstant("PORT.PERCENTFUEL", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return s?.SectorPort?.ProductPercent.GetValueOrDefault(ProductType.FuelOre).ToString() ?? "0";
            }); // 35
            AddSysConstant("PORT.PERCENTORG", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return s?.SectorPort?.ProductPercent.GetValueOrDefault(ProductType.Organics).ToString() ?? "0";
            }); // 36
            AddSysConstant("PORT.PERCENTEQUIP", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                return s?.SectorPort?.ProductPercent.GetValueOrDefault(ProductType.Equipment).ToString() ?? "0";
            }); // 37

            // 38-60: Sector information (indexed by sector number: SECTOR.DENSITY[$CurSector])
            // These use two indexes: first is sector number, second (for SECTOR.WARPS) is warp index.
            AddSysConstant("SECTOR.ANOMOLY", (indexes) =>
            { // 38 (legacy typo)
                // Pascal: IntToStr(Byte(Anomaly)) — returns '0' or '1'
                var s = GetSectorByIndex(indexes);
                return s?.Anomaly == true ? "1" : "0";
            });
            AddSysConstant("SECTOR.BACKDOORCOUNT", (indexes) =>
            { // 39
                if (indexes.Length == 0 || !int.TryParse(indexes[0], out int sn39)) return "0";
                var s = GetSectorByIndex(indexes);
                if (s == null) return "0";
                return GetActiveDatabase()?.GetBackDoors(s, sn39).Count.ToString() ?? "0";
            });
            AddSysConstant("SECTOR.BACKDOORS", (indexes) =>
            { // 40
                if (indexes.Length == 0 || !int.TryParse(indexes[0], out int sn40)) return string.Empty;
                var s = GetSectorByIndex(indexes);
                if (s == null) return string.Empty;
                var bd = GetActiveDatabase()?.GetBackDoors(s, sn40) ?? new System.Collections.Generic.List<int>();
                // If a second index is supplied (e.g. SECTOR.BACKDOORS[$sec][$n]), return the nth element (1-based).
                // When the index is out of range (no backdoor at that slot), return "" (= 0 numerically) like Pascal does.
                if (indexes.Length >= 2)
                {
                    if (int.TryParse(indexes[1], out int bdIdx) && bdIdx >= 1 && bdIdx <= bd.Count)
                        return bd[bdIdx - 1].ToString();
                    return string.Empty; // out-of-range or no backdoor at that slot
                }
                return string.Join(" ", bd);
            });
            AddSysConstant("SECTOR.DENSITY", (indexes) =>
            { // 41
                var s = GetSectorByIndex(indexes);
                return s?.Density.ToString() ?? "0";
            });
            AddSysConstant("SECTOR.EXPLORED", (indexes) =>
            { // 42
                // Pascal: etNo→'NO', etCalc→'CALC', etDensity→'DENSITY', etHolo→'YES'
                var s = GetSectorByIndex(indexes);
                return s?.Explored switch
                {
                    ExploreType.Calc => "CALC",
                    ExploreType.Density => "DENSITY",
                    ExploreType.Yes => "YES",
                    _ => "NO",
                };
            });
            AddSysConstant("SECTOR.FIGS.OWNER", (indexes) =>
            { // 43
                var s = GetSectorByIndex(indexes);
                return s?.Fighters.Owner ?? string.Empty;
            });
            AddSysConstant("SECTOR.FIGS.QUANTITY", (indexes) =>
            { // 44
                var s = GetSectorByIndex(indexes);
                return s?.Fighters.Quantity.ToString() ?? "0";
            });
            AddSysConstant("SECTOR.LIMPETS.OWNER", (indexes) =>
            { // 45
                var s = GetSectorByIndex(indexes);
                return ScriptOwnerNormalizer.Normalize(s?.MinesLimpet.Owner);
            });
            AddSysConstant("SECTOR.LIMPETS.QUANTITY", (indexes) =>
            { // 46
                var s = GetSectorByIndex(indexes);
                return s?.MinesLimpet.Quantity.ToString() ?? "0";
            });
            AddSysConstant("SECTOR.MINES.OWNER", (indexes) =>
            { // 47
                // Armid mines (Type 1) owner
                var s = GetSectorByIndex(indexes);
                return ScriptOwnerNormalizer.Normalize(s?.MinesArmid.Owner);
            });
            AddSysConstant("SECTOR.MINES.QUANTITY", (indexes) =>
            { // 48
                // Pascal: Mines_Armid.Quantity only (limpets are separate via SECTOR.LIMPETS.QUANTITY)
                var s = GetSectorByIndex(indexes);
                return s?.MinesArmid.Quantity.ToString() ?? "0";
            });
            AddSysConstant("SECTOR.NAVHAZ", (indexes) =>
            { // 49
                var s = GetSectorByIndex(indexes);
                return s?.NavHaz.ToString() ?? "0";
            });
            AddSysConstant("SECTOR.PLANETCOUNT", (indexes) =>
            { // 50
                var planets = GetPlanetNamesByIndex(indexes);
                return planets.Count.ToString();
            });
            AddSysConstant("SECTOR.PLANETS", (indexes) =>
            { // 51
                // Pascal: SECTOR.PLANETS[sector][planetIndex] — returns Nth planet name or '0'
                var planets = GetPlanetNamesByIndex(indexes);
                if (indexes.Length >= 2 && int.TryParse(indexes[1], out int pi))
                    return (pi >= 1 && pi <= planets.Count) ? planets[pi - 1] : "0";
                // Fallback (no second index): return joined list for convenience
                return planets.Count > 0 ? string.Join(", ", planets) : "0";
            });
            AddSysConstant("SECTOR.SHIPCOUNT", (indexes) =>
            { // 52
                var s = GetSectorByIndex(indexes);
                return s?.Ships.Count.ToString() ?? "0";
            });
            AddSysConstant("SECTOR.SHIPS", (indexes) =>
            { // 53
                // Pascal: SECTOR.SHIPS[sector][shipIndex] — returns Nth ship name or '0'
                var s = GetSectorByIndex(indexes);
                if (s == null) return "0";
                if (indexes.Length >= 2 && int.TryParse(indexes[1], out int si))
                    return (si >= 1 && si <= s.Ships.Count) ? s.Ships[si - 1].Name : "0";
                return s.Ships.Count > 0 ? string.Join(", ", s.Ships.Select(sh => sh.Name)) : "0";
            });
            AddSysConstant("SECTOR.TRADERCOUNT", (indexes) =>
            { // 54
                var s = GetSectorByIndex(indexes);
                return s?.Traders.Count.ToString() ?? "0";
            });
            AddSysConstant("SECTOR.TRADERS", (indexes) =>
            { // 55
                // Pascal: SECTOR.TRADERS[sector][traderIndex] — returns Nth trader name or '0'
                var s = GetSectorByIndex(indexes);
                if (s == null) return "0";
                if (indexes.Length >= 2 && int.TryParse(indexes[1], out int ti))
                    return (ti >= 1 && ti <= s.Traders.Count) ? s.Traders[ti - 1].Name : "0";
                return s.Traders.Count > 0 ? string.Join(", ", s.Traders.Select(t => t.Name)) : "0";
            });
            AddSysConstant("SECTOR.UPDATED", (indexes) =>
            { // 56
                var s = GetSectorByIndex(indexes);
                return s?.Update.ToString() ?? string.Empty;
            });
            AddSysConstant("SECTOR.WARPCOUNT", (indexes) =>
            { // 57
                // Prefer the stored total warp count. For fully seen sectors, we can safely
                // fall back to the known Warp[] list, but for CALC/DENSITY sectors we should
                // not let a partial warp list masquerade as a complete count.
                var s = GetSectorByIndex(indexes);
                if (s == null) { GlobalModules.ScriptTraceDebugLog($"[WARPCOUNT] sect={indexes.FirstOrDefault("?")} → null sector\n"); return "0"; }
                var knownWarps = s.Warp.Where(w => w != 0).ToList();
                int warpCountResult = s.WarpCount > 0
                    ? Math.Max(s.WarpCount, knownWarps.Count)
                    : (s.Explored == ExploreType.Yes ? knownWarps.Count : 0);
                GlobalModules.ScriptTraceDebugLog($"[WARPCOUNT] sect={indexes.FirstOrDefault()} knownWarps={knownWarps.Count} WarpCount={s.WarpCount} → {warpCountResult} warps=[{string.Join(",", s.Warp)}]\n");
                return warpCountResult.ToString();
            });
            AddSysConstant("SECTOR.WARPS", (indexes) =>
            { // 58
                // SECTOR.WARPS[sectorNum][warpIndex] — warpIndex is 1-based
                // indexes[0] = sectorNum, indexes[1] = warpIndex
                if (indexes.Length < 2) return "0";
                var s = GetSectorByIndex(indexes);
                if (s == null) return "0";
                if (!int.TryParse(indexes[1], out int warpIdx) || warpIdx < 1 || warpIdx > 6) return "0";
                var warpList = s.Warp.Where(w => w != 0).ToList();
                string warpResult = (warpIdx <= warpList.Count) ? warpList[warpIdx - 1].ToString() : "0";
                GlobalModules.ScriptTraceDebugLog($"[SECTOR.WARPS] sect={indexes[0]} idx={warpIdx} warpList=[{string.Join(",", warpList)}] → {warpResult}\n");
                return warpResult;
            });
            AddSysConstant("SECTOR.WARPSIN", (indexes) =>
            { // 59
                // SECTOR.WARPSIN[$sector] = space-separated list; SECTOR.WARPSIN[$sector][$i] = ith entry (1-based)
                var s = GetSectorByIndex(indexes);
                if (s == null) return "0";
                if (indexes.Length >= 2)
                {
                    if (!int.TryParse(indexes[1], out int wsi) || wsi < 1) return "0";
                    return (wsi <= s.WarpsIn.Count) ? s.WarpsIn[wsi - 1].ToString() : "0";
                }
                return (s.WarpsIn.Count > 0) ? string.Join(" ", s.WarpsIn) : "0";
            });
            AddSysConstant("SECTOR.WARPINCOUNT", (indexes) =>
            { // 60
                var s = GetSectorByIndex(indexes);
                return s?.WarpsIn.Count.ToString() ?? "0";
            });

            // 61-64: Universe info
            AddSysConstant("SECTORS", (indexes) => GetSectors()); // 61
            AddSysConstant("STARDOCK", (indexes) => GetStarDock()); // 62
            AddSysConstant("TIME", (indexes) => ScriptTimeFormatter.Format(DateTime.Now)); // 63
            AddSysConstant("TRUE", (indexes) => "1"); // 64

            // 65-67: Added in 2.04
            AddSysConstant("ALPHACENTAURI", (indexes) => GetAlphaCentauri()); // 65
            AddSysConstant("CURRENTSECTOR", (indexes) => GetCurrentSector().ToString()); // 66
            AddSysConstant("RYLOS", (indexes) => GetRylos()); // 67

            // 68-74: Added in 2.04a
            AddSysConstant("PORT.BUILDTIME", (indexes) => GetPortBuildTime(indexes)); // 68
            AddSysConstant("PORT.UPDATED", (indexes) => GetPortUpdated(indexes)); // 69
            AddSysConstant("RAWPACKET", (indexes) => GetRawPacket()); // 70
            AddSysConstant("SECTOR.BEACON", (indexes) =>
            { // 71
                var s = GetSectorByIndex(indexes);
                return s?.Beacon ?? string.Empty;
            });
            AddSysConstant("SECTOR.CONSTELLATION", (indexes) =>
            { // 72
                var s = GetSectorByIndex(indexes);
                return s?.Constellation ?? string.Empty;
            });
            AddSysConstant("SECTOR.FIGS.TYPE", (indexes) =>
            { // 73
                // Pascal: only returns a value when quantity > 0; returns '' (empty) when 0
                var s = GetSectorByIndex(indexes);
                if (s == null || s.Fighters.Quantity == 0) return string.Empty;
                return s.Fighters.FigType switch
                {
                    FighterType.Toll => "Toll",
                    FighterType.Offensive => "Offensive",
                    FighterType.Defensive => "Defensive",
                    _ => "None",
                };
            });
            AddSysConstant("SECTOR.ANOMALY", (indexes) =>
            { // 74 (correct spelling)
                // Pascal: IntToStr(Byte(Anomaly)) — returns '0' or '1'
                var s = GetSectorByIndex(indexes);
                return s?.Anomaly == true ? "1" : "0";
            });

            AddSysConstant("TURNS", (indexes) => GetCurrentTurns());
            AddSysConstant("UNLIMITEDGAME", (indexes) => GetCurrentUnlimitedGame());
            AddSysConstant("CREDITS", (indexes) => GetCurrentCredits());
            AddSysConstant("FIGHTERS", (indexes) => GetCurrentFighters());
            AddSysConstant("SHIELDS", (indexes) => GetCurrentShields());
            AddSysConstant("TOTALHOLDS", (indexes) => GetCurrentTotalHolds());
            AddSysConstant("OREHOLDS", (indexes) => GetCurrentOreHolds());
            AddSysConstant("ORGHOLDS", (indexes) => GetCurrentOrgHolds());
            AddSysConstant("EQUHOLDS", (indexes) => GetCurrentEquHolds());
            AddSysConstant("COLHOLDS", (indexes) => GetCurrentColHolds());
            AddSysConstant("EMPTYHOLDS", (indexes) => GetCurrentEmptyHolds());
            AddSysConstant("PHOTONS", (indexes) => GetCurrentPhotons());
            AddSysConstant("ARMIDS", (indexes) => GetCurrentArmids());
            AddSysConstant("LIMPETS", (indexes) => GetCurrentLimpets());
            AddSysConstant("GENTORPS", (indexes) => GetCurrentGenTorps());
            AddSysConstant("TWARPTYPE", (indexes) => GetCurrentTwarpType());
            AddSysConstant("CLOAKS", (indexes) => GetCurrentCloaks());
            AddSysConstant("BEACONS", (indexes) => GetCurrentBeacons());
            AddSysConstant("ATOMICS", (indexes) => GetCurrentAtomics());
            AddSysConstant("CORBOMITE", (indexes) => GetCurrentCorbomite());
            AddSysConstant("EPROBES", (indexes) => GetCurrentEprobes());
            AddSysConstant("MINEDISR", (indexes) => GetCurrentMineDisr());
            AddSysConstant("PSYCHICPROBE", (indexes) => GetCurrentPsychicProbe());
            AddSysConstant("PLANETSCANNER", (indexes) => GetCurrentPlanetScanner());
            AddSysConstant("SCANTYPE", (indexes) => GetCurrentScanType());
            AddSysConstant("ALIGNMENT", (indexes) => GetCurrentAlignment());
            AddSysConstant("EXPERIENCE", (indexes) => GetCurrentExperience());
            AddSysConstant("CORP", (indexes) => GetCurrentCorp());
            AddSysConstant("SHIPNUMBER", (indexes) => GetCurrentShipNumber());
            AddSysConstant("SHIPCLASS", (indexes) => GetCurrentShipClass());
            AddSysConstant("ANSIQUICKSTATS", (indexes) => GetCurrentAnsiQuickStats());
            AddSysConstant("QUICKSTATS", (indexes) => GetCurrentQuickStats());
            AddSysConstant("QS", (indexes) => GetCurrentQs());
            AddSysConstant("QSTAT", (indexes) => GetCurrentQStat());
            AddSysConstant("GAMEDATA", (indexes) => GetGameData());
            AddSysConstant("BOTLIST", (indexes) =>
            {
                var server = GetActiveGameInstance() ?? GlobalModules.CurrentContext.TWXServer;
                if (server != null)
                {
                    var bots = server.GetBotList();
                    return string.Join(",", bots);
                }
                return string.Empty;
            });
            AddSysConstant("ACTIVEBOT", (indexes) => GetActiveInterpreter()?.ActiveBot ?? string.Empty);
            AddSysConstant("ACTIVEBOTS", (indexes) =>
                ((GetActiveGameInstance() ?? GlobalModules.CurrentContext.TWXServer)?.GetBotList().Count ?? 0)
                    .ToString(CultureInfo.InvariantCulture));
            AddSysConstant("ACTIVEBOTDIR", (indexes) => GetActiveInterpreter()?.ActiveBotDir ?? string.Empty);
            AddSysConstant("ACTIVEBOTSCRIPT", (indexes) => GetActiveInterpreter()?.ActiveBotScript ?? string.Empty);
            AddSysConstant("ACTIVEBOTNAME", (indexes) => GetActiveInterpreter()?.ActiveBotName ?? string.Empty);
            AddSysConstant("VERSION", (indexes) => Constants.ProgramVersion);
            AddSysConstant("TWGSTYPE", (indexes) => string.Empty);
            AddSysConstant("TWGSVER", (indexes) => string.Empty);
            AddSysConstant("TW2002VER", (indexes) => string.Empty);
            AddSysConstant("SECTOR.DEADEND", (indexes) =>
            {
                var s = GetSectorByIndex(indexes);
                if (s == null) return "0";
                var warpCount = s.Warp.Count(w => w != 0);
                if (warpCount == 0) warpCount = s.WarpCount;
                return warpCount == 1 ? "1" : "0";
            });
            AddSysConstant("CURRENTTURNS", (indexes) => GetCurrentTurns());
            AddSysConstant("CURRENTUNLIMITEDGAME", (indexes) => GetCurrentUnlimitedGame());
            AddSysConstant("CURRENTCREDITS", (indexes) => GetCurrentCredits());
            AddSysConstant("CURRENTFIGHTERS", (indexes) => GetCurrentFighters());
            AddSysConstant("CURRENTSHIELDS", (indexes) => GetCurrentShields());
            AddSysConstant("CURRENTTOTALHOLDS", (indexes) => GetCurrentTotalHolds());
            AddSysConstant("CURRENTOREHOLDS", (indexes) => GetCurrentOreHolds());
            AddSysConstant("CURRENTORGHOLDS", (indexes) => GetCurrentOrgHolds());
            AddSysConstant("CURRENTEQUHOLDS", (indexes) => GetCurrentEquHolds());
            AddSysConstant("CURRENTCOLHOLDS", (indexes) => GetCurrentColHolds());
            AddSysConstant("CURRENTEMPTYHOLDS", (indexes) => GetCurrentEmptyHolds());
            AddSysConstant("CURRENTPHOTONS", (indexes) => GetCurrentPhotons());
            AddSysConstant("CURRENTARMIDS", (indexes) => GetCurrentArmids());
            AddSysConstant("CURRENTLIMPETS", (indexes) => GetCurrentLimpets());
            AddSysConstant("CURRENTGENTORPS", (indexes) => GetCurrentGenTorps());
            AddSysConstant("CURRENTTWARPTYPE", (indexes) => GetCurrentTwarpType());
            AddSysConstant("CURRENTCLOAKS", (indexes) => GetCurrentCloaks());
            AddSysConstant("CURRENTBEACONS", (indexes) => GetCurrentBeacons());
            AddSysConstant("CURRENTATOMICS", (indexes) => GetCurrentAtomics());
            AddSysConstant("CURRENTCORBOMITE", (indexes) => GetCurrentCorbomite());
            AddSysConstant("CURRENTEPROBES", (indexes) => GetCurrentEprobes());
            AddSysConstant("CURRENTMINEDISR", (indexes) => GetCurrentMineDisr());
            AddSysConstant("CURRENTPSYCHICPROBE", (indexes) => GetCurrentPsychicProbe());
            AddSysConstant("CURRENTPLANETSCANNER", (indexes) => GetCurrentPlanetScanner());
            AddSysConstant("CURRENTSCANTYPE", (indexes) => GetCurrentScanType());
            AddSysConstant("CURRENTALIGNMENT", (indexes) => GetCurrentAlignment());
            AddSysConstant("CURRENTEXPERIENCE", (indexes) => GetCurrentExperience());
            AddSysConstant("CURRENTCORP", (indexes) => GetCurrentCorp());
            AddSysConstant("CURRENTSHIPNUMBER", (indexes) => GetCurrentShipNumber());
            AddSysConstant("CURRENTSHIPCLASS", (indexes) => GetCurrentShipClass());
            AddSysConstant("CURRENTANSIQUICKSTATS", (indexes) => GetCurrentAnsiQuickStats());
            AddSysConstant("CURRENTQUICKSTATS", (indexes) => GetCurrentQuickStats());
            AddSysConstant("CURRENTQS", (indexes) => GetCurrentQs());
            AddSysConstant("CURRENTQSTAT", (indexes) => GetCurrentQStat());
            AddSysConstant("CURRENTPROMPT", (indexes) => GetCurrentPrompt());
            AddSysConstant("LIBPARM", (indexes) => string.Empty);
            AddSysConstant("LIBPARMS", (indexes) => string.Empty);
            AddSysConstant("LIBPARMCOUNT", (indexes) => "0");
            AddSysConstant("LIBSUBSPACE", (indexes) => "0");
            AddSysConstant("LIBSILENT", (indexes) => "0");
            AddSysConstant("LIBMULTILINE", (indexes) => "0");
            AddSysConstant("LIBMSG", (indexes) => string.Empty);
            AddSysConstant("ISNATIVEBOT", (indexes) =>
                IsAnyNativeBotRunning(GetActiveGameInstance()) ? "1" : "0");
            AddSysConstant("CURRENTHOLDS", (indexes) => GetCurrentTotalHolds());
            AddSysConstant("HAGGLE", (indexes) => GetNativeHaggle());
        }

        #region Text Processing Helpers

        /// <summary>
        /// Set the current line being processed (stripped of ANSI codes)
        /// This should be called when processing incoming server data
        /// </summary>
        public static void SetCurrentLine(string line)
        {
            GlobalModules.CurrentContext.CurrentLine = line;
        }

        public static void SetCurrentLine(TwxRuntimeContext? context, string line)
        {
            (context ?? GlobalModules.CurrentContext).CurrentLine = line;
        }

        /// <summary>
        /// Set the current ANSI line (with ANSI codes intact)
        /// This should be called when processing incoming server data
        /// </summary>
        public static void SetCurrentAnsiLine(string line)
        {
            GlobalModules.CurrentContext.CurrentAnsiLine = line;
        }

        public static void SetCurrentAnsiLine(TwxRuntimeContext? context, string line)
        {
            (context ?? GlobalModules.CurrentContext).CurrentAnsiLine = line;
        }

        /// <summary>
        /// Set the raw packet data received from server
        /// This should be called when receiving raw data from the server
        /// </summary>
        public static void SetRawPacket(string data)
        {
            GlobalModules.CurrentContext.RawPacket = data;
        }

        /// <summary>
        /// Get the current line (stripped of ANSI codes)
        /// </summary>
        public static string GetCurrentLine()
        {
            Script? script = _executingScript.Value;
            if (script?.HasCurrentTextContext == true)
                return script.CurrentTextLine;

            return GlobalModules.CurrentContext.CurrentLine;
        }

        public static string GetCurrentLine(TwxRuntimeContext? context)
        {
            Script? script = _executingScript.Value;
            if (script?.HasCurrentTextContext == true &&
                (context == null || ReferenceEquals(script.Controller.RuntimeContext, context)))
            {
                return script.CurrentTextLine;
            }

            return (context ?? GlobalModules.CurrentContext).CurrentLine;
        }

        internal static string GetGlobalCurrentLine()
        {
            return GlobalModules.CurrentContext.CurrentLine;
        }

        /// <summary>
        /// Get the current ANSI line (with ANSI codes)
        /// </summary>
        public static string GetCurrentAnsiLine()
        {
            Script? script = _executingScript.Value;
            if (script?.HasCurrentTextContext == true)
                return script.CurrentAnsiTextLine;

            return GlobalModules.CurrentContext.CurrentAnsiLine;
        }

        public static string GetCurrentAnsiLine(TwxRuntimeContext? context)
        {
            Script? script = _executingScript.Value;
            if (script?.HasCurrentTextContext == true &&
                (context == null || ReferenceEquals(script.Controller.RuntimeContext, context)))
            {
                return script.CurrentAnsiTextLine;
            }

            return (context ?? GlobalModules.CurrentContext).CurrentAnsiLine;
        }

        internal static string GetGlobalCurrentAnsiLine()
        {
            return GlobalModules.CurrentContext.CurrentAnsiLine;
        }

        internal static Script? GetExecutingScript()
        {
            return _executingScript.Value;
        }

        internal static void SetExecutingScript(Script? script)
        {
            _executingScript.Value = script;
        }

        /// <summary>
        /// Get the raw packet data
        /// </summary>
        public static string GetRawPacket()
        {
            return GlobalModules.CurrentContext.RawPacket;
        }

        #endregion

        #region Database/Game State Helpers

        /// <summary>
        /// Looks up a sector from the active database using the first element of a sysconst
        /// index array (e.g. PORT.CLASS[$CurSector] passes indexes=["3942"]).
        /// Returns null when the database or sector is not available.
        /// </summary>
        private static SectorData? GetSectorByIndex(string[] indexes)
        {
            if (indexes.Length == 0) return null;
            if (!int.TryParse(indexes[0], out int sn) || sn < 1) return null;
            return GetActiveDatabase()?.GetSector(sn);
        }

        private static List<string> GetPlanetNamesByIndex(string[] indexes)
        {
            if (indexes.Length == 0) return new List<string>();
            if (!int.TryParse(indexes[0], out int sn) || sn < 1) return new List<string>();
            return GetActiveDatabase()?.GetPlanetNamesInSector(sn) ?? new List<string>();
        }

        private static ShipStatus GetCurrentShipStatus()
        {
            return ActiveGameInstance?.CurrentShipStatus ?? new ShipStatus();
        }

        private static string GetPortBuildTime(string[] indexes)
        {
            var s = GetSectorByIndex(indexes);
            return s?.SectorPort != null ? s.SectorPort.BuildTime.ToString(CultureInfo.InvariantCulture) : string.Empty;
        }

        private static string GetPortUpdated(string[] indexes)
        {
            var s = GetSectorByIndex(indexes);
            if (s?.SectorPort == null || s.SectorPort.Update == default)
                return string.Empty;
            return s.SectorPort.Update.ToString(CultureInfo.CurrentCulture);
        }

        private static string GetCurrentTurns() => GetCurrentShipStatus().Turns.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentUnlimitedGame() => GetCurrentShipStatus().UnlimitedGame ? "1" : "0";
        private static string GetCurrentPrompt() => GetCurrentGameVar("$PLAYER~CURRENT_PROMPT", "Undefined");
        private static string GetCurrentCredits() => GetCurrentShipStatus().Credits.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentFighters() => GetCurrentShipStatus().Fighters.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentShields() => GetCurrentShipStatus().Shields.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentTotalHolds() => GetCurrentShipStatus().TotalHolds.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentOreHolds() => GetCurrentShipStatus().FuelOre.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentOrgHolds() => GetCurrentShipStatus().Organics.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentEquHolds() => GetCurrentShipStatus().Equipment.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentColHolds() => GetCurrentShipStatus().Colonists.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentEmptyHolds()
        {
            var s = GetCurrentShipStatus();
            int empty = s.TotalHolds - s.FuelOre - s.Organics - s.Equipment - s.Colonists;
            if (empty < 0) empty = 0;
            return empty.ToString(CultureInfo.InvariantCulture);
        }
        private static string GetCurrentPhotons() => GetCurrentShipStatus().Photons.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentArmids() => GetCurrentShipStatus().ArmidMines.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentLimpets() => GetCurrentShipStatus().LimpetMines.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentGenTorps() => GetCurrentShipStatus().GenesisTorps.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentTwarpType()
        {
            var status = GetCurrentShipStatus();
            if (status.TransWarp2 > 0)
                return "2";
            if (status.TransWarp1 > 0)
                return "1";
            return "No";
        }
        private static string GetCurrentCloaks() => GetCurrentShipStatus().Cloaks.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentBeacons() => GetCurrentShipStatus().Beacons.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentAtomics() => GetCurrentShipStatus().AtomicDet.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentCorbomite() => GetCurrentShipStatus().Corbomite.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentEprobes() => GetCurrentShipStatus().EtherProbes.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentMineDisr() => GetCurrentShipStatus().MineDisruptors.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentPsychicProbe() => GetCurrentShipStatus().PsychProbe ? "Yes" : "No";
        private static string GetCurrentPlanetScanner() => GetCurrentShipStatus().PlanetScanner ? "Yes" : "No";
        private static string GetCurrentScanType()
        {
            string lrs = GetCurrentShipStatus().LRSType;
            if (string.IsNullOrWhiteSpace(lrs))
                return "None";
            if (lrs.Contains("Holo", StringComparison.OrdinalIgnoreCase))
                return "Holo";
            if (lrs.Contains("Dens", StringComparison.OrdinalIgnoreCase) ||
                lrs.Contains("Density", StringComparison.OrdinalIgnoreCase))
                return "Dens";
            if (lrs.Contains("None", StringComparison.OrdinalIgnoreCase))
                return "None";
            return lrs.Trim();
        }
        private static string GetCurrentAlignment() => GetCurrentShipStatus().Alignment.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentExperience() => GetCurrentShipStatus().Experience.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentCorp() => GetCurrentShipStatus().Corp.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentShipNumber() => GetCurrentShipStatus().ShipNumber.ToString(CultureInfo.InvariantCulture);
        private static string GetCurrentShipClass()
        {
            var s = GetCurrentShipStatus();
            return !string.IsNullOrWhiteSpace(s.ShipClass) ? s.ShipClass : s.ShipType;
        }

        private static string GetCurrentAnsiQuickStats()
        {
            return string.Format(CultureInfo.InvariantCulture,
                "~0~5SECT  ~2= ~1{0,-11}~3|~5HLD ~2= ~1{1,-4}~3|~5FIGS ~2= ~1{2,-6}~3|~5ARMID ~2= ~1{3,-4}~3|~5TWARP ~2= ~1{4}" + "\r" +
                "~5TURNS ~2= ~1{5,-11}~3|~5ORE ~2= ~1{6,-4}~3|~5SHLD ~2= ~1{7,-6}~3|~5LMPIT ~2= ~1{8,-4}~3|~5PLSCN ~2= ~1{9}" + "\r" +
                "~5CREDS ~2= ~1{10,-11}~3|~5ORG ~2= ~1{11,-4}~3|~5PHOT ~2= ~1{12,-6}~3|~5GTORP ~2= ~1{13,-4}~3|~5LRS   ~2= ~1{14}" + "\r" +
                "~5ALN   ~2= ~1{15,-11}~3|~5EQU ~2= ~1{16,-4}~3|~5CRBO ~2= ~1{17,-6}~3|~5ATMDT ~2= ~1{18,-4}~3|~5PSPRB ~2= ~1{19}" + "\r" +
                "~5EXP   ~2= ~1{20,-11}~3|~5COL ~2= ~1{21,-4}~3|~5MDIS ~1= ~1{22,-6}~3|~5BEACN ~2= ~1{23,-4}~3|~5EPRB  ~2= ~1{24}" + "\r" +
                "~5SHIP  ~2= ~1{25,-4} ~3{26,-8}" + "\r",
                GetCurrentSector().ToString(CultureInfo.InvariantCulture),
                GetCurrentTotalHolds(),
                GetCurrentFighters(),
                GetCurrentArmids(),
                GetCurrentTwarpType(),
                GetCurrentTurns(),
                GetCurrentOreHolds(),
                GetCurrentShields(),
                GetCurrentLimpets(),
                GetCurrentPlanetScanner(),
                GetCurrentCredits(),
                GetCurrentOrgHolds(),
                GetCurrentPhotons(),
                GetCurrentGenTorps(),
                GetCurrentScanType(),
                GetCurrentAlignment(),
                GetCurrentEquHolds(),
                GetCurrentCorbomite(),
                GetCurrentAtomics(),
                GetCurrentPsychicProbe(),
                GetCurrentExperience(),
                GetCurrentColHolds(),
                GetCurrentMineDisr(),
                GetCurrentBeacons(),
                GetCurrentEprobes(),
                GetCurrentShipNumber(),
                GetCurrentShipClass());
        }

        private static string GetCurrentQuickStats()
        {
            string qs = GetCurrentAnsiQuickStats();
            if (ActiveGameInstance != null)
                qs = ActiveGameInstance.ApplyQuickText(qs);
            return AnsiCodes.StripANSI(qs);
        }

        private static string GetCurrentQs()
        {
            return string.Format(CultureInfo.InvariantCulture,
                "{0} {1} {2} {3} {4} {5} {6} {7} {8} {9} {10} {11} {12} {13} {14} {15}",
                GetCurrentTurns(),
                GetCurrentCredits(),
                GetCurrentFighters(),
                GetCurrentShields(),
                GetCurrentCorbomite(),
                GetCurrentPhotons(),
                GetCurrentAlignment(),
                GetCurrentExperience(),
                GetCurrentCorp(),
                GetCurrentShipNumber(),
                GetCurrentShipClass(),
                GetCurrentTotalHolds(),
                GetCurrentOreHolds(),
                GetCurrentOrgHolds(),
                GetCurrentEquHolds(),
                GetCurrentColHolds());
        }

        private static string GetCurrentQStat()
        {
            return string.Format(CultureInfo.InvariantCulture,
                "{0} {1} {2} {3} {4} {5} {6} {7} {8} {9} {10} {11} {12} {13} {14} {15} {16} {17} {18} {19} {20} {21} {22} {23} {24} {25} {26} {27}",
                GetCurrentTurns(),
                GetCurrentCredits(),
                GetCurrentFighters(),
                GetCurrentShields(),
                GetCurrentCorbomite(),
                GetCurrentPhotons(),
                GetCurrentAlignment(),
                GetCurrentExperience(),
                GetCurrentCorp(),
                GetCurrentShipNumber(),
                GetCurrentShipClass(),
                GetCurrentTotalHolds(),
                GetCurrentOreHolds(),
                GetCurrentOrgHolds(),
                GetCurrentEquHolds(),
                GetCurrentColHolds(),
                GetCurrentArmids(),
                GetCurrentLimpets(),
                GetCurrentGenTorps(),
                GetCurrentAtomics(),
                GetCurrentTwarpType(),
                GetCurrentCloaks(),
                GetCurrentBeacons(),
                GetCurrentEprobes(),
                GetCurrentMineDisr(),
                GetCurrentPsychicProbe(),
                GetCurrentPlanetScanner(),
                GetCurrentScanType());
        }

        /// <summary>
        /// Get connected status from active game instance
        /// </summary>
        public static string GetConnected()
        {
            return (ActiveGameInstance?.IsConnected ?? false) ? "1" : "0";
        }

        /// <summary>
        /// Get native haggle enabled status from active game instance.
        /// </summary>
        public static string GetNativeHaggle()
        {
            return (ActiveGameInstance?.NativeHaggleEnabled ?? false) ? "1" : "0";
        }

        /// <summary>
        /// Get game character from database header
        /// </summary>
        public static string GetGame()
        {
            var db = GetActiveDatabase();
            if (db == null) return string.Empty;
            return db.DBHeader.Game.ToString();
        }

        /// <summary>
        /// Get game name (database name without extension)
        /// </summary>
        public static string GetGameName()
        {
            var db = GetActiveDatabase();
            if (db == null) return string.Empty;
            return db.DatabaseName;
        }

        /// <summary>
        /// Get login username from database header
        /// </summary>
        public static string GetLoginName()
        {
            var db = GetActiveDatabase();
            if (db == null) return string.Empty;
            return db.DBHeader.LoginName ?? string.Empty;
        }

        /// <summary>
        /// Get login password from database header
        /// </summary>
        public static string GetPassword()
        {
            var db = GetActiveDatabase();
            if (db == null) return string.Empty;
            return db.DBHeader.Password ?? string.Empty;
        }

        /// <summary>
        /// Get game data path (database name with backslash)
        /// </summary>
        public static string GetGameData()
        {
            var db = GetActiveDatabase();
            if (db == null) return string.Empty;
            return db.DatabaseName + "\\";
        }

        /// <summary>
        /// Get total number of sectors in the universe
        /// </summary>
        public static string GetSectors()
        {
            var db = GetActiveDatabase();
            if (db == null) return "0";
            // If no .twx loaded yet, fall back to the highest sector number we've seen live
            if (db.DBHeader.Sectors == 0)
                return db.MaxSectorSeen.ToString();
            return db.DBHeader.Sectors.ToString();
        }

        /// <summary>
        /// Get StarDock sector number (returns "0" if 65535/not set)
        /// </summary>
        public static string GetStarDock()
        {
            var db = GetActiveDatabase();
            if (db == null) return "0";
            return db.DBHeader.StarDock == 65535 ? "0" : db.DBHeader.StarDock.ToString();
        }

        /// <summary>
        /// Get Alpha Centauri sector number
        /// </summary>
        public static string GetAlphaCentauri()
        {
            var db = GetActiveDatabase();
            if (db == null) return "0";
            return db.DBHeader.AlphaCentauri.ToString();
        }

        /// <summary>
        /// Get Rylos sector number
        /// </summary>
        public static string GetRylos()
        {
            var db = GetActiveDatabase();
            if (db == null) return "0";
            return db.DBHeader.Rylos.ToString();
        }

        #endregion
    }
}
