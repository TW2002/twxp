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

// Script command implementations - partial class to extend ScriptRef

using System;
using System.IO;
using System.Linq;
using System.Globalization;
using System.Diagnostics;
using System.Text;
using System.Threading.Tasks;

namespace TWXProxy.Core
{
    /// <summary>
    /// Partial class containing all script command implementations
    /// </summary>
    public partial class ScriptRef
    {
        #region Helper Methods

        private static void ConvertToNumber(string s, out int number)
        {
            if (!int.TryParse(s, out number))
                throw new ScriptException($"'{s}' is not a number");
        }

        private static void ConvertToBoolean(CmdParam param, out bool value)
        {
            if (param.IsNumeric)
            {
                if (param.DecValue == 0)
                    value = false;
                else if (param.DecValue == 1)
                    value = true;
                else
                    throw new ScriptException($"Value must be either 0 or 1 (cannot be \"{param.Value}\")");
            }
            else
            {
                if (param.Value == "0")
                    value = false;
                else if (param.Value == "1")
                    value = true;
                else
                    throw new ScriptException($"Value must be either 0 or 1 (cannot be \"{param.Value}\")");
            }
        }

        private static string ConvertBoolToString(bool value)
        {
            return value ? "1" : "0";
        }

        private static string FormatTwxTime(DateTime now, string? format)
        {
            if (string.IsNullOrWhiteSpace(format))
                return ScriptTimeFormatter.Format(now);

            string trimmed = format.Trim();
            switch (trimmed)
            {
                case "h":
                    return now.Hour.ToString(CultureInfo.InvariantCulture);
                case "hh":
                    return now.Hour.ToString("00", CultureInfo.InvariantCulture);
                case "n":
                case "m":
                    return now.Minute.ToString(CultureInfo.InvariantCulture);
                case "nn":
                    return now.Minute.ToString("00", CultureInfo.InvariantCulture);
                case "s":
                    return now.Second.ToString(CultureInfo.InvariantCulture);
                case "ss":
                    return now.Second.ToString("00", CultureInfo.InvariantCulture);
                case "z":
                    return now.Millisecond.ToString("0", CultureInfo.InvariantCulture);
                case "zz":
                    return now.Millisecond.ToString("00", CultureInfo.InvariantCulture);
                case "zzz":
                    return now.Millisecond.ToString("000", CultureInfo.InvariantCulture);
                case "t":
                case "T":
                    return ScriptTimeFormatter.Format(now);
            }

            string translated = TranslateTwxDateTimeFormat(trimmed);
            return now.ToString(translated, CultureInfo.InvariantCulture);
        }

        private static string TranslateTwxDateTimeFormat(string format)
        {
            var sb = new StringBuilder(format.Length * 2);

            for (int i = 0; i < format.Length;)
            {
                if (MatchesFormatToken(format, i, "am/pm"))
                {
                    sb.Append("tt");
                    i += 5;
                    continue;
                }

                char c = format[i];
                if (!char.IsLetter(c))
                {
                    sb.Append(c);
                    i++;
                    continue;
                }

                int runLength = 1;
                while (i + runLength < format.Length &&
                       char.ToLowerInvariant(format[i + runLength]) == char.ToLowerInvariant(c))
                {
                    runLength++;
                }

                switch (char.ToLowerInvariant(c))
                {
                    case 'y':
                        sb.Append(runLength switch
                        {
                            1 => "y",
                            2 => "yy",
                            3 => "yyy",
                            _ => "yyyy"
                        });
                        break;

                    case 'd':
                        sb.Append(runLength switch
                        {
                            1 => "d",
                            2 => "dd",
                            3 => "ddd",
                            _ => "dddd"
                        });
                        break;

                    case 'h':
                        sb.Append(runLength == 1 ? "H" : "HH");
                        break;

                    case 'n':
                        sb.Append(runLength == 1 ? "m" : "mm");
                        break;

                    case 'm':
                        if (LooksLikeMinuteToken(format, i, runLength))
                        {
                            sb.Append(runLength == 1 ? "m" : "mm");
                        }
                        else
                        {
                            sb.Append(runLength switch
                            {
                                1 => "M",
                                2 => "MM",
                                3 => "MMM",
                                _ => "MMMM"
                            });
                        }
                        break;

                    case 's':
                        sb.Append(runLength == 1 ? "s" : "ss");
                        break;

                    case 'z':
                        sb.Append(runLength switch
                        {
                            1 => "f",
                            2 => "ff",
                            _ => "fff"
                        });
                        break;

                    case 't':
                        sb.Append("tt");
                        break;

                    default:
                        sb.Append(format, i, runLength);
                        break;
                }

                i += runLength;
            }

            return sb.ToString();
        }

        private static void QueueScriptInputPrompt(string? prompt = null)
        {
            if (_activeGameInstance != null)
            {
                if (!string.IsNullOrEmpty(prompt))
                    _activeGameInstance.Broadcast($"\r\n{prompt}\r\n", broadcastDeaf: true);

                _activeGameInstance.Broadcast("> ", broadcastDeaf: true);
                return;
            }

            if (GlobalModules.TWXServer != null)
            {
                if (!string.IsNullOrEmpty(prompt))
                    GlobalModules.TWXServer.Broadcast($"\r\n{prompt}\r\n", broadcastDeaf: true);

                GlobalModules.TWXServer.Broadcast("> ", broadcastDeaf: true);
                return;
            }

            if (!string.IsNullOrEmpty(prompt))
                Console.WriteLine(prompt);

            Console.Write("> ");
        }

        private static bool LooksLikeMinuteToken(string format, int start, int runLength)
        {
            char prev = FindFormatNeighbor(format, start - 1, -1);
            char next = FindFormatNeighbor(format, start + runLength, 1);

            if (prev == ':' || next == ':')
                return true;

            return IsTimeTokenNeighbor(prev) || IsTimeTokenNeighbor(next);
        }

        private static char FindFormatNeighbor(string format, int index, int step)
        {
            while (index >= 0 && index < format.Length)
            {
                char c = format[index];
                if (!char.IsWhiteSpace(c))
                    return c;
                index += step;
            }

            return '\0';
        }

        private static bool IsTimeTokenNeighbor(char c)
        {
            char lower = char.ToLowerInvariant(c);
            return lower is 'h' or 'n' or 's' or 'z' or 't';
        }

        private static bool MatchesFormatToken(string format, int index, string token)
        {
            if (index + token.Length > format.Length)
                return false;

            return string.Compare(format, index, token, 0, token.Length, StringComparison.OrdinalIgnoreCase) == 0;
        }

        private static void UpdateParam(CmdParam param, double value, int precision)
        {
            if (precision == 0)
                param.DecValue = Math.Truncate(value);
            else
                param.DecValue = value;

            param.SigDigits = (byte)precision;
        }

        #endregion

        #region Arithmetic and Logic Commands

        private static CmdAction CmdAdd(object script, CmdParam[] parameters)
        {
            // CMD: add var <value>
            double f1 = parameters[0].DecValue;
            double f2 = parameters[1].DecValue;
            int precision = script is Script s0 ? s0.DecimalPrecision : 0;
            UpdateParam(parameters[0], f1 + f2, precision);
            string varLabel = parameters[0] is VarParam vp ? $"({vp.Name}) " :
                             (parameters[0] is ProgVarParam pvp ? $"(ProgVar:{pvp.Name}) " : "");
            GlobalModules.ScriptTraceDebugLog($"[ADD] {varLabel}{f1} + {f2} = {parameters[0].DecValue}\n");
            return CmdAction.None;
        }

        private static CmdAction CmdSubtract(object script, CmdParam[] parameters)
        {
            // CMD: subtract var <value>
            double f1 = parameters[0].DecValue;
            double f2 = parameters[1].DecValue;
            int precision = script is Script s1 ? s1.DecimalPrecision : 0;
            UpdateParam(parameters[0], f1 - f2, precision);
            return CmdAction.None;
        }

        private static CmdAction CmdMultiply(object script, CmdParam[] parameters)
        {
            // CMD: multiply var <value>
            double f1 = parameters[0].DecValue;
            double f2 = parameters[1].DecValue;
            int precision = script is Script s2 ? s2.DecimalPrecision : 0;
            UpdateParam(parameters[0], f1 * f2, precision);
            return CmdAction.None;
        }

        private static CmdAction CmdDivide(object script, CmdParam[] parameters)
        {
            // CMD: divide var <value>
            double f2 = parameters[1].DecValue;
            if (f2 == 0)
                throw new ScriptException("Division by zero");
            double f1 = parameters[0].DecValue;
            int precision = script is Script s3 ? s3.DecimalPrecision : 0;
            UpdateParam(parameters[0], f1 / f2, precision);
            return CmdAction.None;
        }

        private static CmdAction CmdModulus(object script, CmdParam[] parameters)
        {
            // CMD: modulus var <value>
            int f2 = (int)Math.Floor(parameters[1].DecValue);
            if (f2 == 0)
                throw new ScriptException("Division by zero");
            int f1 = (int)Math.Floor(parameters[0].DecValue);
            int precision = script is Script s4 ? s4.DecimalPrecision : 0;
            UpdateParam(parameters[0], f1 % f2, precision);
            return CmdAction.None;
        }

        private static CmdAction CmdRound(object script, CmdParam[] parameters)
        {
            // CMD: round var [precision]
            int precision = parameters.Length > 1 ? (int)parameters[1].DecValue : 0;
            double factor = Math.Pow(10, precision);
            double f = parameters[0].DecValue * factor;
            // Pascal Int/Frac semantics are truncate-toward-zero, not floor.
            double intPart = Math.Truncate(f);
            double fraction = f - intPart;
            double point5 = 0.5 - 1e-17; // Pascal fuzz factor.

            if (fraction >= point5)
                f = (intPart + 1.0) / factor;
            else
                f = intPart / factor;

            parameters[0].DecValue = f;
            // Update sigDigits so Value formats correctly (e.g. round $X 0 → "2386" not "2386.000")
            parameters[0].SigDigits = (byte)precision;
            return CmdAction.None;
        }

        private static CmdAction CmdTruncate(object script, CmdParam[] parameters)
        {
            // CMD: truncate var
            parameters[0].DecValue = Math.Truncate(parameters[0].DecValue);
            return CmdAction.None;
        }

        private static CmdAction CmdAnd(object script, CmdParam[] parameters)
        {
            // CMD: and var <value>
            ConvertToBoolean(parameters[0], out bool b1);
            ConvertToBoolean(parameters[1], out bool b2);
            parameters[0].Value = ConvertBoolToString(b1 && b2);
            return CmdAction.None;
        }

        private static CmdAction CmdOr(object script, CmdParam[] parameters)
        {
            // CMD: or var <value>
            ConvertToBoolean(parameters[0], out bool b1);
            ConvertToBoolean(parameters[1], out bool b2);
            parameters[0].Value = ConvertBoolToString(b1 || b2);
            return CmdAction.None;
        }

        private static CmdAction CmdXor(object script, CmdParam[] parameters)
        {
            // CMD: xor var <value>
            ConvertToBoolean(parameters[0], out bool b1);
            ConvertToBoolean(parameters[1], out bool b2);
            parameters[0].Value = ConvertBoolToString(b1 ^ b2);
            return CmdAction.None;
        }

        #endregion

        #region Comparison Commands

        // Pascal TWX: '=' and '<>' compare numerically when both sides are numeric-compatible.
        // Empty string is not numeric-compatible here; comparisons such as 0 <> ""
        // must fall back to string semantics so Mombot can blank optional arguments.
        private static bool TryNumericValue(string s, out double val)
        {
            if (s.Length == 0) { val = 0; return false; }
            return double.TryParse(s, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out val);
        }

        private static double GetMaxFloatVariance(object script)
        {
            int precision = script is Script s ? s.DecimalPrecision : 0;
            if (precision <= 0)
                return 0;
            return 0.5 / Math.Pow(10, precision);
        }

        private static CmdAction CmdIsEqual(object script, CmdParam[] parameters)
        {
            // CMD: isequal var <value1> <value2>
            string v1 = parameters[1].Value;
            string v2 = parameters[2].Value;
            bool result;
            int precision = script is Script s ? s.DecimalPrecision : 0;
            if (precision != 0 && TryNumericValue(v1, out double d1) && TryNumericValue(v2, out double d2))
                result = Math.Abs(d1 - d2) <= GetMaxFloatVariance(script);
            else
                result = string.Equals(v1, v2, StringComparison.OrdinalIgnoreCase);
            parameters[0].Value = result ? "1" : "0";
            if (GlobalModules.ScriptTraceDebugMode)
            {
                string p1n = (parameters[1] is ProgVarParam pv1) ? $"PV:{pv1.Name}" : (parameters[1] is VarParam vp1) ? $"V:{vp1.Name}@{vp1.GetHashCode():X6}" : "const";
                string p2n = (parameters[2] is ProgVarParam pv2) ? $"PV:{pv2.Name}" : (parameters[2] is VarParam vp2) ? $"V:{vp2.Name}" : "const";
                GlobalModules.ScriptTraceDebugLog($"[CMP] [{p1n}]='{v1}' == [{p2n}]='{v2}' -> {(result ? "1" : "0")}\n");
                if (!result && v1.Length > 0 && v2.Length > 0 && v1.Length <= 3 && v2.Length <= 3)
                    GlobalModules.ScriptTraceDebugLog($"[CMP_BYTES] v1=[{string.Join(",", v1.Select(c => (int)c))}] v2=[{string.Join(",", v2.Select(c => (int)c))}]\n");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdIsNotEqual(object script, CmdParam[] parameters)
        {
            // CMD: isnotequal var <value1> <value2>
            string v1 = parameters[1].Value;
            string v2 = parameters[2].Value;
            bool result;
            if (TryNumericValue(v1, out double d1) && TryNumericValue(v2, out double d2))
                result = Math.Abs(d1 - d2) > GetMaxFloatVariance(script);
            else
                result = !string.Equals(v1, v2, StringComparison.OrdinalIgnoreCase);
            parameters[0].Value = result ? "1" : "0";
            if (GlobalModules.ScriptTraceDebugMode)
            {
                string p1n = (parameters[1] is ProgVarParam pv1) ? $"PV:{pv1.Name}" : (parameters[1] is VarParam vp1) ? $"V:{vp1.Name}" : "const";
                string p2n = (parameters[2] is ProgVarParam pv2) ? $"PV:{pv2.Name}" : (parameters[2] is VarParam vp2) ? $"V:{vp2.Name}" : "const";
                GlobalModules.ScriptTraceDebugLog($"[CMP] [{p1n}]='{v1}' != [{p2n}]='{v2}' -> {(result ? "1" : "0")}\n");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdIsGreater(object script, CmdParam[] parameters)
        {
            // CMD: isgreater var <value1> <value2>
            double v1 = parameters[1].DecValue;
            double v2 = parameters[2].DecValue;
            double maxFloatVariance = GetMaxFloatVariance(script);
            bool result = (v1 - maxFloatVariance) > v2;
            parameters[0].Value = result ? "1" : "0";
            if (GlobalModules.DiagnoseMode)
                GlobalModules.DebugLog($"[CMP] {v1} > {v2} \u2192 {(result ? "TRUE" : "FALSE")}\n");
            return CmdAction.None;
        }

        private static CmdAction CmdIsGreaterEqual(object script, CmdParam[] parameters)
        {
            // CMD: isgreaterequal var <value1> <value2>
            double v1 = parameters[1].DecValue;
            double v2 = parameters[2].DecValue;
            double maxFloatVariance = GetMaxFloatVariance(script);
            bool result = ((v1 - maxFloatVariance) >= v2) || (Math.Abs(v1 - v2) <= maxFloatVariance);
            parameters[0].Value = result ? "1" : "0";
            if (GlobalModules.DiagnoseMode)
                GlobalModules.DebugLog($"[CMP] {v1} >= {v2} \u2192 {(result ? "TRUE" : "FALSE")}\n");
            return CmdAction.None;
        }

        private static CmdAction CmdIsLesser(object script, CmdParam[] parameters)
        {
            // CMD: islesser var <value1> <value2>
            double v1 = parameters[1].DecValue;
            double v2 = parameters[2].DecValue;
            double maxFloatVariance = GetMaxFloatVariance(script);
            bool result = (v1 + maxFloatVariance) < v2;
            parameters[0].Value = result ? "1" : "0";
            if (GlobalModules.DiagnoseMode)
                GlobalModules.DebugLog($"[CMP] {v1} < {v2} \u2192 {(result ? "TRUE" : "FALSE")}\n");
            return CmdAction.None;
        }

        private static CmdAction CmdIsLesserEqual(object script, CmdParam[] parameters)
        {
            // CMD: islesserequal var <value1> <value2>
            double v1 = parameters[1].DecValue;
            double v2 = parameters[2].DecValue;
            double maxFloatVariance = GetMaxFloatVariance(script);
            bool result = ((v1 + maxFloatVariance) <= v2) || (Math.Abs(v1 - v2) <= maxFloatVariance);
            parameters[0].Value = result ? "1" : "0";
            if (GlobalModules.DiagnoseMode)
                GlobalModules.DebugLog($"[CMP] {v1} <= {v2} \u2192 {(result ? "TRUE" : "FALSE")}\n");
            return CmdAction.None;
        }

        private static CmdAction CmdIsNumber(object script, CmdParam[] parameters)
        {
            // CMD: isnumber var <value>
            bool isNumber = double.TryParse(parameters[1].Value, NumberStyles.Float,
                CultureInfo.InvariantCulture, out _);
            parameters[0].Value = isNumber ? "1" : "0";
            return CmdAction.None;
        }

        #endregion

        #region String Commands

        private static CmdAction CmdSetVar(object script, CmdParam[] parameters)
        {
            // CMD: setvar var <values...>
            // Concatenate all remaining parameters
            string result = string.Empty;
            for (int i = 1; i < parameters.Length; i++)
                result += parameters[i].Value;

            string varName = (parameters[0] is VarParam vp) ? vp.Name
                : (parameters[0] is ProgVarParam pvp) ? $"PV:{pvp.Name}" : "???";
            string oldValue = parameters[0].Value;

            // Skip verbose logging for compiler-generated temporaries ($$__cond*, $$__math*)
            if (!varName.Contains("$$__cond") && !varName.Contains("$$__math"))
            {
                string svHash = (parameters[0] is VarParam svp) ? $"@{svp.GetHashCode():X8}"
                    : (parameters[0] is ProgVarParam pvph) ? $"@{pvph.GetHashCode():X8}" : "";
                // Log source params with their identity so aliasing is visible
                var srcInfo = new System.Text.StringBuilder();
                for (int i = 1; i < parameters.Length; i++)
                {
                    string srcName = (parameters[i] is VarParam sp) ? $"${sp.Name}@{sp.GetHashCode():X8}"
                        : (parameters[i] is ProgVarParam spp) ? $"PV:{spp.Name}"
                        : $"const";
                    srcInfo.Append($" src[{i}]={srcName}='{parameters[i].Value}'");
                }
                if (GlobalModules.VerboseDebugMode)
                    GlobalModules.ScriptTraceDebugLog($"[SETVAR] {varName}{svHash}: '{oldValue}' → '{result}'{srcInfo}\n");
            }
            else if (GlobalModules.VerboseDebugMode)
                GlobalModules.ScriptTraceDebugLog($"[SETVAR] {varName}: '{oldValue}' → '{result}'\n");
            if (parameters.Length == 2 && parameters[1].IsNumeric)
                UpdateParam(parameters[0], parameters[1].DecValue, parameters[1].SigDigits);
            else
                parameters[0].Value = result;

            // Track login credentials whenever the script sets them so the login
            // state machine in ProxyService can send them at the TWGS prompts.
            if (varName == "$username" || varName == "$password" || varName == "$letter")
                TrackCredential(varName, result);

            // (diagnostic output goes to debug log only via the DebugLog call above)

            return CmdAction.None;
        }

        private static CmdAction CmdConcat(object script, CmdParam[] parameters)
        {
            // CMD: concat var <values...>
            string varName = (parameters[0] is VarParam vp) ? vp.Name
                : (parameters[0] is ProgVarParam pvp) ? $"PV:{pvp.Name}" : "???";
            string oldValue = parameters[0].Value;
            // Log all source params so we can see exactly what is being appended and from what variable
            var srcDescs = new System.Text.StringBuilder();
            for (int i = 1; i < parameters.Length; i++)
            {
                string srcName = (parameters[i] is VarParam svp) ? $"${svp.Name}@{svp.GetHashCode():X8}"
                    : (parameters[i] is ProgVarParam spvp) ? $"PV:{spvp.Name}"
                    : $"const";
                srcDescs.Append($" src[{i}]={srcName}='{parameters[i].Value}'");
                parameters[0].Value += parameters[i].Value;
            }
            if (GlobalModules.VerboseDebugMode)
                GlobalModules.ScriptTraceDebugLog($"[CONCAT] {varName}@{parameters[0].GetHashCode():X8}: '{oldValue}' → '{parameters[0].Value}'{srcDescs}\n");
            return CmdAction.None;
        }

        private static CmdAction CmdUpperCase(object script, CmdParam[] parameters)
        {
            // CMD: uppercase var
            parameters[0].Value = parameters[0].Value.ToUpperInvariant();
            return CmdAction.None;
        }

        private static CmdAction CmdLowerCase(object script, CmdParam[] parameters)
        {
            // CMD: lowercase var
            parameters[0].Value = parameters[0].Value.ToLowerInvariant();
            return CmdAction.None;
        }

        private static CmdAction CmdTrim(object script, CmdParam[] parameters)
        {
            // CMD: trim var
            parameters[0].Value = parameters[0].Value.Trim();
            return CmdAction.None;
        }

        private static CmdAction CmdGetLength(object script, CmdParam[] parameters)
        {
            // CMD: getlength <value> var
            string p0Name = (parameters[0] is VarParam v0gl) ? v0gl.Name : (parameters[0] is ProgVarParam pv0gl) ? $"ProgVar:{pv0gl.Name}" : "const";
            string p1Name = (parameters[1] is VarParam v1gl) ? v1gl.Name : (parameters[1] is ProgVarParam pv1gl) ? $"ProgVar:{pv1gl.Name}" : "???";
            int len = parameters[0].Value.Length;
            parameters[1].Value = len.ToString();
            if (GlobalModules.VerboseDebugMode)
                GlobalModules.ScriptTraceDebugLog($"[GETLENGTH] {p0Name}='{parameters[0].Value}' → {p1Name}='{len}'\n");
            return CmdAction.None;
        }

        private static CmdAction CmdCutText(object script, CmdParam[] parameters)
        {
            // CMD: cuttext <value> var <start> <length>
            string startParamInfo = (parameters[2] is VarParam vsct) ? $"{vsct.Name}={vsct.Value}" :
                                    (parameters[2] is ProgVarParam pvsct) ? $"ProgVar:{pvsct.Name}={pvsct.Value}" :
                                    $"const:{parameters[2].Value}";
            int start = (int)parameters[2].DecValue;
            int length = (int)parameters[3].DecValue;
            string srcName = (parameters[0] is VarParam sv) ? sv.Name : (parameters[0] is ProgVarParam pv) ? $"ProgVar:{pv.Name}" : "const";
            string dstName = (parameters[1] is VarParam dv) ? dv.Name : (parameters[1] is ProgVarParam dpv) ? $"ProgVar:{dpv.Name}" : "???";

            // Delphi Pascal Copy(S, 0, N) = Copy(S, 1, N) = full string from the start.
            // Clamp start=0 (or negative) to 1 so the substring proceeds normally.
            if (start <= 0) start = 1;

            if (start > parameters[0].Value.Length)
            {
                if (GlobalModules.VerboseDebugMode)
                    GlobalModules.ScriptTraceDebugLog($"[CUTTEXT] src={srcName}='{parameters[0].Value}' dst={dstName} start={start}[{startParamInfo}] len={length} → '' (start>len)\n");
                parameters[1].Value = string.Empty;
                return CmdAction.None;
            }

            if (length <= 0)
            {
                if (GlobalModules.VerboseDebugMode)
                    GlobalModules.ScriptTraceDebugLog($"[CUTTEXT] src={srcName}='{parameters[0].Value}' dst={dstName} start={start}[{startParamInfo}] len={length} → '' (len<=0)\n");
                parameters[1].Value = string.Empty;
                return CmdAction.None;
            }

            string result = parameters[0].Value.Substring(start - 1,
                Math.Min(length, parameters[0].Value.Length - start + 1));
            if (GlobalModules.VerboseDebugMode)
                GlobalModules.ScriptTraceDebugLog($"[CUTTEXT] src={srcName}='{parameters[0].Value}' dst={dstName} start={start}[{startParamInfo}] len={length} → '{result}'\n");
            parameters[1].Value = result;
            return CmdAction.None;
        }

        private static CmdAction CmdGetText(object script, CmdParam[] parameters)
        {
            // CMD: getText <line> var <startStr> <endStr>
            // Extracts text from <line> between <startStr> and <endStr> (string delimiters, not positions)
            string line = parameters[0].Value;
            string startStr = parameters[2].Value;
            string endStr = parameters[3].Value;

            int startPos;
            if (string.IsNullOrEmpty(startStr))
            {
                startPos = 0;
            }
            else
            {
                int idx = line.IndexOf(startStr, StringComparison.Ordinal);
                if (idx < 0)
                {
                    parameters[1].Value = string.Empty;
                    GlobalModules.ScriptTraceDebugLog($"[GETTEXT] startStr '{startStr}' not found in '{line}'\n");
                    return CmdAction.None;
                }
                startPos = idx + startStr.Length;
            }

            string remaining = line.Substring(startPos);

            string result;
            if (string.IsNullOrEmpty(endStr))
            {
                result = remaining;
            }
            else
            {
                int endIdx = remaining.IndexOf(endStr, StringComparison.Ordinal);
                result = endIdx >= 0 ? remaining.Substring(0, endIdx) : string.Empty;
            }

            parameters[1].Value = result;
            GlobalModules.ScriptTraceDebugLog($"[GETTEXT] source='{line}', start='{startStr}', end='{endStr}' => '{result}'\n");
            return CmdAction.None;
        }

        private static CmdAction CmdReplaceText(object script, CmdParam[] parameters)
        {
            // CMD: replacetext var <find> <replace>
            parameters[0].Value = parameters[0].Value.Replace(parameters[1].Value, parameters[2].Value);
            return CmdAction.None;
        }

        private static CmdAction CmdStripText(object script, CmdParam[] parameters)
        {
            // CMD: striptext var <substring>
            // Pascal: removes ALL occurrences of the exact substring (not char-by-char).
            // Case-sensitive (Pascal uses plain '=' comparison, no UpperCase).
            // e.g. stripText $line "Ore" removes "Ore" but does NOT touch 'O', 'r', 'e' individually.
            string value = parameters[0].Value;
            string strip = parameters[1].Value;

            if (!string.IsNullOrEmpty(strip))
            {
                int i = 0;
                while (i <= value.Length - strip.Length)
                {
                    if (string.Compare(value, i, strip, 0, strip.Length, StringComparison.Ordinal) == 0)
                    {
                        value = value.Remove(i, strip.Length);
                        // Pascal resets I to 0 after a match, so check same position again
                    }
                    else
                    {
                        i++;
                    }
                }
            }

            parameters[0].Value = value;
            return CmdAction.None;
        }

        private static CmdAction CmdPadLeft(object script, CmdParam[] parameters)
        {
            // CMD: padLeft var <length> [pad]
            int length = (int)parameters[1].DecValue;
            string padValue = parameters.Length > 2 ? parameters[2].Value : " ";
            string pad = string.Empty;

            for (int i = parameters[0].Value.Length; i <= length - 1; i++)
            {
                pad += padValue;
            }

            parameters[0].Value = pad + parameters[0].Value;
            return CmdAction.None;
        }

        private static CmdAction CmdPadRight(object script, CmdParam[] parameters)
        {
            // CMD: padRight var <length> [pad]
            int length = (int)parameters[1].DecValue;
            string padValue = parameters.Length > 2 ? parameters[2].Value : " ";
            string pad = string.Empty;

            for (int i = parameters[0].Value.Length; i <= length - 1; i++)
            {
                pad += padValue;
            }

            parameters[0].Value = parameters[0].Value + pad;
            return CmdAction.None;
        }

        private static CmdAction CmdGetWord(object script, CmdParam[] parameters)
        {
            // CMD: getword <line> var <index> <default>
            int index = (int)parameters[2].DecValue;

            string oldValue = parameters[1].Value;
            string varName = (parameters[1] is VarParam vp) ? vp.Name : "???";
            string newValue = Utility.GetParameter(parameters[0].Value, index);
            if (newValue.Length == 0)
            {
                newValue = parameters.Length > 3 ? parameters[3].Value : "0";
            }

            string srcName = (parameters[0] is VarParam sv) ? $"[src={sv.Name}]" : (parameters[0] is ProgVarParam pvs) ? $"[src=PV:{pvs.Name}]" : "";
            string destHash = (parameters[1] is VarParam dvh) ? $"@{dvh.GetHashCode():X6}" : "";
            string defaultValue = parameters.Length > 3 ? parameters[3].Value : "0";
            GlobalModules.ScriptTraceDebugLog($"[GETWORD] {varName}{destHash}{srcName}: source='{parameters[0].Value}', index={index}, default='{defaultValue}' => '{oldValue}' → '{newValue}'\n");
            parameters[1].Value = newValue;
            return CmdAction.None;
        }

        private static CmdAction CmdGetWordCount(object script, CmdParam[] parameters)
        {
            // CMD: getwordcount <value> var
            string[] words = parameters[0].Value.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            parameters[1].Value = words.Length.ToString();
            return CmdAction.None;
        }

        private static CmdAction CmdGetWordPos(object script, CmdParam[] parameters)
        {
            // CMD: getwordpos <value> var <word>
            // Returns 1-based CHARACTER position of <word> in source, or 0 if not found.
            string word = parameters[2].Value;
            string src = parameters[0].Value;
            int pos = src.IndexOf(word, StringComparison.Ordinal);
            string result = (pos + 1).ToString();
            GlobalModules.ScriptTraceDebugLog($"[GETWORDPOS] searching for char(s) [{string.Join(",", word.Select(c => (int)c))}] in source[{string.Join(",", src.Take(8).Select(c => (int)c))}]: found at char pos {pos + 1}\n");
            parameters[1].Value = result;
            return CmdAction.None;
        }

        private static CmdAction CmdGetCharCode(object script, CmdParam[] parameters)
        {
            // CMD: getcharcode <char> var
            if (parameters[0].Value.Length > 0)
                parameters[1].Value = ((int)parameters[0].Value[0]).ToString();
            else
                parameters[1].Value = "0";
            return CmdAction.None;
        }

        private static CmdAction CmdMergeText(object script, CmdParam[] parameters)
        {
            // CMD: mergetext <text1> <text2> [var]
            string src0Name = (parameters[0] is VarParam mv0) ? $"${mv0.Name}@{mv0.GetHashCode():X8}"
                : (parameters[0] is ProgVarParam mp0) ? $"PV:{mp0.Name}" : "const";
            string src1Name = (parameters.Length > 1) ? ((parameters[1] is VarParam mv1) ? $"${mv1.Name}@{mv1.GetHashCode():X8}"
                : (parameters[1] is ProgVarParam mp1) ? $"PV:{mp1.Name}" : "const") : "-";
            string src0Val = parameters[0].Value;
            string src1Val = parameters.Length > 1 ? parameters[1].Value : "";
            string result = src0Val + src1Val;
            string dstName = "-";
            if (parameters.Length > 2)
            {
                dstName = (parameters[2] is VarParam mv2) ? $"${mv2.Name}@{mv2.GetHashCode():X8}"
                    : (parameters[2] is ProgVarParam mp2) ? $"PV:{mp2.Name}" : "const";
                parameters[2].Value = result;
            }
            if (GlobalModules.VerboseDebugMode)
                GlobalModules.ScriptTraceDebugLog($"[MERGETEXT] {src0Name}='{src0Val}' + {src1Name}='{src1Val}' → dst={dstName} result='{result}'\n");
            return CmdAction.None;
        }

        private static CmdAction CmdSplitText(object script, CmdParam[] parameters)
        {
            // CMD: splittext <value> var [delimiter]
            string delimiters = parameters.Length > 2 ? parameters[2].Value : string.Empty;
            List<string> parts = Utility.Split(parameters[0].Value, delimiters);

            // Store in array variable
            if (parameters[1] is VarParam varParam)
            {
                varParam.SetArrayFromStrings(parts);
                varParam.Value = parts.Count.ToString();
            }

            return CmdAction.None;
        }

        private static CmdAction CmdCutLengths(object script, CmdParam[] parameters)
        {
            // CMD: cutlengths <value> array <length1,length2,...>
            string[] lengths = parameters[2].Value.Split(',');
            var results = new System.Collections.Generic.List<string>();
            int position = 0;

            foreach (string lenStr in lengths)
            {
                if (position >= parameters[0].Value.Length)
                    break;

                if (int.TryParse(lenStr, out int len))
                {
                    string part = parameters[0].Value.Substring(position,
                        Math.Min(len, parameters[0].Value.Length - position));
                    results.Add(part);
                    position += len;
                }
            }

            if (parameters[1] is VarParam varParam)
            {
                varParam.SetArrayFromStrings(results);
                varParam.Value = results.Count.ToString();
            }

            return CmdAction.None;
        }

        private static IEnumerable<(int Index, string Value)> EnumerateArrayValues(VarParam sourceVar)
        {
            if (sourceVar.ArraySize > 0)
            {
                for (int i = 1; i <= sourceVar.ArraySize; i++)
                {
                    yield return (i, sourceVar.GetIndexVar(new[] { i.ToString() }).Value);
                }
                yield break;
            }

            for (int i = 0; i < sourceVar.Vars.Count; i++)
            {
                string value = sourceVar.Vars[i].Value;
                if (string.Equals(value, "0", StringComparison.Ordinal))
                    yield break;

                yield return (i + 1, value);
            }
        }

        private static CmdAction CmdFind(object script, CmdParam[] parameters)
        {
            // CMD: find <array> <value> <index> [start]
            if (parameters[0] is not VarParam sourceVar)
                return CmdAction.None;

            int start = parameters.Length > 3 ? int.TryParse(parameters[3].Value, out int parsedStart) ? parsedStart : 1 : 1;
            parameters[2].DecValue = 0;

            int lastIndex = 0;
            foreach (var (index, value) in EnumerateArrayValues(sourceVar))
            {
                lastIndex = index;
                if (!string.Equals(value, "0", StringComparison.Ordinal) &&
                    value.IndexOf(parameters[1].Value, StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    if (start > 1)
                    {
                        start--;
                    }
                    else if (parameters[2].DecValue == 0)
                    {
                        parameters[2].DecValue = index;
                    }
                }
            }

            parameters[0].DecValue = lastIndex;
            return CmdAction.None;
        }

        private static CmdAction CmdFindAll(object script, CmdParam[] parameters)
        {
            // CMD: findall <array> <foundArray> <search>
            if (parameters[0] is not VarParam sourceVar)
                return CmdAction.None;

            var matches = new System.Collections.Generic.List<string>();
            foreach (var (_, value) in EnumerateArrayValues(sourceVar))
            {
                if (!string.Equals(value, "0", StringComparison.Ordinal) &&
                    value.IndexOf(parameters[2].Value, StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    matches.Add(value);
                }
            }

            if (parameters[1] is VarParam varParam)
            {
                varParam.SetArrayFromStrings(matches);
                varParam.Value = matches.Count.ToString();
            }

            return CmdAction.None;
        }

        private static CmdAction CmdFormat(object script, CmdParam[] parameters)
        {
            // CMD: format inputVar outputVar CONSTANT
            string format = parameters[2].Value.ToUpperInvariant();

            if (format == "CURRENCY")
            {
                parameters[1].Value = parameters[0].DecValue.ToString("C2");
            }
            else if (format == "NUMBER")
            {
                string source = parameters[0].Value;
                if (double.TryParse(source, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out double numberValue) ||
                    double.TryParse(source, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.CurrentCulture, out numberValue))
                {
                    bool isWholeNumber = Math.Abs(numberValue % 1d) < 0.0000001d;
                    parameters[1].Value = isWholeNumber
                        ? numberValue.ToString("#,0", CultureInfo.InvariantCulture)
                        : numberValue.ToString("#,0.################", CultureInfo.InvariantCulture);
                }
                else
                {
                    parameters[1].Value = source;
                }
            }
            else if (format == "DATE")
            {
                if (double.TryParse(parameters[0].Value, out double dateValue))
                {
                    DateTime date = DateTime.FromOADate(dateValue);
                    parameters[1].Value = date.ToShortDateString();
                }
            }
            else if (format == "TIME")
            {
                if (double.TryParse(parameters[0].Value, out double timeValue))
                {
                    DateTime time = DateTime.FromOADate(timeValue);
                    parameters[1].Value = ScriptTimeFormatter.Format(time);
                }
            }

            return CmdAction.None;
        }

        private static CmdAction CmdStripANSI(object script, CmdParam[] parameters)
        {
            // CMD: stripansi var <value>
            parameters[0].Value = AnsiCodes.StripANSI(parameters[1].Value);
            return CmdAction.None;
        }

        #endregion

        #region Control Flow Commands

        private static CmdAction CmdGoto(object script, CmdParam[] parameters)
        {
            // CMD: goto <label>
            if (script is Script scriptObj)
            {
                scriptObj.GotoLabel(parameters[0].Value);
            }
            return CmdAction.None;
        }

        private static CmdAction CmdGosub(object script, CmdParam[] parameters)
        {
            // CMD: gosub <label>
            if (script is Script scriptObj)
            {
                string labelName = parameters[0].Value;
                if (!string.IsNullOrWhiteSpace(labelName) && labelName != "0")
                    scriptObj.Gosub(labelName);
            }
            return CmdAction.None;
        }

        private static CmdAction CmdReturn(object script, CmdParam[] parameters)
        {
            // CMD: return
            // Handled by Script.cs - PopStack method
            return CmdAction.None;
        }

        private static CmdAction CmdBranch(object script, CmdParam[] parameters)
        {
            // CMD: branch <value> <label>
            // if <value> != 1, goto <label>
            if (script is Script scriptObj)
            {
                bool shouldBranch = !(parameters[0].DecValue == 1 || Math.Round(parameters[0].DecValue) == 1);
                GlobalModules.ScriptTraceDebugLog($"[BRANCH] cond='{parameters[0].Value}' target='{parameters[1].Value}' willJump={shouldBranch} subDepth={scriptObj.SubStackDepth}\n");
                if (shouldBranch)
                    scriptObj.GotoLabel(parameters[1].Value);
            }
            return CmdAction.None;
        }

        private static CmdAction CmdHalt(object script, CmdParam[] parameters)
        {
            // CMD: halt
            return CmdAction.Stop;
        }

        private static CmdAction CmdPause(object script, CmdParam[] parameters)
        {
            // CMD: pause
            GlobalModules.TriggerDebugLog($"[PAUSE] pause command executed\n");
            return CmdAction.Pause;
        }

        #endregion

        #region I/O Commands

        private static CmdAction CmdEcho(object script, CmdParam[] parameters)
        {
            // CMD: echo <values...>
            string output = string.Empty;
            foreach (var param in parameters)
                output += param.Value;

            // Replace lone CR with CRLF to prevent terminal display issues
            output = output.Replace("\r", "\r\n");

            // Match Pascal TWX behavior: ECHO goes to deaf clients too so
            // interactive bot menus can temporarily mute server traffic
            // without hiding their own UI.
            if (GlobalModules.TWXServer != null)
            {
                GlobalModules.TWXServer.Broadcast(output, broadcastDeaf: true);
            }
            else
            {
                // Fallback to console if server not available
                Console.WriteLine(output);
            }

            return CmdAction.None;
        }

        private static CmdAction CmdEchoEx(object script, CmdParam[] parameters)
        {
            // CMD: echoex <values...>
            // Same as ECHO but with CP437 (DOS) encoding support for extended ASCII characters
            string output = string.Empty;
            foreach (var param in parameters)
                output += param.Value;

            // Replace lone CR with CRLF to prevent terminal display issues
            output = output.Replace("\r", "\r\n");

            // Match Pascal TWX behavior: ECHOEX also reaches deaf clients.
            if (GlobalModules.TWXServer != null)
            {
                GlobalModules.TWXServer.Broadcast(output, broadcastDeaf: true);
            }
            else
            {
                // Fallback to console if server not available
                Console.WriteLine(output);
            }

            return CmdAction.None;
        }

        private static CmdAction CmdDiagLog(object script, CmdParam[] parameters)
        {
            // CMD: diaglog <values...>
            // Writes directly to the debug log with a [DIAGLOG] tag regardless of VerboseDebugMode.
            // Use in scripts for targeted diagnostic output that won't appear in the terminal.
            // Example: diaglog "MCIC=" $MCIC " HTTYPY=" $HTTYPY " EREHOR=" $EREHOR
            string output = string.Empty;
            foreach (var param in parameters)
                output += param.Value;
            GlobalModules.DebugLog($"[DIAGLOG] {output}\n");
            return CmdAction.None;
        }

        private static CmdAction CmdDiagMode(object script, CmdParam[] parameters)
        {
            // CMD: diagmode <on|off>
            // Toggles DiagnoseMode at runtime, enabling/disabling [CMP] comparison logging.
            string val = parameters[0].Value.Trim().ToLowerInvariant();
            GlobalModules.DiagnoseMode = val == "on" || val == "1" || val == "true";
            GlobalModules.DebugLog($"[DIAGMODE] DiagnoseMode = {GlobalModules.DiagnoseMode}\n");
            return CmdAction.None;
        }

        private static CmdAction CmdSend(object script, CmdParam[] parameters)
        {
            // CMD: send <values...>
            // Send text directly to the game server (bypassing normal input processing)
            string output = string.Empty;
            foreach (var param in parameters)
                output += param.Value;

            // Pascal TWX sends the compiled text exactly as serialized in bytecode.
            // Source '*' characters are already converted to carriage returns (#13) by
            // the compiler, so we must not expand them to CRLF here.

            if (GlobalModules.VerboseDebugMode)
                GlobalModules.DebugLog($"[SEND] Output: '{output.Replace("\r", "\\r").Replace("\n", "\\n")}'\n");

            // Send to game server via GameInstance (which acts as the client)
            if (_activeGameInstance != null)
            {
                if (GlobalModules.VerboseDebugMode)
                    Console.WriteLine($"[SEND] GameInstance available, IsConnected: {_activeGameInstance.IsConnected}");

                if (!_activeGameInstance.IsConnected)
                {
                    if (GlobalModules.VerboseDebugMode)
                        Console.WriteLine($"[SEND] Not connected to server - command ignored");
                    GlobalModules.DebugLog($"[SEND] Not connected to server - command ignored\n");
                    return CmdAction.None;
                }

                byte[] data = System.Text.Encoding.Latin1.GetBytes(output);

                if (GlobalModules.VerboseDebugMode)
                {
                    Console.WriteLine($"[SEND] Sending {data.Length} bytes to server");
                    GlobalModules.DebugLog($"[SEND] Sending {data.Length} bytes to server\n");
                }

                _activeGameInstance.ObserveScriptSend(output);
                if (script is Script activeScript)
                    activeScript.MarkExecutionWatchdogActivity();

                // SendToServerAsync preserves order through the shared async socket pump.
                _activeGameInstance.SendToServerAsync(data).GetAwaiter().GetResult();
            }
            else
            {
                // If no active game instance, log warning
                if (GlobalModules.VerboseDebugMode)
                    Console.WriteLine($"[SEND] Cannot send '{output}' - no active game connection");
                GlobalModules.DebugLog($"[SEND] Cannot send '{output}' - no active game connection\n");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdClientMessage(object script, CmdParam[] parameters)
        {
            // CMD: clientmessage <value>
            // Send a message to the local client only (not broadcast to all)
            string message = parameters[0].Value;
            GlobalModules.DebugLog($"[CLIENTMESSAGE] '{message.Replace("\r", "\\r").Replace("\n", "\\n").Replace("\x1b", "ESC")}'\n");

            if (GlobalModules.TWXServer != null)
            {
                GlobalModules.TWXServer.ClientMessage(message);
            }
            else
            {
                // Fallback to console if server not available
                Console.WriteLine($"[Client Message] {message}");
            }

            return CmdAction.None;
        }

        #endregion

        #region File Commands

        private static CmdAction CmdFileExists(object script, CmdParam[] parameters)
        {
            // CMD: fileexists var <filename>
            string raw = parameters[1].Value;
            string path = Utility.ResolvePlatformPath(raw, GlobalModules.ProgramDir);
            string? resolved = Utility.ResolveExistingFilePath(raw, GlobalModules.ProgramDir);
            bool found = resolved != null;
            GlobalModules.DebugLog($"[FILEEXISTS] '{raw}' -> '{(resolved ?? path)}' => {(found ? "1" : "0")}\n");
            parameters[0].Value = found ? "1" : "0";
            return CmdAction.None;
        }

        private static CmdAction CmdDirExists(object script, CmdParam[] parameters)
        {
            // CMD: direxists var <dirname>
            string raw = parameters[1].Value;
            string path = Utility.ResolvePlatformPath(raw, GlobalModules.ProgramDir);
            string? resolved = Utility.ResolveExistingDirectoryPath(raw, GlobalModules.ProgramDir);
            bool found = resolved != null;
            GlobalModules.DebugLog($"[DIREXISTS] '{raw}' -> '{(resolved ?? path)}' => {(found ? "1" : "0")}\n");
            parameters[0].Value = found ? "1" : "0";
            return CmdAction.None;
        }

        private static CmdAction CmdDelete(object script, CmdParam[] parameters)
        {
            // CMD: delete <filename>
            string raw = parameters[0].Value;
            if (!raw.StartsWith(".."))
            {
                try
                {
                    string? filename = Utility.ResolveExistingFilePath(raw, GlobalModules.ProgramDir);
                    if (!string.IsNullOrWhiteSpace(filename))
                        File.Delete(filename);
                }
                catch
                {
                    // Ignore errors
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdRename(object script, CmdParam[] parameters)
        {
            // CMD: rename <oldname> <newname>
            try
            {
                string source = Utility.ResolveExistingFilePath(parameters[0].Value, GlobalModules.ProgramDir)
                    ?? Utility.ResolvePlatformPath(parameters[0].Value, GlobalModules.ProgramDir);
                string destination = Utility.ResolvePlatformPath(parameters[1].Value, GlobalModules.ProgramDir);
                string? directory = Path.GetDirectoryName(destination);
                if (!string.IsNullOrWhiteSpace(directory))
                    Directory.CreateDirectory(directory);
                File.Move(source, destination);
            }
            catch
            {
                // Ignore errors
            }
            return CmdAction.None;
        }

        private static CmdAction CmdRead(object script, CmdParam[] parameters)
        {
            // CMD: read <filename> var <linenum>
            // Pascal TWX returns "EOF" when line number is past end of file or file doesn't exist.
            // This is the sentinel used by while ($var <> "EOF") loops.
            try
            {
                string path = Utility.ResolveExistingFilePath(parameters[0].Value, GlobalModules.ProgramDir)
                    ?? Utility.ResolvePlatformPath(parameters[0].Value, GlobalModules.ProgramDir);
                // TWX script file I/O is byte-oriented legacy text. Latin1 keeps
                // high bytes intact so DOS ANSI/CP437 art survives READ.
                string[] lines = File.ReadAllLines(path, System.Text.Encoding.Latin1);
                int lineNum = (int)parameters[2].DecValue;

                if (lineNum >= 1 && lineNum <= lines.Length)
                    parameters[1].Value = lines[lineNum - 1];
                else
                    parameters[1].Value = "EOF";
            }
            catch
            {
                parameters[1].Value = "EOF";
            }
            return CmdAction.None;
        }

        private static CmdAction CmdWrite(object script, CmdParam[] parameters)
        {
            // CMD: write <filename> <text>
            try
            {
                string path = Utility.ResolvePlatformPath(parameters[0].Value, GlobalModules.ProgramDir);
                string? directory = Path.GetDirectoryName(path);
                if (!string.IsNullOrWhiteSpace(directory))
                    Directory.CreateDirectory(directory);
                File.AppendAllText(path, parameters[1].Value + Environment.NewLine);
            }
            catch
            {
                // Ignore errors
            }
            return CmdAction.None;
        }

        private static CmdAction CmdReadToArray(object script, CmdParam[] parameters)
        {
            // CMD: readtoarray <filename> var
            try
            {
                string path = Utility.ResolveExistingFilePath(parameters[0].Value, GlobalModules.ProgramDir)
                    ?? Utility.ResolvePlatformPath(parameters[0].Value, GlobalModules.ProgramDir);
                // Preserve legacy high bytes for scripts that load ANSI/CP437 files.
                string[] lines = File.ReadAllLines(path, System.Text.Encoding.Latin1);
                if (parameters[1] is VarParam varParam)
                {
                    varParam.SetArrayFromStrings(lines.ToList());
                    varParam.Value = lines.Length.ToString();
                }
            }
            catch
            {
                // Error - set empty array
                if (parameters[1] is VarParam varParam)
                {
                    varParam.SetArrayFromStrings(new System.Collections.Generic.List<string>());
                    varParam.Value = "0";
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdGetFileList(object script, CmdParam[] parameters)
        {
            // CMD: getfilelist varArray <fileMask>
            string mask = parameters.Length > 1 ? parameters[1].Value.Replace('\r', '*') : "*";
            string resolvedMask = Utility.ResolvePlatformPath(mask, GlobalModules.ProgramDir);
            string directory = Path.GetDirectoryName(resolvedMask) ?? GlobalModules.ProgramDir;
            directory = Utility.ResolveExistingDirectoryPath(directory) ?? directory;
            string fileMask = Path.GetFileName(resolvedMask);
            if (string.IsNullOrWhiteSpace(fileMask))
                fileMask = "*";

            try
            {
                string[] files = Directory.GetFiles(directory, fileMask)
                    .Select(Path.GetFileName)
                    .Where(f => !string.IsNullOrEmpty(f))
                    .Cast<string>()
                    .ToArray();

                if (parameters[0] is VarParam varParam)
                {
                    varParam.SetArrayFromStrings(files.ToList());
                    varParam.Value = files.Length.ToString();
                }
            }
            catch
            {
                if (parameters[0] is VarParam varParam)
                {
                    varParam.SetArrayFromStrings(new System.Collections.Generic.List<string>());
                    varParam.Value = "0";
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdGetDirList(object script, CmdParam[] parameters)
        {
            // CMD: getdirlist varArray <path> <fileMask>
            string directory = Utility.ResolvePlatformPath(parameters.Length > 1 ? parameters[1].Value : ".", GlobalModules.ProgramDir);
            directory = Utility.ResolveExistingDirectoryPath(directory) ?? directory;
            string mask = parameters.Length > 2 ? parameters[2].Value.Replace('\r', '*') : "*";

            try
            {
                string[] dirs = Directory.GetDirectories(directory, mask)
                    .Select(Path.GetFileName)
                    .Where(d => !string.IsNullOrEmpty(d) && d != "." && d != "..")
                    .Cast<string>()
                    .ToArray();

                if (parameters[0] is VarParam varParam)
                {
                    varParam.SetArrayFromStrings(dirs.ToList());
                    varParam.Value = dirs.Length.ToString();
                }
            }
            catch
            {
                if (parameters[0] is VarParam varParam)
                {
                    varParam.SetArrayFromStrings(new System.Collections.Generic.List<string>());
                    varParam.Value = "0";
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdMakeDir(object script, CmdParam[] parameters)
        {
            // CMD: makedir <dirname>
            try
            {
                string path = Utility.ResolvePlatformPath(parameters[0].Value, GlobalModules.ProgramDir);
                Directory.CreateDirectory(path);
            }
            catch
            {
                // Ignore errors
            }
            return CmdAction.None;
        }

        private static CmdAction CmdRemoveDir(object script, CmdParam[] parameters)
        {
            // CMD: removedir <dirname>
            try
            {
                string? path = Utility.ResolveExistingDirectoryPath(parameters[0].Value, GlobalModules.ProgramDir);
                if (!string.IsNullOrWhiteSpace(path))
                    Directory.Delete(path);
            }
            catch
            {
                // Ignore errors
            }
            return CmdAction.None;
        }

        #endregion

        #region Array Commands

        private static CmdAction CmdSetArray(object script, CmdParam[] parameters)
        {
            return CmdSetArray_Impl(script, parameters);
        }

        private static CmdAction CmdSort(object script, CmdParam[] parameters)
        {
            return CmdSort_Impl(script, parameters);
        }

        #endregion

        #region Utility Commands

        private static CmdAction CmdGetDate(object script, CmdParam[] parameters)
        {
            // CMD: getdate var
            parameters[0].Value = DateTime.Now.ToShortDateString();
            return CmdAction.None;
        }

        private static CmdAction CmdGetTime(object script, CmdParam[] parameters)
        {
            // CMD: gettime var [format]
            if (parameters.Length > 1)
            {
                try
                {
                    parameters[0].Value = FormatTwxTime(DateTime.Now, parameters[1].Value);
                }
                catch
                {
                    parameters[0].Value = ScriptTimeFormatter.Format(DateTime.Now);
                }
            }
            else
            {
                parameters[0].Value = ScriptTimeFormatter.Format(DateTime.Now);
            }
            return CmdAction.None;
        }

        private static CmdAction CmdGetTimer(object script, CmdParam[] parameters)
        {
            // CMD: gettimer var
            parameters[0].Value = Environment.TickCount.ToString();
            return CmdAction.None;
        }

        private static CmdAction CmdGetRnd(object script, CmdParam[] parameters)
        {
            // CMD: getrnd var <min> <max>
            int min = (int)parameters[1].DecValue;
            int max = (int)parameters[2].DecValue;
            parameters[0].Value = new Random().Next(min, max + 1).ToString();
            return CmdAction.None;
        }

        private static CmdAction CmdSetPrecision(object script, CmdParam[] parameters)
        {
            // CMD: setprecision <digits>
            // Sets the decimal precision for numeric operations in the script
            if (script is Script scriptObj)
            {
                if (int.TryParse(parameters[0].Value, out int precision))
                {
                    scriptObj.DecimalPrecision = precision;
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSound(object script, CmdParam[] parameters)
        {
            // CMD: sound <filename>
            // Plays a sound file (platform-specific implementation needed)
            // Note: Windows PlaySound API is not available in .NET cross-platform
            // Could use System.Media.SoundPlayer on Windows or platform-specific APIs
            string filename = parameters[0].Value;
            Console.WriteLine($"[Sound] {filename}");
            // TODO: Implement cross-platform audio playback
            return CmdAction.None;
        }

        private static CmdAction CmdLogging(object script, CmdParam[] parameters)
        {
            // CMD: logging <on/off>
            // Enables or disables logging functionality
            bool enabled = false;
            string value = parameters[0].Value.ToUpperInvariant();
            enabled = (value == "ON" || value == "1");

            if (GlobalModules.TWXLog is IModLog log)
            {
                if (script is Script scriptObj)
                {
                    log.SetScriptLoggingEnabled(scriptObj, enabled);
                }
                else
                {
                    log.LogData = enabled;
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdWaitFor(object script, CmdParam[] parameters)
        {
            // CMD: waitfor <text>
            // Pascal behavior: store wait text, mark wait active, and return Pause.
            if (script is Script scriptObj)
            {
                scriptObj.WaitText = parameters[0].Value;
                scriptObj.WaitForActive = true;
            }
            return CmdAction.Pause;
        }

        private static CmdAction CmdWaitOn(object script, CmdParam[] parameters)
        {
            // Extended compatibility command in C#; Pascal handles WAITON at compile-time as a macro.
            // Route through WAITFOR logic so runtime behavior cannot diverge.
            return CmdWaitFor(script, parameters);
        }

        private static CmdAction CmdGetInput(object script, CmdParam[] parameters)
        {
            // CMD: getinput var <prompt>
            // Displays a prompt and waits for user input from the client
            GlobalModules.DebugLog($"[GETINPUT] params={parameters.Length} var='{parameters[0].Value}' prompt='{(parameters.Length > 1 ? parameters[1].Value : "")}'\n");

            if (script is Script scriptObj)
            {
                string prompt = parameters.Length > 1 ? parameters[1].Value : "";

                // Send prompt to client via active game instance
                if (_activeGameInstance != null)
                {
                    GlobalModules.TWXMenu?.SuspendMenuForInput(clearDisplay: false);

                    // Clear any accumulated input before prompting
                    _activeGameInstance.ClearInputBuffer();

                    // Empty prompt = keypress mode: no Enter needed, fire on the next single character.
                    bool keypressMode = string.IsNullOrEmpty(prompt);

                    // Set script to wait for input from client
                    scriptObj.SetWaitingForInput(parameters[0], keypressMode);
                    scriptObj.PausedReason = PauseReason.Input;

                    // Match the classic TWX script-input menu: prompt text above a
                    // visible input marker, rather than leaving the line hanging.
                    QueueScriptInputPrompt(prompt);
                    return CmdAction.Pause; // Pause until input received from client
                }
                else if (GlobalModules.TWXMenu != null)
                {
                    GlobalModules.TWXMenu.SuspendMenuForInput(clearDisplay: false);

                    // Fallback to UI mode if no game instance
                    QueueScriptInputPrompt(prompt);

                    scriptObj.Locked = true;
                    GlobalModules.TWXMenu.BeginScriptInput(scriptObj, parameters[0], false);
                    scriptObj.PausedReason = PauseReason.Input;

                    return CmdAction.Pause;
                }
                else
                {
                    GlobalModules.TWXServer?.ClientMessage($"[GETINPUT] Using Console Mode (fallback)\r\n");

                    // Pure console test mode (TestScriptLoader)
                    Console.WriteLine($"\n[GETINPUT Console Mode] Prompting: {prompt}");
                    Console.Write(prompt);
                    string input = Console.ReadLine() ?? string.Empty;
                    Console.WriteLine($"[GETINPUT Console Mode] Received: '{input}'");
                    parameters[0].Value = input;

                    return CmdAction.None;
                }
            }

            Console.WriteLine($"[GETINPUT] Script is not Script object - returning None");
            GlobalModules.TWXServer?.ClientMessage($"[GETINPUT] Script is not Script object - returning None\r\n");
            return CmdAction.None;
        }

        private static CmdAction CmdGetConsoleInput(object script, CmdParam[] parameters)
        {
            // CMD: getconsoleinput var [singleKey?]
            // Gets input from the local telnet client (singleKey=true → no Enter required).
            // In network proxy mode this behaves identically to getInput so it flows
            // through the same SetWaitingForInput → LocalDataReceived → LocalInputEvent path.
            if (script is Script scriptObj)
            {
                bool singleKey = parameters.Length == 2;

                GlobalModules.DebugLog($"[GETCONSOLEINPUT] var='{parameters[0].Value}' singleKey={singleKey} hasNetwork={_activeGameInstance != null}\n");

                if (_activeGameInstance != null)
                {
                    // Network proxy mode: TWX27 routes GETCONSOLEINPUT through
                    // the internal script-input menu, not the GETINPUT prompt
                    // broadcast path. The local input pipeline already captures
                    // the next key/line here; scripts like ProEZcolonizer draw
                    // their own screen before entering this wait.
                    GlobalModules.TWXMenu?.SuspendMenuForInput(clearDisplay: false);
                    _activeGameInstance.ClearInputBuffer();
                    scriptObj.SetWaitingForInput(parameters[0], singleKey, echoKeypressInput: false);
                    scriptObj.PausedReason = PauseReason.Input;
                    return CmdAction.Pause;
                }

                // Fallback: UI / console mode (original desktop TWX behaviour)
                scriptObj.Locked = true;
                GlobalModules.TWXMenu?.SuspendMenuForInput(clearDisplay: false);

                if (GlobalModules.TWXMenu != null)
                {
                    GlobalModules.TWXMenu.BeginScriptInput(scriptObj, parameters[0], singleKey);
                }
                else
                {
                    TwxRuntimeContext context = GlobalModules.CurrentContext;
                    Task.Run(() =>
                    {
                        using var _ = GlobalModules.UseRuntimeContext(context);
                        string inputText;
                        if (singleKey)
                        {
                            var key = Console.ReadKey(true);
                            inputText = key.KeyChar.ToString();
                        }
                        else
                        {
                            inputText = Console.ReadLine() ?? string.Empty;
                        }
                        scriptObj.InputCompleted(inputText, parameters[0]);
                    });
                }
            }
            return CmdAction.Pause;
        }

        private static CmdAction CmdGetOutText(object script, CmdParam[] parameters)
        {
            // CMD: getouttext var
            // Retrieves the last output text processed by the script
            if (script is Script scriptObj)
            {
                string outVal = scriptObj.OutText;
                GlobalModules.DebugLog($"[GETOUTTEXT] outText='{outVal}' (len={outVal.Length}) → param\n");
                parameters[0].Value = outVal;
            }
            else
            {
                parameters[0].Value = string.Empty;
            }
            return CmdAction.None;
        }

        #endregion

        #region Trigger Commands

        private static CmdAction CmdSetTextTrigger(object script, CmdParam[] parameters)
        {
            return CmdSetTextTrigger_Impl(script, parameters);
        }

        private static CmdAction CmdSetTextLineTrigger(object script, CmdParam[] parameters)
        {
            return CmdSetTextLineTrigger_Impl(script, parameters);
        }

        private static CmdAction CmdSetTextOutTrigger(object script, CmdParam[] parameters)
        {
            return CmdSetTextOutTrigger_Impl(script, parameters);
        }

        private static CmdAction CmdSetDelayTrigger(object script, CmdParam[] parameters)
        {
            return CmdSetDelayTrigger_Impl(script, parameters);
        }

        private static CmdAction CmdSetEventTrigger(object script, CmdParam[] parameters)
        {
            return CmdSetEventTrigger_Impl(script, parameters);
        }

        private static CmdAction CmdSetAutoTrigger(object script, CmdParam[] parameters)
        {
            return CmdSetAutoTrigger_Impl(script, parameters);
        }

        private static CmdAction CmdKillTrigger(object script, CmdParam[] parameters)
        {
            return CmdKillTrigger_Impl(script, parameters);
        }

        private static CmdAction CmdKillAllTriggers(object script, CmdParam[] parameters)
        {
            return CmdKillAllTriggers_Impl(script, parameters);
        }

        private static CmdAction CmdStartTimer(object script, CmdParam[] parameters)
        {
            // CMD: starttimer <name>
            // Create or reset a timer with the given name
            string timerName = (parameters[0] is VarParam varParam) ? varParam.Name : parameters[0].Value;

            // Search for existing timer and remove if found
            for (int i = GlobalModules.TWXTimers.Count - 1; i >= 0; i--)
            {
                if (GlobalModules.TWXTimers[i].Name == timerName)
                {
                    GlobalModules.TWXTimers.RemoveAt(i);
                    break;
                }
            }

            // Add new timer with current timestamp
            GlobalModules.TWXTimers.Add(new TimerItem(timerName));

            return CmdAction.None;
        }

        private static CmdAction CmdStopTimer(object script, CmdParam[] parameters)
        {
            // CMD: stoptimer <name>
            // Stop a timer and return elapsed time in milliseconds
            string timerName = (parameters[0] is VarParam varParam) ? varParam.Name : parameters[0].Value;

            parameters[0].DecValue = 0;

            // Search for the timer
            for (int i = GlobalModules.TWXTimers.Count - 1; i >= 0; i--)
            {
                if (GlobalModules.TWXTimers[i].Name == timerName)
                {
                    // Calculate elapsed time in milliseconds
                    long endTime = Stopwatch.GetTimestamp();
                    long frequency = Stopwatch.Frequency;
                    long startTime = GlobalModules.TWXTimers[i].StartTime;

                    double elapsedMs = ((endTime - startTime) / (double)frequency) * 1000.0;
                    parameters[0].DecValue = elapsedMs;

                    // Remove the timer
                    GlobalModules.TWXTimers.RemoveAt(i);
                    break;
                }
            }

            return CmdAction.None;
        }

        #endregion

        #region Script Management Commands

        private static CmdAction CmdLoad(object script, CmdParam[] parameters)
        {
            // CMD: load <script>
            return CmdLoadScript_Impl(script, parameters);
        }

        private static CmdAction CmdStop(object script, CmdParam[] parameters)
        {
            // CMD: stop <script>
            return CmdUnloadScript_Impl(script, parameters);
        }

        private static CmdAction CmdStopAll(object script, CmdParam[] parameters)
        {
            // CMD: stopall [exceptSystem]
            // Stop all running scripts
            // If parameter provided and non-zero, also stop system scripts (not currently used)
            return CmdStopAllScripts_Impl(script, parameters);
        }

        private static CmdAction CmdSystemScript(object script, CmdParam[] parameters)
        {
            // CMD: systemscript
            // Mark script as a system script (won't be stopped by STOPALL unless explicitly requested)
            if (script is Script scriptInstance)
            {
                scriptInstance.System = true;
            }
            return CmdAction.None;
        }

        private static CmdAction CmdListActiveScripts(object script, CmdParam[] parameters)
        {
            // CMD: listactivescripts var
            return CmdGetLoadedScripts_Impl(script, parameters);
        }

        private static CmdAction CmdGetScriptVersion(object script, CmdParam[] parameters)
        {
            // CMD: getscriptversion <script> var
            string filename = Utility.ResolveExistingFilePath(parameters[0].Value, GlobalModules.ProgramDir)
                ?? Utility.ResolvePlatformPath(parameters[0].Value, GlobalModules.ProgramDir);

            if (!File.Exists(filename))
            {
                throw new ScriptException($"File '{filename}' not found");
            }

            try
            {
                using (var fs = new FileStream(filename, FileMode.Open, FileAccess.Read))
                using (var reader = new BinaryReader(fs))
                {
                    // Read header: 10-byte program name + 2-byte version
                    byte[] nameBytes = reader.ReadBytes(10);
                    string programName = System.Text.Encoding.ASCII.GetString(nameBytes).TrimEnd('\0');

                    if (programName != "TWX SCRIPT")
                    {
                        throw new ScriptException("File is not a compiled TWX script");
                    }

                    ushort version = reader.ReadUInt16();
                    // Version is stored as an integer (e.g., 206 for v2.06)
                    int major = version / 100;
                    int minor = version % 100;
                    parameters[1].Value = $"{major}.{minor:D2}";
                }
            }
            catch (ScriptException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new ScriptException($"Error reading script file: {ex.Message}");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdLabelExists(object script, CmdParam[] parameters)
        {
            // CMD: labelexists var <label>
            if (script is Script scriptObj)
            {
                parameters[0].Value = scriptObj.LabelExists(parameters[1].Value) ? "1" : "0";
            }
            else
            {
                parameters[0].Value = "0";
            }
            return CmdAction.None;
        }

        private static CmdAction CmdReqRecording(object script, CmdParam[] parameters)
        {
            // CMD: reqrecording (deprecated - does nothing)
            // This command is deprecated and no longer enforces database recording requirements.
            // Scripts that previously required recording will now run without it.
            return CmdAction.None;
        }

        private static CmdAction CmdReqVersion(object script, CmdParam[] parameters)
        {
            // CMD: reqversion <version>
            // Compare current version with required version
            string currentVersion = Constants.ProgramVersion;
            string requiredVersion = parameters[0].Value;

            // Convert versions to integers for comparison (e.g., "2.06" -> 206)
            int currentVer = ParseVersionToInt(currentVersion);
            int requiredVer = ParseVersionToInt(requiredVersion);

            if (currentVer >= requiredVer)
            {
                return CmdAction.None;
            }
            else
            {
                string message = $"This script requires TWX Proxy version {requiredVersion} or later to run.";
                if (GlobalModules.TWXServer != null)
                {
                    GlobalModules.TWXServer.ClientMessage(message);
                }
                else
                {
                    Console.WriteLine(message);
                }
                return CmdAction.Stop;
            }
        }

        private static int ParseVersionToInt(string version)
        {
            // Remove all dots and parse as integer ("2.6.10" -> 2610)
            string versionDigits = version.Replace(".", "");
            return int.TryParse(versionDigits, out int result) ? result : 0;
        }

        #endregion

        #region Variable Persistence Commands

        private static CmdAction CmdLoadVar(object script, CmdParam[] parameters)
        {
            // CMD: loadvar var
            return CmdLoadVar_Impl(script, parameters);
        }

        private static CmdAction CmdSaveVar(object script, CmdParam[] parameters)
        {
            // CMD: savevar var
            return CmdSaveVar_Impl(script, parameters);
        }

        private static CmdAction CmdLoadGlobal(object script, CmdParam[] parameters)
        {
            // CMD: loadglobal <name>
            return CmdLoadGlobal_Impl(script, parameters);
        }

        private static CmdAction CmdSaveGlobal(object script, CmdParam[] parameters)
        {
            // CMD: saveglobal <name>
            return CmdSaveGlobal_Impl(script, parameters);
        }

        private static CmdAction CmdClearGlobals(object script, CmdParam[] parameters)
        {
            // CMD: clearglobals
            return CmdClearGlobals_Impl(script, parameters);
        }

        private static CmdAction CmdListGlobals(object script, CmdParam[] parameters)
        {
            // CMD: listglobals var <pattern>
            return CmdListGlobals_Impl(script, parameters);
        }

        private static CmdAction CmdSetProgVar(object script, CmdParam[] parameters)
        {
            // CMD: setprogvar <name> <value>
            return CmdSetProgVar_Impl(script, parameters);
        }

        #endregion

        #region Network Commands

        private static CmdAction CmdConnect(object script, CmdParam[] parameters)
        {
            // CMD: connect
            return CmdConnect_Impl(script, parameters);
        }

        private static CmdAction CmdDisconnect(object script, CmdParam[] parameters)
        {
            // CMD: disconnect [disable]
            return CmdDisconnect_Impl(script, parameters);
        }

        private static CmdAction CmdProcessIn(object script, CmdParam[] parameters)
        {
            // CMD: processin <text> <force>
            return CmdProcessIn_Impl(script, parameters);
        }

        private static CmdAction CmdProcessOut(object script, CmdParam[] parameters)
        {
            // CMD: processout <text>
            return CmdProcessOut_Impl(script, parameters);
        }

        private static CmdAction CmdAutoHaggle(object script, CmdParam[] parameters)
        {
            // CMD: autohaggle <on|off>
            return CmdAutoHaggle_Impl(script, parameters);
        }

        private static CmdAction CmdQuikStats(object script, CmdParam[] parameters)
        {
            // CMD: quikstats
            return CmdQuikStats_Impl(script, parameters);
        }

        #endregion

        #region Menu Commands

        private static CmdAction CmdAddMenu(object script, CmdParam[] parameters)
        {
            // CMD: addmenu <parent> <name> <description> <hotkey> <reference> <prompt> <closeMenu>
            // Adds a custom menu item to the menu system
            try
            {
                if (GlobalModules.DebugMode)
                {
                    GlobalModules.DebugLog($"[DEBUG ADDMENU] Params: [{string.Join("], [", parameters.Select(p => p.Value))}]\n");
                }

                if (parameters[3].Value.Length != 1)
                {
                    return CmdAction.None;
                }

                string parent = parameters[0].Value.ToUpper();
                string name = parameters[1].Value.ToUpper();
                string description = parameters[2].Value;
                char hotkey = char.ToUpper(parameters[3].Value[0]);
                string reference = parameters[4].Value;
                string prompt = parameters[5].Value;
                bool closeMenu = parameters[6].Value == "1";

                if (script is Script menuScript &&
                    !string.IsNullOrEmpty(reference) &&
                    reference.StartsWith(':') &&
                    menuScript.Compiler is ScriptCmp cmp)
                {
                    // Menu handlers can be defined inside include namespaces. Qualify
                    // local label refs at addMenu time so later hotkey dispatch from
                    // the root menu context still reaches the include-local handler.
                    cmp.ExtendLabelName(ref reference, menuScript.ExecScript);
                }

                if (GlobalModules.DebugMode)
                {
                    GlobalModules.DebugLog($"[DEBUG ADDMENU] parent='{parent}' name='{name}' desc='{description}' hotkey='{hotkey}' ref='{reference}' prompt='{prompt}' close={closeMenu}\n");
                }

                if (GlobalModules.TWXMenu != null)
                {
                    var menuItem = GlobalModules.TWXMenu.AddCustomMenu(
                        parent, name, description, reference, prompt, hotkey, closeMenu, script);

                    if (script is Script s && menuItem != null)
                    {
                        s.AddMenu(menuItem);
                    }
                }
            }
            catch (Exception ex)
            {
                ScriptDiagnosticOutput.Write($"[AddMenu] Error: {ex.Message}\r\n");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdOpenMenu(object script, CmdParam[] parameters)
        {
            // CMD: openmenu <menu> [pause]
            try
            {
                if (GlobalModules.TWXMenu != null)
                {
                    string menuName = parameters[0].Value.ToUpperInvariant();
                    GlobalModules.DebugLog($"[OpenMenu] Opening menu '{menuName}'...\n");

                    // Pascal TWX exposes certain built-in proxy actions as OPENMENU
                    // targets even though they are not script-defined menus.
                    if (menuName == "TWX_STOPALLFAST")
                    {
                        GlobalModules.TWXServer?.Broadcast("\r\nStopping all non-system scripts\r\n", broadcastDeaf: true);

                        if (GetActiveInterpreter() is ModInterpreter interpreter)
                            interpreter.StopAll(false);

                        return CmdAction.None;
                    }

                    GlobalModules.TWXMenu.OpenMenu(menuName, 0);

                    if (parameters.Length > 1 && parameters[1].Value == "0")
                        return CmdAction.None;

                    if (script is Script s)
                    {
                        s.PausedReason = PauseReason.OpenMenu;
                        s.CompletePendingNonResumingMenuHandler();
                    }

                    return CmdAction.Pause;
                }

                GlobalModules.DebugLog("[OpenMenu] TWXMenu is null; OPENMENU ignored\n");

                return CmdAction.None;
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[OpenMenu] Error: {ex.Message}\n");
                return CmdAction.None;
            }
        }

        private static CmdAction CmdCloseMenu(object script, CmdParam[] parameters)
        {
            // CMD: closemenu
            // Closes the currently open menu
            try
            {
                if (GlobalModules.TWXMenu != null)
                {
                    GlobalModules.TWXMenu.CloseMenu(false);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CloseMenu] Error: {ex.Message}");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSetMenuHelp(object script, CmdParam[] parameters)
        {
            // CMD: setmenuhelp <menu> <help>
            // Sets the help text for a menu item
            try
            {
                string menuName = parameters[0].Value.ToUpper();
                string helpText = parameters[1].Value.Replace("\r", "\r\n");

                if (GlobalModules.TWXMenu != null)
                {
                    var menu = GlobalModules.TWXMenu.GetMenuByName(menuName);
                    if (menu != null)
                    {
                        menu.Help = helpText;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SetMenuHelp] Error: {ex.Message}");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSetMenuValue(object script, CmdParam[] parameters)
        {
            // CMD: setmenuvalue <menu> <value>
            // Sets the value associated with a menu item
            try
            {
                string menuName = parameters[0].Value.ToUpper();
                string value = parameters[1].Value;

                GlobalModules.DebugLog($"[SETMENUVALUE] Menu='{menuName}', Value='{value}'\n");

                if (GlobalModules.TWXMenu != null)
                {
                    var menu = GlobalModules.TWXMenu.GetMenuByName(menuName);
                    if (menu != null)
                    {
                        menu.Value = value;
                    }
                }
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[SetMenuValue] Error: {ex.Message}\n");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdGetMenuValue(object script, CmdParam[] parameters)
        {
            // CMD: getmenuvalue <menu> var
            // Retrieves the value associated with a menu item
            try
            {
                string menuName = parameters[0].Value.ToUpper();

                if (GlobalModules.TWXMenu != null)
                {
                    var menu = GlobalModules.TWXMenu.GetMenuByName(menuName);
                    if (menu != null)
                    {
                        parameters[1].Value = menu.Value;
                    }
                    else
                    {
                        parameters[1].Value = string.Empty;
                    }
                }
                else
                {
                    parameters[1].Value = string.Empty;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetMenuValue] Error: {ex.Message}");
                parameters[1].Value = string.Empty;
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSetMenuOptions(object script, CmdParam[] parameters)
        {
            // CMD: setmenuoptions <menu> <Q> <?> <+>
            // Sets menu option flags (Q=quit, ?=help, +=add)
            try
            {
                if (GlobalModules.DebugMode)
                {
                    GlobalModules.DebugLog($"[DEBUG SETMENUOPTIONS] Params: [{string.Join("], [", parameters.Select(p => p.Value))}]\n");
                }

                string menuName = parameters[0].Value.ToUpper();
                bool optionQ = parameters[1].Value == "1";
                bool optionHelp = parameters[2].Value == "1";
                bool optionPlus = parameters[3].Value == "1";

                if (GlobalModules.DebugMode)
                {
                    GlobalModules.DebugLog($"[DEBUG SETMENUOPTIONS] menu='{menuName}' Q={optionQ} ?={optionHelp} +={optionPlus}\n");
                }

                if (GlobalModules.TWXMenu != null)
                {
                    var menu = GlobalModules.TWXMenu.GetMenuByName(menuName);
                    if (menu != null)
                    {
                        menu.SetOptions(optionQ, optionHelp, optionPlus);
                    }
                }
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[SetMenuOptions] Error: {ex.Message}\n");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSetMenuKey(object script, CmdParam[] parameters)
        {
            // CMD: setmenukey <key>
            // Sets the menu activation key (typically ` or ESC)
            try
            {
                string keyValue = parameters[0].Value;
                if (keyValue.Length > 0)
                {
                    char menuKey = keyValue[0];

                    // Update the menu value if menu system is available
                    if (GlobalModules.TWXMenu != null)
                    {
                        try
                        {
                            var menu = GlobalModules.TWXMenu.GetMenuByName("TWX_MENUKEY");
                            if (menu != null)
                            {
                                menu.Value = menuKey.ToString();
                            }
                        }
                        catch
                        {
                            // Menu might not exist, that's ok
                        }
                    }

                    // TODO: Also need to set TWXExtractor.MenuKey when extractor interface is available
                    Console.WriteLine($"[SetMenuKey] Menu key set to: '{menuKey}'");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SetMenuKey] Error: {ex.Message}");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdKillWindow(object script, CmdParam[] parameters)
        {
            // CMD: killwindow <windowName>
            // Closes and destroys a script window
            try
            {
                string windowName = parameters[0].Value;
                GlobalModules.DebugLog($"[KillWindow] windowName='{windowName}'\n");

                if (script is Script scriptObj)
                {
                    var window = scriptObj.FindWindow(windowName);
                    if (window != null)
                    {
                        scriptObj.RemoveWindow(window);
                        GlobalModules.DebugLog($"[KillWindow] Closed window '{windowName}'\n");
                    }
                    else
                    {
                        GlobalModules.DebugLog($"[KillWindow] Window '{windowName}' not found\n");
                    }
                }
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[KillWindow] Error: {ex.Message}\n");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdWindow(object script, CmdParam[] parameters)
        {
            // CMD: window <windowName> <sizeX> <sizeY> <title> [<onTop>]
            // Creates a new script window with specified dimensions
            try
            {
                string windowName = parameters[0].Value;
                int sizeX = int.TryParse(parameters[1].Value, out int x) ? x : 400;
                int sizeY = int.TryParse(parameters[2].Value, out int y) ? y : 300;
                string title = parameters[3].Value;
                bool onTop = parameters.Length >= 5;
                GlobalModules.DebugLog($"[Window] name='{windowName}' size={sizeX}x{sizeY} title='{title}' onTop={onTop}\n");

                var window = GlobalModules.ScriptWindowFactory.CreateWindow(windowName, title, sizeX, sizeY, onTop);

                if (script is Script scriptObj)
                {
                    scriptObj.AddWindow(window);
                    window.Show();
                    GlobalModules.DebugLog($"[Window] Created window '{windowName}' ({sizeX}x{sizeY}) - '{title}'\n");
                }
                else
                {
                    GlobalModules.DebugLog($"[Window] ERROR: script is not Script type, window not tracked\n");
                }
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[Window] Error: {ex.Message}\n{ex.StackTrace}\n");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSetWindowContents(object script, CmdParam[] parameters)
        {
            // CMD: setwindowcontents <windowName> <text>
            // Updates the text content of a script window
            try
            {
                string windowName = parameters[0].Value;
                string content = parameters[1].Value;

                GlobalModules.DebugLog($"[SetWindowContents] name='{windowName}' contentLen={content.Length}\n");
                if (script is Script scriptObj)
                {
                    var window = scriptObj.FindWindow(windowName);
                    if (window is IScriptWindow sw)
                    {
                        sw.TextContent = content;
                        GlobalModules.DebugLog($"[SetWindowContents] Updated window '{windowName}'\n");
                    }
                    else
                    {
                        GlobalModules.DebugLog($"[SetWindowContents] Window '{windowName}' not found\n");
                    }
                }
            }
            catch (Exception ex)
            {
                GlobalModules.DebugLog($"[SetWindowContents] Error: {ex.Message}\n");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdAddQuickText(object script, CmdParam[] parameters)
        {
            // CMD: addquicktext <search> <replace>
            // Sets user-defined QuickTexts for use with echo and getText
            // search - Text to search for
            // replace - Text to replace found text with
            if (GlobalModules.TWXServer != null)
            {
                string key = parameters[0].Value;
                string value = parameters[1].Value;
                GlobalModules.TWXServer.AddQuickText(key, value);
            }
            return CmdAction.None;
        }

        private static CmdAction CmdClearQuickText(object script, CmdParam[] parameters)
        {
            // CMD: clearquicktext [key]
            // Clears specific quick text by key, or all quick texts if no key provided
            if (GlobalModules.TWXServer != null)
            {
                if (parameters.Length > 0)
                {
                    GlobalModules.TWXServer.ClearQuickText(parameters[0].Value);
                }
                else
                {
                    GlobalModules.TWXServer.ClearQuickText();
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdSaveHelp(object script, CmdParam[] parameters)
        {
            // CMD: savehelp <text> <cmd> <mode> <keywords> <date>
            // Saves help documentation to a file
            try
            {
                string text = parameters[0].Value;
                string cmd = parameters[1].Value;
                string mode = parameters.Length > 2 ? parameters[2].Value : "command";
                string keywords = parameters.Length > 3 ? parameters[3].Value : string.Empty;
                string date = parameters.Length > 4 ? parameters[4].Value : DateTime.Now.ToString("yyyy-MM-dd");

                // Create help directory if it doesn't exist
                string helpDir = Path.Combine(GlobalModules.ProgramDir, "help");
                if (!Directory.Exists(helpDir))
                {
                    Directory.CreateDirectory(helpDir);
                }

                // Create filename from command (sanitize for file system)
                string safeCmd = string.Join("_", cmd.Split(Path.GetInvalidFileNameChars()));
                string helpFile = Path.Combine(helpDir, $"{safeCmd}.txt");

                // Write help file with structured format
                using (var writer = new StreamWriter(helpFile, false, System.Text.Encoding.UTF8))
                {
                    writer.WriteLine($"Command: {cmd}");
                    writer.WriteLine($"Mode: {mode}");
                    writer.WriteLine($"Keywords: {keywords}");
                    writer.WriteLine($"Last Updated: {date}");
                    writer.WriteLine();
                    writer.WriteLine("Description:");
                    writer.WriteLine("============");
                    writer.WriteLine(text);
                }

                Console.WriteLine($"[SaveHelp] Saved help for command '{cmd}' to {helpFile}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SaveHelp] Error: {ex.Message}");
            }
            return CmdAction.None;
        }

        #endregion

        #region Database Commands

        private static CmdAction CmdGetSector(object script, CmdParam[] parameters)
        {
            // CMD: getsector <sectorNum> var
            return CmdGetSector_Impl(script, parameters);
        }

        private static CmdAction CmdGetSectorParameter(object script, CmdParam[] parameters)
        {
            // CMD: getsectorparameter <sector> <param> var
            return CmdGetSectorParameter_Impl(script, parameters);
        }

        private static CmdAction CmdSetSectorParameter(object script, CmdParam[] parameters)
        {
            // CMD: setsectorparameter <sector> <param> <value>
            return CmdSetSectorParameter_Impl(script, parameters);
        }

        private static CmdAction CmdListSectorParameters(object script, CmdParam[] parameters)
        {
            // CMD: listsectorparameters <sector> var
            return CmdListSectorParameters_Impl(script, parameters);
        }

        private static CmdAction CmdGetCourse(object script, CmdParam[] parameters)
        {
            // CMD: getcourse var <from> <to>
            return CmdGetCourse_Impl(script, parameters);
        }

        private static CmdAction CmdGetCourses(object script, CmdParam[] parameters)
        {
            // CMD: getcourses var <from> <to>
            return CmdGetCourses_Impl(script, parameters);
        }

        private static CmdAction CmdGetDistance(object script, CmdParam[] parameters)
        {
            // CMD: getdistance var <from> <to>
            return CmdGetDistance_Impl(script, parameters);
        }

        private static CmdAction CmdGetAllCourses(object script, CmdParam[] parameters)
        {
            // CMD: getallcourses var <sector>
            return CmdGetAllCourses_Impl(script, parameters);
        }

        private static CmdAction CmdGetNearestWarps(object script, CmdParam[] parameters)
        {
            // CMD: getnearestwarps var <sector>
            return CmdGetNearestWarps_Impl(script, parameters);
        }

        private static CmdAction CmdSetAvoid(object script, CmdParam[] parameters)
        {
            // CMD: setavoid <sector>
            return CmdSetAvoid_Impl(script, parameters);
        }

        private static CmdAction CmdClearAvoid(object script, CmdParam[] parameters)
        {
            // CMD: clearavoid <sector>
            return CmdClearAvoid_Impl(script, parameters);
        }

        private static CmdAction CmdClearAllAvoids(object script, CmdParam[] parameters)
        {
            // CMD: clearallavoids
            return CmdClearAllAvoids_Impl(script, parameters);
        }

        private static CmdAction CmdListAvoids(object script, CmdParam[] parameters)
        {
            // CMD: listavoids var
            return CmdListAvoids_Impl(script, parameters);
        }

        private static CmdAction CmdCopyDatabase(object script, CmdParam[] parameters)
        {
            // CMD: copydatabase <source> <dest>
            // Copies a database file from source to destination
            try
            {
                string source = Path.GetFileNameWithoutExtension(parameters[0].Value);
                string dest = Path.GetFileNameWithoutExtension(parameters[1].Value);

                string dataDir = Path.Combine(GlobalModules.ProgramDir, "data");
                string sourceFile = Path.Combine(dataDir, source + ".xdb");
                string destFile = Path.Combine(dataDir, dest + ".xdb");

                if (File.Exists(sourceFile))
                {
                    File.Copy(sourceFile, destFile, true);
                }
                else
                {
                    Console.WriteLine($"[CopyDatabase] Source database not found: {source}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CopyDatabase] Error: {ex.Message}");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdCreateDatabase(object script, CmdParam[] parameters)
        {
            // CMD: createdatabase <name> <sectors> [address] [serverPort] [listenPort] [params...]
            // Creates a new database with specified parameters
            try
            {
                if (string.IsNullOrEmpty(parameters[0].Value) || string.IsNullOrEmpty(parameters[1].Value))
                    return CmdAction.None;

                string dbName = Path.GetFileNameWithoutExtension(parameters[0].Value);
                string dataDir = Path.Combine(GlobalModules.ProgramDir, "data");
                string dbPath = Path.Combine(dataDir, dbName + ".xdb");

                // Don't overwrite existing database
                if (File.Exists(dbPath))
                {
                    Console.WriteLine($"[CreateDatabase] Database already exists: {dbName}");
                    return CmdAction.None;
                }

                // Create DataHeader with parameters
                var header = new DataHeader
                {
                    Sectors = int.TryParse(parameters[1].Value, out int sectors) ? sectors : 0,
                    StarDock = 65535 // Default unset value
                };

                // Optional parameters
                if (parameters.Length > 2 && !parameters[2].Value.Contains("="))
                    header.Address = parameters[2].Value;

                if (parameters.Length > 3 && !parameters[3].Value.Contains("="))
                    header.ServerPort = ushort.TryParse(parameters[3].Value, out ushort sport) ? sport : (ushort)2002;
                else
                    header.ServerPort = 2002;

                if (parameters.Length > 4 && !parameters[4].Value.Contains("="))
                    header.ListenPort = ushort.TryParse(parameters[4].Value, out ushort lport) ? lport : (ushort)2300;
                else
                    header.ListenPort = 2300;

                // Create data directory if it doesn't exist
                if (!Directory.Exists(dataDir))
                    Directory.CreateDirectory(dataDir);

                // Create the database
                if (GlobalModules.TWXDatabase is ModDatabase db)
                {
                    db.CreateDatabase(dbPath, header);
                    db.SaveDatabase();
                    db.CloseDatabase();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CreateDatabase] Error: {ex.Message}");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdDeleteDatabase(object script, CmdParam[] parameters)
        {
            // CMD: deletedatabase <name> [deleteScriptData]
            // Deletes a database file and optionally associated script data
            try
            {
                string dbName = Path.GetFileNameWithoutExtension(parameters[0].Value);
                string dataDir = Path.Combine(GlobalModules.ProgramDir, "data");
                string dbPath = Path.Combine(dataDir, dbName + ".xdb");

                if (!File.Exists(dbPath))
                {
                    if (GlobalModules.TWXServer != null)
                        GlobalModules.TWXServer.BroadcastLiteral($"Error: Database {dbName} does not exist.");
                    return CmdAction.None;
                }

                // Close database if it's currently open
                if (GlobalModules.TWXDatabase is ModDatabase db)
                {
                    string currentDb = Path.GetFileNameWithoutExtension(db.DatabaseName);
                    if (string.Equals(currentDb, dbName, StringComparison.OrdinalIgnoreCase))
                    {
                        db.CloseDatabase();
                    }
                }

                // Delete the database file
                if (GlobalModules.TWXServer != null)
                    GlobalModules.TWXServer.ClientMessage($"Deleting database: {dbName}");

                File.Delete(dbPath);

                // Delete .cfg file if exists
                string cfgPath = Path.Combine(dataDir, dbName + ".cfg");
                if (File.Exists(cfgPath))
                {
                    try { File.Delete(cfgPath); } catch { }
                }

                // Delete script data directory if requested
                if (parameters.Length > 1)
                {
                    string scriptDir = Path.Combine(dataDir, dbName);
                    if (Directory.Exists(scriptDir))
                    {
                        try { Directory.Delete(scriptDir, true); } catch { }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DeleteDatabase] Error: {ex.Message}");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdEditDatabase(object script, CmdParam[] parameters)
        {
            // CMD: editdatabase <name> [field=value...]
            // Edits database header fields
            try
            {
                string dbName = Path.GetFileNameWithoutExtension(parameters[0].Value);
                string dataDir = Path.Combine(GlobalModules.ProgramDir, "data");
                string dbPath = Path.Combine(dataDir, dbName + ".xdb");

                if (!File.Exists(dbPath))
                {
                    Console.WriteLine($"[EditDatabase] Database not found: {dbName}");
                    return CmdAction.None;
                }

                // Close database if currently open
                if (GlobalModules.TWXDatabase is ModDatabase db)
                {
                    string currentDb = Path.GetFileNameWithoutExtension(db.DatabaseName);
                    if (string.Equals(currentDb, dbName, StringComparison.OrdinalIgnoreCase))
                    {
                        db.CloseDatabase();
                    }
                }

                // Read existing header
                DataHeader header = new DataHeader();
                using (var fs = new FileStream(dbPath, FileMode.Open, FileAccess.Read))
                using (var br = new BinaryReader(fs))
                {
                    // Read header structure
                    header.ProgramName = br.ReadString();
                    header.Version = br.ReadByte();
                    header.Sectors = br.ReadInt32();
                    header.StarDock = br.ReadUInt16();
                    header.AlphaCentauri = br.ReadUInt16();
                    header.Rylos = br.ReadUInt16();
                    header.Address = br.ReadString();
                    header.Description = br.ReadString();
                    header.ServerPort = br.ReadUInt16();
                    header.ListenPort = br.ReadUInt16();
                    header.LoginScript = br.ReadString();
                    header.Password = br.ReadString();
                    header.LoginName = br.ReadString();
                    header.Game = br.ReadChar();
                    header.IconFile = br.ReadString();
                    header.UseRLogin = br.ReadBoolean();
                    header.UseLogin = br.ReadBoolean();
                    header.RobFactor = br.ReadByte();
                    header.StealFactor = br.ReadByte();
                    header.LastPortCIM = DateTime.FromBinary(br.ReadInt64());
                }

                // Parse field=value pairs and update header (starting at parameter 1)
                for (int i = 1; i < parameters.Length; i++)
                {
                    string param = parameters[i].Value;
                    int eqPos = param.IndexOf('=');
                    if (eqPos > 0)
                    {
                        string field = param.Substring(0, eqPos);
                        string value = param.Substring(eqPos + 1);

                        switch (field)
                        {
                            case "ServerAddress":
                                header.Address = value;
                                break;
                            case "ServerPort":
                                header.ServerPort = ushort.TryParse(value, out var sp) ? sp : (ushort)2002;
                                break;
                            case "ListenPort":
                                header.ListenPort = ushort.TryParse(value, out var lp) ? lp : (ushort)2300;
                                break;
                            case "ServerProtocal": // Note: Typo in original Pascal
                                header.UseRLogin = value.Equals("RLOGIN", StringComparison.OrdinalIgnoreCase);
                                break;
                            case "UseLoginScript":
                                header.UseLogin = value.Equals("True", StringComparison.OrdinalIgnoreCase);
                                break;
                            case "LoginScript":
                                header.LoginScript = value;
                                break;
                            case "LoginName":
                                header.LoginName = value;
                                break;
                            case "Password":
                                header.Password = value;
                                break;
                            case "GameLetter":
                                if (value.Length > 0)
                                    header.Game = value[0];
                                break;
                            case "IconFile":
                                if (value.Contains(":"))
                                    header.IconFile = Path.Combine(GlobalModules.ProgramDir, value);
                                else
                                    header.IconFile = value;
                                break;
                        }
                    }
                }

                // Write updated header back to database
                using (var fs = new FileStream(dbPath, FileMode.Open, FileAccess.Write))
                using (var bw = new BinaryWriter(fs))
                {
                    // Write header structure
                    bw.Write(header.ProgramName);
                    bw.Write(header.Version);
                    bw.Write(header.Sectors);
                    bw.Write(header.StarDock);
                    bw.Write(header.AlphaCentauri);
                    bw.Write(header.Rylos);
                    bw.Write(header.Address);
                    bw.Write(header.Description);
                    bw.Write(header.ServerPort);
                    bw.Write(header.ListenPort);
                    bw.Write(header.LoginScript);
                    bw.Write(header.Password);
                    bw.Write(header.LoginName);
                    bw.Write(header.Game);
                    bw.Write(header.IconFile);
                    bw.Write(header.UseRLogin);
                    bw.Write(header.UseLogin);
                    bw.Write(header.RobFactor);
                    bw.Write(header.StealFactor);
                    bw.Write(header.LastPortCIM.ToBinary());
                }

                Console.WriteLine($"[EditDatabase] Updated database: {dbName}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EditDatabase] Error: {ex.Message}");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdListDatabases(object script, CmdParam[] parameters)
        {
            // CMD: listdatabases varArray
            // Lists all database files in the data directory
            try
            {
                string dataDir = Path.Combine(GlobalModules.ProgramDir, "data");
                var databases = new List<string>();

                if (Directory.Exists(dataDir))
                {
                    var files = Directory.GetFiles(dataDir, "*.xdb");
                    foreach (var file in files)
                    {
                        databases.Add(Path.GetFileName(file));
                    }
                }

                if (parameters[0] is VarParam varParam)
                {
                    varParam.SetArrayFromStrings(databases);
                    parameters[0].Value = databases.Count.ToString();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ListDatabases] Error: {ex.Message}");
                if (parameters[0] is VarParam varParam)
                {
                    varParam.SetArrayFromStrings(new List<string>());
                    parameters[0].Value = "0";
                }
            }
            return CmdAction.None;
        }

        private static CmdAction CmdOpenDatabase(object script, CmdParam[] parameters)
        {
            // CMD: opendatabase <name>
            // Opens a database file for use
            try
            {
                string dbName = Path.GetFileNameWithoutExtension(parameters[0].Value);
                string dataDir = Path.Combine(GlobalModules.ProgramDir, "data");
                string dbPath = Path.Combine(dataDir, dbName + ".xdb");

                if (GlobalModules.TWXDatabase is ModDatabase db)
                {
                    db.CloseDatabase();
                    db.OpenDatabase(dbPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[OpenDatabase] Error: {ex.Message}");
                if (GlobalModules.TWXServer != null)
                    GlobalModules.TWXServer.BroadcastLiteral($"Error opening database: {ex.Message}");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdCloseDatabase(object script, CmdParam[] parameters)
        {
            // CMD: closedatabase
            // Closes the currently open database
            try
            {
                if (GlobalModules.TWXDatabase is ModDatabase db)
                {
                    db.CloseDatabase();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CloseDatabase] Error: {ex.Message}");
            }
            return CmdAction.None;
        }

        private static CmdAction CmdResetDatabase(object script, CmdParam[] parameters)
        {
            // CMD: resetdatabase <name> [deleteScriptData]
            // Resets database to blank state while preserving header settings
            try
            {
                string dbName = Path.GetFileNameWithoutExtension(parameters[0].Value);
                string dataDir = Path.Combine(GlobalModules.ProgramDir, "data");
                string dbPath = Path.Combine(dataDir, dbName + ".xdb");

                if (!File.Exists(dbPath))
                {
                    if (GlobalModules.TWXServer != null)
                        GlobalModules.TWXServer.BroadcastLiteral($"Error: Database {dbName} does not exist.");
                    return CmdAction.None;
                }

                // Close database if currently open
                if (GlobalModules.TWXDatabase is ModDatabase db)
                {
                    string currentDb = Path.GetFileNameWithoutExtension(db.DatabaseName);
                    if (string.Equals(currentDb, dbName, StringComparison.OrdinalIgnoreCase))
                    {
                        db.CloseDatabase();
                    }
                }

                // Load existing header to preserve settings
                DataHeader? header = null;
                try
                {
                    using (var fs = new FileStream(dbPath, FileMode.Open, FileAccess.Read))
                    using (var br = new BinaryReader(fs))
                    {
                        // Read header structure (simplified - would need full deserialization)
                        header = new DataHeader();
                        // TODO: Proper header deserialization
                    }
                }
                catch
                {
                    // If can't read header, use defaults
                    header = new DataHeader { Sectors = 1000, StarDock = 65535 };
                }

                if (GlobalModules.TWXServer != null)
                    GlobalModules.TWXServer.ClientMessage($"Resetting database: {dbName}");

                // Delete old database and config
                File.Delete(dbPath);
                string cfgPath = Path.Combine(dataDir, dbName + ".cfg");
                if (File.Exists(cfgPath))
                {
                    try { File.Delete(cfgPath); } catch { }
                }

                // Delete script data if requested
                if (parameters.Length > 1)
                {
                    string scriptDir = Path.Combine(dataDir, dbName);
                    if (Directory.Exists(scriptDir))
                    {
                        try { Directory.Delete(scriptDir, true); } catch { }
                    }
                }

                // Create fresh database with preserved header
                if (GlobalModules.TWXDatabase is ModDatabase db2 && header != null)
                {
                    db2.CreateDatabase(dbPath, header);
                    db2.SaveDatabase();
                    db2.CloseDatabase();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ResetDatabase] Error: {ex.Message}");
                if (GlobalModules.TWXServer != null)
                    GlobalModules.TWXServer.BroadcastLiteral($"Error resetting database: {ex.Message}");
            }
            return CmdAction.None;
        }

        #endregion

        #region Bot Management Commands

        private static CmdAction CmdSwitchBot(object script, CmdParam[] parameters)
        {
            // CMD: switchbot [selector] [botName]
            // Switch to the requested bot, or cycle to the next configured bot when no
            // selector is provided. The optional second argument sets the active bot name.
            if (script is Script scriptObj)
            {
                string selector = parameters.Length > 0 ? parameters[0].Value : string.Empty;
                string botName = parameters.Length > 1 ? parameters[1].Value : string.Empty;
                scriptObj.Controller.SwitchBot(selector, botName, stopBotScripts: false);
            }
            return CmdAction.None;
        }

        private static CmdAction CmdGetBotList(object script, CmdParam[] parameters)
        {
            var server = GlobalModules.TWXServer;
            var interpreter = GlobalModules.TWXInterpreter;
            var results = new System.Collections.Generic.List<string>();

            if (server != null)
            {
                foreach (string botName in server.GetBotList())
                {
                    BotConfig? botConfig = server.GetBotConfig(botName);
                    if (botConfig == null)
                        continue;

                    string alias = string.IsNullOrWhiteSpace(botConfig.Alias) ? botConfig.Name : botConfig.Alias;
                    string botDisplayName = "~f{~c~f}";
                    string activeName = interpreter is ModInterpreter modInterpreter
                        ? modInterpreter.GetConfiguredBotName(botConfig)
                        : string.Empty;

                    if (!string.IsNullOrWhiteSpace(activeName) && activeName != "0")
                        botDisplayName = $"~f{{~c{activeName}~f}}";

                    bool isActive = interpreter is ModInterpreter mi &&
                        (mi.ActiveBot.Equals(botConfig.Name, StringComparison.OrdinalIgnoreCase) ||
                         (!string.IsNullOrWhiteSpace(botConfig.ScriptFile) &&
                          mi.ActiveBotScript.Contains(botConfig.ScriptFile, StringComparison.OrdinalIgnoreCase)));

                    string line = string.Format(
                        CultureInfo.InvariantCulture,
                        isActive ? "{0,-14} ~G{1,-6} ~F{2} ~B<ACTIVE>" : "{0,-14} ~G{1,-6} ~F{2}",
                        botDisplayName,
                        alias,
                        botConfig.Name);
                    results.Add(line);
                }
            }

            if (parameters[0] is VarParam varParam)
            {
                varParam.SetArrayFromStrings(results);
                parameters[0].Value = results.Count.ToString(CultureInfo.InvariantCulture);
            }

            return CmdAction.None;
        }

        #endregion

        #region Client Management Commands

        private static CmdAction CmdGetDeafClients(object script, CmdParam[] parameters)
        {
            // CMD: getdeafclients var
            // Checks if any connected clients are set to deaf mode
            // Returns 1 if any deaf clients exist, 0 otherwise
            parameters[0].Value = "0";

            if (GlobalModules.TWXServer != null)
            {
                int clientCount = GlobalModules.TWXServer.ClientCount;
                for (int i = 0; i < clientCount; i++)
                {
                    if (GlobalModules.TWXServer.GetClientType(i) == ClientType.Deaf)
                    {
                        parameters[0].Value = "1";
                        break;
                    }
                }
            }

            return CmdAction.None;
        }

        private static CmdAction CmdSetDeafClients(object script, CmdParam[] parameters)
        {
            // CMD: setdeafclients [value]
            // Sets all clients to deaf (1 or no param) or standard (0) mode
            // Deaf clients don't receive broadcast messages
            if (GlobalModules.TWXServer != null)
            {
                bool setToDeaf = true;

                // If parameter is "0", set to standard mode
                if (parameters.Length > 0 && parameters[0].Value == "0")
                {
                    setToDeaf = false;
                }

                int clientCount = GlobalModules.TWXServer.ClientCount;
                for (int i = 0; i < clientCount; i++)
                {
                    if (setToDeaf)
                    {
                        // Set standard clients to deaf
                        if (GlobalModules.TWXServer.GetClientType(i) == ClientType.Standard)
                        {
                            GlobalModules.TWXServer.SetClientType(i, ClientType.Deaf);
                        }
                    }
                    else
                    {
                        // Set deaf clients to standard
                        if (GlobalModules.TWXServer.GetClientType(i) == ClientType.Deaf)
                        {
                            GlobalModules.TWXServer.SetClientType(i, ClientType.Standard);
                        }
                    }
                }
            }

            return CmdAction.None;
        }

        private static CmdAction CmdOpenInstance(object script, CmdParam[] parameters)
        {
            // CMD: openinstance [params...]
            // Opens a new TWX Proxy instance with specified parameters
            // Cross-platform implementation using Process.Start
            try
            {
                // Build command line arguments from all parameters
                string args = string.Join(" ", parameters.Select(p => p.Value));

                // Determine executable name based on platform
                string exeName = OperatingSystem.IsWindows() ? "twxp.exe" : "twxp";
                string exePath = Path.Combine(GlobalModules.ProgramDir, exeName);

                // Check if executable exists
                if (!File.Exists(exePath))
                {
                    Console.WriteLine($"[OpenInstance] Executable not found: {exePath}");
                    return CmdAction.None;
                }

                // Start new process
                var startInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = exePath,
                    Arguments = args,
                    UseShellExecute = true,
                    WorkingDirectory = GlobalModules.ProgramDir
                };

                System.Diagnostics.Process.Start(startInfo);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[OpenInstance] Error: {ex.Message}");
            }

            return CmdAction.None;
        }

        private static CmdAction CmdCloseInstance(object script, CmdParam[] parameters)
        {
            // CMD: closeinstance <instance>
            // Stops a running game instance by name or "ALL" for all instances
            // Similar to the stop button in the UI
            try
            {
                string instanceName = parameters[0].Value;

                if (GlobalModules.TWXDatabase is ModDatabase db)
                {
                    TwxRuntimeContext context = GlobalModules.CurrentContext;
                    if (instanceName.ToUpper() == "ALL")
                    {
                        // Stop all game instances
                        Task.Run(async () =>
                        {
                            using var _ = GlobalModules.UseRuntimeContext(context);
                            try
                            {
                                await db.StopAllGameInstancesAsync();
                                Console.WriteLine("[CloseInstance] Stopped all game instances");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"[CloseInstance] Error stopping all instances: {ex.Message}");
                            }
                        });
                    }
                    else
                    {
                        // Stop specific game instance
                        Task.Run(async () =>
                        {
                            using var _ = GlobalModules.UseRuntimeContext(context);
                            try
                            {
                                await db.StopGameInstanceAsync(instanceName);
                                Console.WriteLine($"[CloseInstance] Stopped game instance: {instanceName}");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"[CloseInstance] Error stopping instance '{instanceName}': {ex.Message}");
                            }
                        });
                    }
                }
                else
                {
                    Console.WriteLine("[CloseInstance] No active database available");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CloseInstance] Error: {ex.Message}");
            }

            return CmdAction.None;
        }

        #endregion

        #region System Commands

        private static CmdAction CmdSys_Check(object script, CmdParam[] parameters)
        {
            // CMD: sys_check - Internal system command
            // Used for system-level checks, currently no-op
            return CmdAction.None;
        }

        private static CmdAction CmdSys_Fail(object script, CmdParam[] parameters)
        {
            // CMD: sys_fail - Internal system command
            // Authentication failure message
            Console.WriteLine("Unable to access subroutine - Authentication failure.");
            return CmdAction.Stop;
        }

        private static CmdAction CmdSys_Kill(object script, CmdParam[] parameters)
        {
            // CMD: sys_kill - Internal system command
            // Emergency kill - terminates the entire application
            // WARNING: This is intentionally harsh for security purposes
            Environment.Exit(1);
            return CmdAction.Stop; // Never reached but required for return
        }

        private static CmdAction CmdSys_NoAuth(object script, CmdParam[] parameters)
        {
            // CMD: sys_noauth - Internal system command
            // No authentication required marker
            return CmdAction.None;
        }

        private static CmdAction CmdSys_Nop(object script, CmdParam[] parameters)
        {
            // CMD: sys_nop - Internal system command (no operation)
            return CmdAction.None;
        }

        private static CmdAction CmdSys_ShowMsg(object script, CmdParam[] parameters)
        {
            // CMD: sys_showmsg - Internal system command
            // Show system message (currently no-op)
            return CmdAction.None;
        }

        private static CmdAction CmdLibCmd(object script, CmdParam[] parameters)
        {
            // CMD: libcmd <command> [params...]
            // TODO: Execute library command
            return CmdAction.None;
        }

        private static CmdAction CmdGetDateTime(object script, CmdParam[] parameters)
        {
            // CMD: getdatetime var
            // Returns Unix timestamp (seconds since 1970-01-01 UTC) as a string,
            // matching Pascal TWX27 DateTimeToUnix(Now) behavior
            parameters[0].Value = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            return CmdAction.None;
        }

        private static CmdAction CmdDateTimeDiff(object script, CmdParam[] parameters)
        {
            // CMD: datetimediff var <startUnix> <endUnix> [DatePart]
            // DatePart: "Days", "Hours", "Mins", "Secs" — or omitted for "DD:HH:MM:SS"
            if (!long.TryParse(parameters[1].Value, out long start)) start = 0;
            if (!long.TryParse(parameters[2].Value, out long end)) end = 0;

            long diff = Math.Abs(end - start);
            long days = diff / 86400; diff %= 86400;
            long hours = diff / 3600; diff %= 3600;
            long mins = diff / 60;
            long secs = diff % 60;

            if (parameters.Length > 3)
            {
                parameters[0].Value = parameters[3].Value switch
                {
                    "Days" => days.ToString(),
                    "Hours" => hours.ToString(),
                    "Mins" => mins.ToString(),
                    "Secs" => secs.ToString(),
                    _ => $"{days:D2}:{hours:D2}:{mins:D2}:{secs:D2}"
                };
            }
            else
                parameters[0].Value = $"{days:D2}:{hours:D2}:{mins:D2}:{secs:D2}";

            return CmdAction.None;
        }

        private static CmdAction CmdDateTimeToStr(object script, CmdParam[] parameters)
        {
            // CMD: datetimetostr var <unixtime> [format]
            // Converts Unix timestamp to local date/time string using optional format specifier
            if (!long.TryParse(parameters[1].Value, out long unixTime)) unixTime = 0;
            var dt = DateTimeOffset.FromUnixTimeSeconds(unixTime).LocalDateTime;
            parameters[0].Value = parameters.Length > 2
                ? dt.ToString(parameters[2].Value, System.Globalization.CultureInfo.CurrentCulture)
                : dt.ToString();
            return CmdAction.None;
        }

        private static CmdAction CmdCenter(object script, CmdParam[] parameters)
        {
            // CMD: center var <width> [padstr]
            // Centers the current value of var within width characters.
            // Matching Pascal: j = Floor((len+2)/2), k = Floor(width/2),
            // pad is built by repeating padstr (k-j+1) times on each side.
            string s = parameters[0].Value;
            int width = (int)Math.Floor(parameters[1].DecValue);
            string padStr = parameters.Length > 2 ? parameters[2].Value : " ";
            if (padStr.Length == 0) padStr = " ";

            int j = (s.Length + 2) / 2;  // integer division, matches Pascal Floor
            int k = width / 2;            // integer division, matches Pascal Floor

            var padBuilder = new System.Text.StringBuilder();
            for (int i = 0; i <= k - j; i++)
                padBuilder.Append(padStr);
            string pad = padBuilder.ToString();

            string result = pad + s + pad;
            if (result.Length < width)
                result += padStr;

            parameters[0].Value = result;
            return CmdAction.None;
        }

        private static CmdAction CmdRepeat(object script, CmdParam[] parameters)
        {
            // CMD: repeat var <count> [pattern]
            // Single-char pattern: builds a string of that char repeated count times.
            // Multi-char pattern: builds a palindrome of length count by cycling through
            // pattern chars, matching Pascal TWX27 algorithm exactly.
            int count = (int)Math.Truncate(parameters[1].DecValue);
            string pattern = parameters.Length > 2 ? parameters[2].Value : " ";
            if (pattern.Length == 0) pattern = " ";

            string result;
            if (count <= 0)
            {
                result = string.Empty;
            }
            else if (pattern.Length == 1)
            {
                result = new string(pattern[0], count);
            }
            else
            {
                // Multi-char palindrome: Pascal builds L (left half) and R (reversed right half)
                // by cycling through pattern chars, mirroring them.
                // Loop runs Trunc(count/2 - 1) + 1 = Trunc((count-2)/2) + 1 iterations
                string L = string.Empty;
                string R = string.Empty;
                int c = 0; // 0-based index into pattern
                int iterations = (int)Math.Truncate(count / 2.0 - 1) + 1;

                for (int i = 0; i < iterations; i++)
                {
                    char ch = pattern[c % pattern.Length];
                    L += ch;
                    R = ch + R;
                    c++;
                }

                string combined = L + R;
                if (combined.Length < count)
                {
                    char ch = pattern[c % pattern.Length];
                    combined = L + ch + R;
                }
                result = combined;
            }

            parameters[0].Value = result;
            return CmdAction.None;
        }

        #endregion
    }
}
