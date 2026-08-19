using System;
using System.Collections.Generic;
using System.Globalization;

namespace TWXProxy.Core
{
    public sealed class PreparedScriptProgram
    {
        private readonly int[] _instructionOffsets;

        public PreparedScriptProgram(
            PreparedInstruction[] instructions,
            int[] instructionOffsets,
            int codeLength)
        {
            Instructions = instructions;
            _instructionOffsets = instructionOffsets;
            CodeLength = codeLength;
        }

        public PreparedInstruction[] Instructions { get; }
        public int CodeLength { get; }

        internal int[] CloneInstructionOffsets()
        {
            return (int[])_instructionOffsets.Clone();
        }

        public bool TryGetInstructionIndex(int rawOffset, out int instructionIndex)
        {
            if (rawOffset < 0 || rawOffset >= CodeLength)
            {
                instructionIndex = -1;
                return false;
            }

            instructionIndex = Array.BinarySearch(_instructionOffsets, rawOffset);
            return instructionIndex >= 0;
        }
    }

    public sealed class PreparedInstruction
    {
        public int RawOffset { get; init; }
        public int RawEndOffset { get; init; }
        public byte ScriptId { get; init; }
        public ushort LineNumber { get; init; }
        public ushort CommandId { get; init; }
        public bool IsLabel { get; init; }
        public ScriptCmd? Command { get; init; }
        public string CommandName { get; init; } = string.Empty;
        public ScriptCmdHandler? Handler { get; init; }
        public ushort MinParams { get; init; }
        public bool IsGotoCommand { get; init; }
        public bool IsReturnCommand { get; init; }
        public PreparedParam[] Params { get; init; } = Array.Empty<PreparedParam>();
        public int NextInstructionIndex { get; set; } = -1;
        public CmdParam[]? RuntimeDispatchParams { get; set; }
        public int[] DynamicParamIndexes { get; init; } = Array.Empty<int>();
        public bool DirectParamsInitialized { get; set; }
    }

    public sealed class PreparedParam
    {
        public byte ParamType { get; init; }
        public int ParamId { get; init; } = -1;
        public int ArithmeticBaseParamId { get; init; } = -1;
        public ushort SysConstId { get; init; }
        public byte CharCode { get; init; }
        public ScriptSysConst? SysConst { get; init; }
        public PreparedParam[] Indexes { get; init; } = Array.Empty<PreparedParam>();
        public CmdParam? CompiledParam { get; init; }
        public string LiteralValue { get; init; } = string.Empty;
        public string ProgVarName { get; init; } = string.Empty;
        public bool HasArithmeticExpression { get; init; }
        public VarParam? ArithmeticBaseVar { get; init; }
        public char ArithmeticOperator { get; init; }
        public double ArithmeticRightValue { get; init; }
        public CmdParam? RuntimeParam { get; set; }
        public bool IsDirectReference { get; set; }
    }

    internal static class PreparedScriptDecoder
    {
        private sealed class DecoderContext
        {
            private readonly ScriptCmp _cmp;
            private Dictionary<CmdParam, int>? _paramIdByReference;
            private Dictionary<string, VarParam>? _varsByName;

            public DecoderContext(ScriptCmp cmp)
            {
                _cmp = cmp;
            }

            public ScriptCmp Cmp => _cmp;

            public CmdParam? TryGetParam(int paramId)
            {
                return paramId >= 0 && paramId < _cmp.ParamList.Count
                    ? _cmp.ParamList[paramId]
                    : null;
            }

            public ScriptSysConst? TryGetSysConst(ushort sysConstId)
            {
                if (_cmp.ScriptRef == null)
                    return null;

                return sysConstId < _cmp.ScriptRef.SysConstCount
                    ? _cmp.ScriptRef.GetSysConst(sysConstId)
                    : null;
            }

            public int FindParamId(CmdParam target)
            {
                _paramIdByReference ??= BuildParamIdByReference();
                return _paramIdByReference.TryGetValue(target, out int paramId)
                    ? paramId
                    : -1;
            }

            public bool TryGetVarByName(string varName, out VarParam? varParam)
            {
                _varsByName ??= BuildVarsByName();
                return _varsByName.TryGetValue(varName, out varParam);
            }

            private Dictionary<CmdParam, int> BuildParamIdByReference()
            {
                var map = new Dictionary<CmdParam, int>(_cmp.ParamList.Count);
                for (int i = 0; i < _cmp.ParamList.Count; i++)
                {
                    CmdParam param = _cmp.ParamList[i];
                    if (!map.ContainsKey(param))
                        map[param] = i;
                }

                return map;
            }

            private Dictionary<string, VarParam> BuildVarsByName()
            {
                var map = new Dictionary<string, VarParam>(StringComparer.OrdinalIgnoreCase);
                foreach (CmdParam param in _cmp.ParamList)
                {
                    if (param is VarParam vp && !map.ContainsKey(vp.Name))
                        map[vp.Name] = vp;
                }

                return map;
            }
        }

        public static PreparedScriptProgram Decode(ScriptCmp cmp)
        {
            byte[] code = cmp.Code;
            var context = new DecoderContext(cmp);
            var instructions = new List<PreparedInstruction>(Math.Max(16, code.Length / 8));
            int codePos = 0;

            while (codePos < code.Length)
            {
                int rawOffset = codePos;

                if (codePos + 5 > code.Length)
                    throw new Exception($"Truncated instruction header at byte offset {codePos}");

                byte scriptId = code[codePos++];
                ushort lineNumber = BitConverter.ToUInt16(code, codePos);
                codePos += 2;
                ushort commandId = BitConverter.ToUInt16(code, codePos);
                codePos += 2;

                PreparedInstruction instruction;
                if (commandId == 255)
                {
                    if (codePos + 4 > code.Length)
                        throw new Exception($"Truncated label payload at byte offset {codePos}");

                    codePos += 4;
                    instruction = new PreparedInstruction
                    {
                        RawOffset = rawOffset,
                        RawEndOffset = codePos,
                        ScriptId = scriptId,
                        LineNumber = lineNumber,
                        CommandId = commandId,
                        IsLabel = true
                    };
                }
                else
                {
                    PreparedParam[] parameters = DecodeParameters(code, ref codePos, context);

                    ScriptCmd? command = null;
                    if (cmp.ScriptRef != null && commandId < cmp.ScriptRef.CmdCount)
                        command = cmp.ScriptRef.GetCmd(commandId);

                    MarkDirectReferences(parameters, command);

                    instruction = new PreparedInstruction
                    {
                        RawOffset = rawOffset,
                        RawEndOffset = codePos,
                        ScriptId = scriptId,
                        LineNumber = lineNumber,
                        CommandId = commandId,
                        Command = command,
                        CommandName = command?.Name ?? string.Empty,
                        Handler = command?.OnCmd,
                        MinParams = command != null ? (ushort)command.MinParams : (ushort)0,
                        IsGotoCommand = string.Equals(command?.Name, "GOTO", StringComparison.Ordinal),
                        IsReturnCommand = string.Equals(command?.Name, "RETURN", StringComparison.Ordinal),
                        Params = parameters,
                        DynamicParamIndexes = BuildDynamicParamIndexes(parameters)
                    };

                    PreparedInitialization initialization = BuildInitialDispatchState(instruction.Params);
                    instruction.RuntimeDispatchParams = initialization.DispatchParams;
                    instruction.DirectParamsInitialized = initialization.DirectParamsInitialized;
                }

                instructions.Add(instruction);
            }

            var preparedInstructions = instructions.ToArray();
            var instructionOffsets = new int[preparedInstructions.Length];
            for (int i = 0; i < preparedInstructions.Length; i++)
            {
                preparedInstructions[i].NextInstructionIndex = i + 1;
                instructionOffsets[i] = preparedInstructions[i].RawOffset;
            }

            return new PreparedScriptProgram(preparedInstructions, instructionOffsets, code.Length);
        }

        private static PreparedParam[] DecodeParameters(byte[] code, ref int codePos, DecoderContext context)
        {
            if (codePos >= code.Length)
                return Array.Empty<PreparedParam>();

            if (code[codePos] == 0)
            {
                codePos++;
                return Array.Empty<PreparedParam>();
            }

            var buffer = new PreparedParam[4];
            int count = 0;

            while (codePos < code.Length)
            {
                if (code[codePos] == 0)
                {
                    codePos++;
                    break;
                }

                if (count == buffer.Length)
                    Array.Resize(ref buffer, buffer.Length * 2);

                buffer[count++] = DecodeParam(code, ref codePos, context);
            }

            if (count == 0)
                return Array.Empty<PreparedParam>();

            if (count == buffer.Length)
                return buffer;

            var result = new PreparedParam[count];
            Array.Copy(buffer, result, count);
            return result;
        }

        private static PreparedParam DecodeParam(byte[] code, ref int codePos, DecoderContext context)
        {
            if (codePos >= code.Length)
                throw new Exception("Unexpected end of bytecode while decoding parameter");

            byte paramType = code[codePos++];
            return paramType switch
            {
                ScriptConstants.PARAM_CONST => DecodeConstParam(code, ref codePos, context, paramType),
                ScriptConstants.PARAM_VAR => DecodeVarParam(code, ref codePos, context, paramType),
                ScriptConstants.PARAM_PROGVAR => DecodeProgVarParam(code, ref codePos, context, paramType),
                ScriptConstants.PARAM_SYSCONST => DecodeSysConstParam(code, ref codePos, context, paramType),
                ScriptConstants.PARAM_CHAR => new PreparedParam
                {
                    ParamType = paramType,
                    CharCode = ReadByte(code, ref codePos),
                    LiteralValue = ((char)code[codePos - 1]).ToString()
                },
                _ => throw new Exception($"Unknown parameter type {paramType} at byte offset {codePos - 1}")
            };
        }

        private static PreparedParam DecodeConstParam(byte[] code, ref int codePos, DecoderContext context, byte paramType)
        {
            int paramId = ReadInt32(code, ref codePos);
            CmdParam? compiledParam = context.TryGetParam(paramId);
            return new PreparedParam
            {
                ParamType = paramType,
                ParamId = paramId,
                CompiledParam = compiledParam,
                LiteralValue = compiledParam?.Value ?? string.Empty,
                IsDirectReference = false
            };
        }

        private static PreparedParam DecodeVarParam(byte[] code, ref int codePos, DecoderContext context, byte paramType)
        {
            int paramId = ReadInt32(code, ref codePos);
            CmdParam? compiledParam = context.TryGetParam(paramId);
            VarParam? varParam = compiledParam as VarParam;
            PreparedParam[] indexes = DecodeIndexes(code, ref codePos, context);

            bool hasArithmeticExpression = false;
            VarParam? arithmeticBaseVar = null;
            char arithmeticOperator = '\0';
            double arithmeticRightValue = 0;

            if (varParam != null && TryDecodeArithmetic(varParam.Name, context, out arithmeticBaseVar, out arithmeticOperator, out arithmeticRightValue))
                hasArithmeticExpression = true;

            return new PreparedParam
            {
                ParamType = paramType,
                ParamId = paramId,
                CompiledParam = compiledParam,
                Indexes = indexes,
                HasArithmeticExpression = hasArithmeticExpression,
                ArithmeticBaseVar = arithmeticBaseVar,
                ArithmeticBaseParamId = arithmeticBaseVar != null ? context.FindParamId(arithmeticBaseVar) : -1,
                ArithmeticOperator = arithmeticOperator,
                ArithmeticRightValue = arithmeticRightValue,
                IsDirectReference = compiledParam != null && indexes.Length == 0 && !hasArithmeticExpression
            };
        }

        private static PreparedParam DecodeProgVarParam(byte[] code, ref int codePos, DecoderContext context, byte paramType)
        {
            int paramId = ReadInt32(code, ref codePos);
            CmdParam? compiledParam = context.TryGetParam(paramId);
            string progVarName = compiledParam is VarParam vp
                ? vp.Name
                : compiledParam?.Value ?? string.Empty;

            PreparedParam[] indexes = DecodeIndexes(code, ref codePos, context);

            return new PreparedParam
            {
                ParamType = paramType,
                ParamId = paramId,
                CompiledParam = compiledParam,
                ProgVarName = progVarName,
                Indexes = indexes,
                IsDirectReference = !string.IsNullOrEmpty(progVarName) && indexes.Length == 0
            };
        }

        private static PreparedParam DecodeSysConstParam(byte[] code, ref int codePos, DecoderContext context, byte paramType)
        {
            ushort sysConstId = ReadUInt16(code, ref codePos);
            return new PreparedParam
            {
                ParamType = paramType,
                SysConstId = sysConstId,
                SysConst = context.TryGetSysConst(sysConstId),
                Indexes = DecodeIndexes(code, ref codePos, context)
            };
        }

        private static PreparedParam[] DecodeIndexes(byte[] code, ref int codePos, DecoderContext context)
        {
            if (codePos >= code.Length)
                return Array.Empty<PreparedParam>();

            byte indexCount = code[codePos++];
            if (indexCount == 0)
                return Array.Empty<PreparedParam>();

            var indexes = new PreparedParam[indexCount];
            for (int i = 0; i < indexCount; i++)
                indexes[i] = DecodeParam(code, ref codePos, context);

            return indexes;
        }

        private static void MarkDirectReferences(PreparedParam[] parameters, ScriptCmd? command)
        {
            for (int i = 0; i < parameters.Length; i++)
            {
                PreparedParam param = parameters[i];
                if (param.IsDirectReference)
                    continue;

                ParamKind paramKind = command?.GetParamKind(i) ?? ParamKind.Value;
                if (paramKind == ParamKind.Variable)
                    continue;

                switch (param.ParamType)
                {
                    case ScriptConstants.PARAM_CONST:
                    case ScriptConstants.PARAM_CHAR:
                        param.IsDirectReference = true;
                        break;

                    case ScriptConstants.PARAM_SYSCONST:
                        if (param.Indexes.Length == 0 && IsStaticSysConst(param.SysConst))
                            param.IsDirectReference = true;
                        break;
                }
            }
        }

        private static int[] BuildDynamicParamIndexes(PreparedParam[] parameters)
        {
            if (parameters.Length == 0)
                return Array.Empty<int>();

            int dynamicCount = 0;
            for (int i = 0; i < parameters.Length; i++)
            {
                if (!parameters[i].IsDirectReference)
                    dynamicCount++;
            }

            switch (dynamicCount)
            {
                case 0:
                    return Array.Empty<int>();
                case 1:
                    for (int i = 0; i < parameters.Length; i++)
                    {
                        if (!parameters[i].IsDirectReference)
                            return new[] { i };
                    }

                    return Array.Empty<int>();
                default:
                    var dynamicIndexes = new int[dynamicCount];
                    int writeIndex = 0;
                    for (int i = 0; i < parameters.Length; i++)
                    {
                        if (!parameters[i].IsDirectReference)
                            dynamicIndexes[writeIndex++] = i;
                    }

                    return dynamicIndexes;
            }
        }

        private static bool IsStaticSysConst(ScriptSysConst? sysConst)
        {
            if (sysConst == null)
                return false;

            string name = sysConst.Name;
            return string.Equals(name, "TRUE", StringComparison.Ordinal) ||
                string.Equals(name, "FALSE", StringComparison.Ordinal) ||
                name.StartsWith("ANSI_", StringComparison.Ordinal);
        }

        private static PreparedInitialization BuildInitialDispatchState(PreparedParam[] parameters)
        {
            if (parameters.Length == 0)
                return new PreparedInitialization(Array.Empty<CmdParam>(), true);

            var dispatchParams = new CmdParam[parameters.Length];
            bool directParamsInitialized = true;

            for (int i = 0; i < parameters.Length; i++)
            {
                PreparedParam param = parameters[i];
                if (!param.IsDirectReference)
                    continue;

                CmdParam? runtimeParam = TryCreateStaticDirectParam(param);
                if (runtimeParam == null)
                {
                    directParamsInitialized = false;
                    continue;
                }

                dispatchParams[i] = runtimeParam;
                param.RuntimeParam = runtimeParam;
            }

            return new PreparedInitialization(dispatchParams, directParamsInitialized);
        }

        private static CmdParam? TryCreateStaticDirectParam(PreparedParam param)
        {
            switch (param.ParamType)
            {
                case ScriptConstants.PARAM_CONST:
                case ScriptConstants.PARAM_CHAR:
                    return new CmdParam { Value = param.LiteralValue };

                case ScriptConstants.PARAM_VAR:
                    return param.CompiledParam;

                case ScriptConstants.PARAM_SYSCONST:
                    if (param.Indexes.Length == 0 && IsStaticSysConst(param.SysConst))
                        return new CmdParam { Value = param.SysConst!.Read(Array.Empty<string>()) };
                    return null;

                default:
                    return null;
            }
        }

        private readonly record struct PreparedInitialization(CmdParam[] DispatchParams, bool DirectParamsInitialized);

        private static bool TryDecodeArithmetic(
            string varName,
            DecoderContext context,
            out VarParam? baseVar,
            out char arithmeticOperator,
            out double arithmeticRightValue)
        {
            baseVar = null;
            arithmeticOperator = '\0';
            arithmeticRightValue = 0;

            int opIdx = FindArithmeticOperator(varName);
            if (opIdx < 0)
                return false;

            string baseVarName = varName.Substring(0, opIdx);
            arithmeticOperator = varName[opIdx];
            string rhsStr = varName.Substring(opIdx + 1);

            if (!double.TryParse(rhsStr, NumberStyles.Float, CultureInfo.InvariantCulture, out arithmeticRightValue))
                return false;

            if (context.TryGetVarByName(baseVarName, out VarParam? resolvedBaseVar) && resolvedBaseVar != null)
            {
                baseVar = resolvedBaseVar;
                return true;
            }

            return false;
        }

        private static int FindArithmeticOperator(string varName)
        {
            if (string.IsNullOrEmpty(varName) || varName[0] != '$')
                return -1;

            for (int i = 2; i < varName.Length; i++)
            {
                char c = varName[i];
                if (c == '+' || c == '-' || c == '*' || c == '/')
                    return i;

                if (!(char.IsLetterOrDigit(c) || c == '_'))
                    return -1;
            }

            return -1;
        }

        private static int ReadInt32(byte[] code, ref int codePos)
        {
            if (codePos + 4 > code.Length)
                throw new Exception($"Unexpected end of bytecode while reading Int32 at offset {codePos}");

            int value = BitConverter.ToInt32(code, codePos);
            codePos += 4;
            return value;
        }

        private static ushort ReadUInt16(byte[] code, ref int codePos)
        {
            if (codePos + 2 > code.Length)
                throw new Exception($"Unexpected end of bytecode while reading UInt16 at offset {codePos}");

            ushort value = BitConverter.ToUInt16(code, codePos);
            codePos += 2;
            return value;
        }

        private static byte ReadByte(byte[] code, ref int codePos)
        {
            if (codePos >= code.Length)
                throw new Exception($"Unexpected end of bytecode while reading byte at offset {codePos}");

            return code[codePos++];
        }
    }

    internal static class PreparedScriptTemplateCloner
    {
        public static PreparedScriptProgram CreateTemplate(PreparedScriptProgram source)
        {
            var instructions = new PreparedInstruction[source.Instructions.Length];
            for (int i = 0; i < source.Instructions.Length; i++)
                instructions[i] = CloneInstruction(source.Instructions[i], null);

            return new PreparedScriptProgram(instructions, source.CloneInstructionOffsets(), source.CodeLength);
        }

        public static PreparedScriptProgram CloneForExecution(PreparedScriptProgram template, ScriptCmp cmp)
        {
            var instructions = new PreparedInstruction[template.Instructions.Length];
            for (int i = 0; i < template.Instructions.Length; i++)
                instructions[i] = CloneInstruction(template.Instructions[i], cmp);

            return new PreparedScriptProgram(instructions, template.CloneInstructionOffsets(), template.CodeLength);
        }

        private static PreparedInstruction CloneInstruction(PreparedInstruction source, ScriptCmp? cmp)
        {
            var clonedParams = new PreparedParam[source.Params.Length];
            for (int i = 0; i < source.Params.Length; i++)
                clonedParams[i] = CloneParam(source.Params[i], cmp);

            int[] dynamicIndexes = source.DynamicParamIndexes.Length == 0
                ? Array.Empty<int>()
                : (int[])source.DynamicParamIndexes.Clone();

            return new PreparedInstruction
            {
                RawOffset = source.RawOffset,
                RawEndOffset = source.RawEndOffset,
                ScriptId = source.ScriptId,
                LineNumber = source.LineNumber,
                CommandId = source.CommandId,
                IsLabel = source.IsLabel,
                Command = source.Command,
                CommandName = source.CommandName,
                Handler = source.Handler,
                MinParams = source.MinParams,
                IsGotoCommand = source.IsGotoCommand,
                IsReturnCommand = source.IsReturnCommand,
                Params = clonedParams,
                NextInstructionIndex = source.NextInstructionIndex,
                RuntimeDispatchParams = null,
                DynamicParamIndexes = dynamicIndexes,
                DirectParamsInitialized = false,
            };
        }

        private static PreparedParam CloneParam(PreparedParam source, ScriptCmp? cmp)
        {
            var clonedIndexes = new PreparedParam[source.Indexes.Length];
            for (int i = 0; i < source.Indexes.Length; i++)
                clonedIndexes[i] = CloneParam(source.Indexes[i], cmp);

            CmdParam? compiledParam = null;
            if (cmp != null && source.ParamId >= 0 && source.ParamId < cmp.ParamList.Count)
                compiledParam = cmp.GetParam(source.ParamId);

            VarParam? arithmeticBaseVar = null;
            if (cmp != null &&
                source.ArithmeticBaseParamId >= 0 &&
                source.ArithmeticBaseParamId < cmp.ParamList.Count)
            {
                arithmeticBaseVar = cmp.GetParam(source.ArithmeticBaseParamId) as VarParam;
            }

            return new PreparedParam
            {
                ParamType = source.ParamType,
                ParamId = source.ParamId,
                ArithmeticBaseParamId = source.ArithmeticBaseParamId,
                SysConstId = source.SysConstId,
                CharCode = source.CharCode,
                SysConst = source.SysConst,
                Indexes = clonedIndexes,
                CompiledParam = compiledParam,
                LiteralValue = source.LiteralValue,
                ProgVarName = source.ProgVarName,
                HasArithmeticExpression = source.HasArithmeticExpression,
                ArithmeticBaseVar = arithmeticBaseVar,
                ArithmeticOperator = source.ArithmeticOperator,
                ArithmeticRightValue = source.ArithmeticRightValue,
                RuntimeParam = null,
                IsDirectReference = source.IsDirectReference,
            };
        }
    }
}
