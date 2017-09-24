using System;
using System.Collections.Generic;
using System.IO;
using System.Collections;
using ScriptRef;
using Global;
using Core;
using Menu;
using DataBase;
using Utility;
using Script;
using Ansi;
using TCP;
using ScriptCmp;
using FormScript;
 // 
 // Copyright (C) 2005  Remco Mulder
 // 
 // This program is free software; you can redistribute it and/or modify
 // it under the terms of the GNU General Public License as published by
 // the Free Software Foundation; either version 2 of the License, or
 // (at your option) any later version.
 // 
 // This program is distributed in the hope that it will be useful,
 // but WITHOUT ANY WARRANTY; without even the implied warranty of
 // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 // GNU General Public License for more details.
 // 
 // You should have received a copy of the GNU General Public License
 // along with this program; if not, write to the Free Software
 // Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 // 
 // For source notes please refer to Notes.txt
 // For license terms please refer to GPL.txt.
 // 
 // These files should be stored in the root of the compression you
 // received this source in.
 // This unit contains the implementation for all script commands
 // 
 // EP's To Do:
 // Make boolean tests on the same line occur from left to right, and exit at the first fail
 // Add Array Insert / Delete or Remove... maybe Copy, Null
 // 
 // Elapsed <var> <TDateTime> <TDateTime>
 // Absolute <inputVar> <outputVar>
namespace ScriptCmd
{
    public struct ShortHdr
    {
        public string[] ProgramName;
        public ushort Version;
    } // end ShortHdr

}

namespace ScriptCmd.Units
{
    public class ScriptCmd
    {
    // var - Changed to Const in the TruncFloat and UpdateParam procedures
    // EP - These vars are used to speed up TextToFloat & FloatToText conversions
    // LastPrecision : Extended = 0;
    // LastMultiplier : Extended = 1;
    // CharBuffer : array[0..64] of Char;
    // PCharBuffer : PChar = @CharBuffer;
    // EP - These are for improving the speed of repetitive Read commands
        public static string LastReadFilename = String.Empty;
    // LastReadModTime : Integer;
        public static long LastReadModTime = 0;
        public static List<string> LastReadStrings = null;
    // EP - To speed up Float -> String and String -> Float conversions - Set with cmdSetPrecision
        public static int SetPrecision = 0;
        public static int LastPrecision = 0;
        public static double LastMultiplier = 1;
        public static double MaxFloatVariance = 0;
        public const string SCSectorParameterError = "Sector parameter name cannot be longer than 10 characters";
        public const string SCSectorParameterValueError = "Sector parameter value cannot be longer than 40 characters";
        // EP: Effectively half of the next decimal beyond Precision, aka Epsilon
        public static double RaiseToPower(double Value, int Power)
        {
            double result;
            int I;
            if (Power == 0)
            {
                result = 1;
            }
            else
            {
                result = Value;
                // Power = 1
                for (I = 2; I <= Power; I ++ )
                {
                    result = result * Value;
                }
            }
            return result;
        }

        public static void UpdatePrecision(int Precision)
        {
            if (Precision != LastPrecision)
            {
                LastPrecision = Precision;
                LastMultiplier = RaiseToPower(10, Precision);
                MaxFloatVariance = 0.5 / LastMultiplier;
            }
        }

        // (*
        // function RoundFloat(const F : Extended; Precision : Integer = 0) : Extended; // Using a default parameter
        // begin
        // if Precision = 0 then
        // Result := Trunc(F) // Want to replace with a dedicated Trunc() function
        // else
        // begin
        // UpdatePrecision(Precision);
        // Result := Round(F * LastMultiplier) / LastMultiplier;
        // end;
        // end;
        // *)
        public static bool NearEqual(double F1, double F2, int Precision)
        {
            bool result;
            // Using a default parameter
            // This is to compare floating point numbers for equality
            // An absolute difference of <= (0.5 / 10^Precision) will be considered equal
            UpdatePrecision(Precision);
            result = Math.Abs(F1 - F2) <= MaxFloatVariance;
            return result;
        }

        public static void UpdateParam(TCmdParam Param, double Value, int Precision)
        {
            if (Precision == 0)
            {
                Param.DecValue = Convert.ToInt32(Value);
            }
            else
            {
                Param.DecValue = Value;
            }
            Param.SigDigits = Precision;
            // EP - This will be needed for the FloatToText conversion

        }

        public static void ConvertToNumber(string S, ref int N)
        {
            try {
                N = Math.Round(Convert.ToSingle(S));
            }
            catch {
                throw new EScriptError('\'' + S + "\' is not a number");
            }
        }

        public static void ConvertToBoolean(TCmdParam Param, ref bool B)
        {
            if ((Param.IsNumeric))
            {
                if ((Param.DecValue == 0))
                {
                    B = false;
                }
                else if ((Param.DecValue == 1))
                {
                    B = true;
                }
                else
                {
                    throw new EScriptError("Value must be either 0 or 1 (cannot be \"" + Param.Value + "\")");
                }
            }
            else
            {
                if ((Param.Value == '0'))
                {
                    B = false;
                }
                else if ((Param.Value == '1'))
                {
                    B = true;
                }
                else
                {
                    throw new EScriptError("Value must be either 0 or 1 (cannot be \"" + Param.Value + "\")");
                }
            }
        }

        public static string ConvertBoolToString(bool B)
        {
            string result;
            if (B)
            {
                result = '1';
            }
            else
            {
                result = '0';
            }
            return result;
        }

        public static void CheckSector(int Index)
        {
            if ((Index <= 0) || (Index > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
            {
                throw new EScriptError("Sector index out of bounds");
            }
        }

        // procedure Split(const Line : string; var Strings : TStringList; const Delimiters : string = ''); // default string parameter should be blank
        // var
        // Separators,
        // WhiteSpace : set of Char; // set of Char
        // I : Integer;
        // begin
        // if (Delimiters <> '') then // Delimiters were specified
        // begin
        // Separators := [];
        // for I := 1 to Length(Delimiters) do
        // Separators := Separators + [Delimiters[I]];
        // end
        // else
        // Separators := [#9, #32]; // Tab and Space, if omitted
        // 
        // WhiteSpace := [];
        // ExtractStrings(Separators, WhiteSpace, @Line[1], TStrings(Strings));
        // end;
        // *****************************************************************************
        // SCRIPT COMMAND IMPLEMENTATION
        // *****************************************************************************
        public static TCmdAction CmdAdd(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            double F1;
            double F2;
            // CMD: add var <value>
            // add a value to a variable
            F1 = __Params[0].DecValue;
            F2 = __Params[1].DecValue;
            UpdateParam(__Params[0], F1 + F2, ((TScript)(Script)).DecimalPrecision);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdAddMenu(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string LabelName;
            // CMD: addMenu <parent> <name> <description> <hotkey> <reference> <prompt> <closeMenu>
            if ((__Params[3].Value.Length != 1))
            {
                throw new EScriptError("Bad menu hotkey");
            }
            LabelName = __Params[4].Value;
            if ((LabelName != ""))
            {
                ((TScript)(Script)).Cmp.ExtendLabelName(ref LabelName, ((TScript)(Script)).ExecScript);
            }
            ((TScript)(Script)).AddMenu(Global.Units.Global.TWXMenu.AddCustomMenu(__Params[0].Value.ToUpper(), __Params[1].Value.ToUpper(), __Params[2].Value, LabelName, __Params[5].Value, Char.ToUpper(__Params[3].Value[1]), (__Params[6].Value == '1'), ((TScript)(Script))));
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdAnd(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            bool B1;
            bool B2;
            // CMD: and var <value>
            ConvertToBoolean(__Params[0], ref B1);
            ConvertToBoolean(__Params[1], ref B2);
            __Params[0].Value = ConvertBoolToString(B1 && B2);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdBranch(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: branch <value> <label>
            // goto <label> if <value> <> 1
            // if (Params[0].Value <> '1') then
            // TScript(Script).GotoLabel(Params[1].Value);
            // if NearEqual(Params[0].DecValue, 1, 1) then // Calling NearEqual calls UpdatePrecision and breaks things
            if ((__Params[0].DecValue == 1) || (Math.Round(__Params[0].DecValue) == 1))
            {
            // Should short-circuit
            }
            else
            {
                ((TScript)(Script)).GotoLabel(__Params[1].Value);
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdClearAllAvoids(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: clearAllAvoids
            Global.Units.Global.TWXDatabase.UnsetAllVoids();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdClearAvoid(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: clearAvoid <Sector>
            try {
                Global.Units.Global.TWXDatabase.UnsetVoid(Convert.ToInt32(__Params[0].Value));
            }
            catch {
                throw new EScriptError('\'' + __Params[0].Value + "\' is not a Sector number");
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdClientMessage(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: ClientMessage <value>
            Global.Units.Global.TWXServer.ClientMessage(__Params[0].Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdCloseMenu(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: closeMenu
            Global.Units.Global.TWXMenu.CloseMenu(false);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdConnect(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: connect
            if (!(Global.Units.Global.TWXClient.Connected))
            {
                Global.Units.Global.TWXClient.Connect();
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdCutLengths(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            List<string> Lengths;
            List<string> Strings;
            int I;
            int IntLength;
            int Position;
            string S;
            // CMD: cutLengths <value> array <lengths1,length2,...>
            Lengths = new List<string>();
            Strings = new List<string>();
            try {
                Utility.Units.Utility.Split(__Params[2].Value, ref Lengths, ',');
                Position = 1;
                I = 0;
                while ((I < Lengths.Count) && (Position < __Params[0].Value.Length))
                {
                    IntLength = Convert.ToInt32(Lengths[I]);
                    S = __Params[0].Value.Substring(Position - 1 ,IntLength);
                    Strings.Add(S);
                    Position += IntLength;
                    I ++;
                }
                __Params[1].Value = (Strings.Count).ToString();
                ((TVarParam)(__Params[1])).SetArrayFromStrings(Strings);
            } finally {
                //@ Unsupported property or method(C): 'Free'
                Lengths.Free;
                //@ Unsupported property or method(C): 'Free'
                Strings.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdCutText(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int V1;
            int V2;
            // CMD: cutText <value> var <start> <length>
            ConvertToNumber(__Params[2].Value, ref V1);
            ConvertToNumber(__Params[3].Value, ref V2);
            if ((V1 > __Params[0].Value.Length))
            {
                throw new EScriptError("CutText: Start position beyond End Of Line");
            }
            __Params[1].Value = __Params[0].Value.Substring(V1 - 1 ,V2);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdDelete(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // display 'Value assigned to 'I' never used'
            System.IO.File F;
            // CMD: delete <filename>
            // EP - Safety: Make sure the target is not in a parent directory
            if ((__Params[0].Value.Substring(0 - 1 ,3) != "..\\"))
            {
                F = new FileInfo(__Params[0].Value);
                F.Delete();
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdDisconnect(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: disconnect
            if ((Global.Units.Global.TWXClient.Connected))
            {
                Global.Units.Global.TWXClient.Disconnect();
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdDivide(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            double F1;
            double F2;
            // CMD: divide var <value>
            // divide variable by a value
            F2 = __Params[1].DecValue;
            if ((F2 == 0))
            {
                throw new EScriptError("Division by zero");
            }
            F1 = __Params[0].DecValue;
            UpdateParam(__Params[0], F1 / F2, ((TScript)(Script)).DecimalPrecision);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdEcho(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string EchoText;
            int I;
            // CMD: echo <values...>
            // string together the parameters and echo to all terms
            for (I = 0; I < __Params.Length; I ++ )
            {
                EchoText = EchoText + __Params[I].Value;
            }
            // #13 on its own will warp the terminal display - add a linefeed with it
            Global.Units.Global.TWXServer.Broadcast(EchoText.Replace('\r', '\r' + '\n'));
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdFileExists(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: fileExists var <filename>
            if ((File.Exists(__Params[1].Value)))
            {
                __Params[0].Value = '1';
            }
            else
            {
                __Params[0].Value = '0';
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdFormat(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            DateTime OutVar;
            // Float1 : Extended;
            // CMD: format InputVar OutputVar CONSTANT
            if ((__Params[2].Value == "CURRENCY"))
            {
                // ($4,567.22)
                try {
                    //@ Undeclared identifier(3): 'ffCurrency'
                    __Params[1].Value = Convert.ToString(__Params[0].DecValue);
                }
                catch(Exception E) {
                    // Broadcast the exception
                    throw new EScriptError("Invalid Currency value");
                }
            }
            if ((__Params[2].Value == "NUMBER"))
            {
                // (4,567.(PRECISION))
                try {
                    //@ Undeclared identifier(3): 'ffNumber'
                    __Params[1].Value = Convert.ToString(__Params[0].DecValue);
                // Unsure if the 19 sig digits is ideal
                // Alternately
                // Float1 := Params[0].DecValue;
                // Params[1].Value := Format('%n', [Float1]); // This command needs Precision decimals
                // 
                }
                catch(Exception E) {
                    throw new EScriptError("Invalid Number value");
                }
            }
            if ((__Params[2].Value == "DATETIMETOSTR"))
            {
                try {
                    __Params[1].Value = (__Params[0].DecValue).ToString();
                }
                catch(Exception E) {
                    // Broadcast the exception
                    throw new EScriptError("Invalid DateTime value");
                }
            }
            if ((__Params[2].Value == "STRTODATETIME"))
            {
                try {
                    OutVar = Convert.ToDateTime(__Params[0].Value);
                    UpdateParam(__Params[1], OutVar, 15);
                }
                catch(Exception E) {
                    throw new EScriptError("Invalid String value for DateTime conversion");
                }
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetAllCourses(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            int StartSect;
            ArrayList Course;
            ArrayList[] CourseArrays;
            // CMD: getAllCourses <2-DimensionArrayName> <StartingSector>
            ConvertToNumber(__Params[1].Value, ref StartSect);
            CheckSector(StartSect);
            CourseArrays = new ArrayList[Global.Units.Global.TWXDatabase.DBHeader.Sectors];
            // This line is necessary to populate the Database's ReverseArray
            Course = Global.Units.Global.TWXDatabase.PlotWarpCourse(StartSect, 0);
            try {
                Global.Units.Global.TWXDatabase.CoursesToTLists(ref CourseArrays);
                for (I = 0; I < Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
                {
                    Utility.Units.Utility.ReverseTList(ref CourseArrays[I]);
                }
                // end
                ((TVarParam)(__Params[0])).SetMultiArraysFromLists(CourseArrays);
            } finally {
                //@ Unsupported property or method(C): 'Free'
                Course.Free;
                for (I = 0; I < CourseArrays.Length; I ++ )
                {
                    //@ Unsupported property or method(C): 'Free'
                    CourseArrays[I].Free;
                }
            // end
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetCharCode(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: getCharCode <char> resultVar
            if ((__Params[0].Value.Length != 1))
            {
                throw new EScriptError("Bad character");
            }
            __Params[1].Value = (((byte)((char)__Params[0].Value[1]))).ToString();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetConsoleInput(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: getConsoleInput var [singleKey?]
            ((TScript)(Script)).Locked = true;
            Global.Units.Global.TWXMenu.BeginScriptInput(((TScript)(Script)), ((TVarParam)(__Params[0])), (__Params.Length == 2));
            result = ScriptRef.TCmdAction.caPause;
            return result;
        }

        public static TCmdAction CmdGetCourse(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            ArrayList Course;
            int FromSect;
            int ToSect;
            // CMD: getCourse varspec <fromSector> <toSector>
            ConvertToNumber(__Params[1].Value, ref FromSect);
            ConvertToNumber(__Params[2].Value, ref ToSect);
            CheckSector(FromSect);
            CheckSector(ToSect);
            Course = Global.Units.Global.TWXDatabase.PlotWarpCourse(FromSect, ToSect);
            try {
                __Params[0].Value = (Course.Count - 1).ToString();
                if ((Course.Count > 0))
                {
                    // Need to reverse the lists order
                    Utility.Units.Utility.ReverseTList(ref Course);
                    ((TVarParam)(__Params[0])).SetArrayFromList(Course);
                }
            } finally {
                //@ Unsupported property or method(C): 'Free'
                Course.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetDate(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: getDate var
            if ((__Params.Length == 2))
            {
                //@ Unsupported function or procedure: 'FormatDateTime'
                __Params[0].Value = FormatDateTime(__Params[1].Value, DateTime.Now);
            }
            else
            {
                __Params[0].Value = (DateTime.Now).ToString();
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetDirList(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            TSearchRec SearchRec;
            string Mask;
            List<string> List;
            // CMD: getDirList varArray <FileMask>
            if ((__Params.Length == 1))
            {
                Mask = '*';
            }
            else
            {
                // EP - Need to make sure Mask doesn't contain "..", so only subdirs can be enumerated
                Mask = __Params[1].Value;
            }
            List = new List<string>();
            try {
                //@ Unsupported function or procedure: 'FindFirst'
                if (FindFirst(Mask, 0x00000010, SearchRec) == 0)
                {
                    do
                    {
                    // and not faDirectory
                        //@ Unsupported property or method(C): 'Attr'
                        if ((SearchRec.Attr && 0x00000010) == 0x00000010)
                        {
                            //@ Unsupported property or method(C): 'Name'
                            //@ Unsupported property or method(C): 'Name'
                            if ((SearchRec.Name != '.') && (SearchRec.Name != ".."))
                            {
                                //@ Unsupported property or method(C): 'Name'
                                List.Add(SearchRec.Name);
                            }
                        }
                        //@ Unsupported function or procedure: 'FindNext'
                    } while (!(FindNext(SearchRec) != 0));
                    //@ Unsupported function or procedure: 'FindClose'
                    FindClose(SearchRec);
                }
                ((TVarParam)(__Params[0])).SetArrayFromStrings(List);
                __Params[0].Value = (List.Count).ToString();
            } finally {
                //@ Unsupported property or method(C): 'Free'
                List.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetDistance(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            ArrayList Course;
            int FromSect;
            int ToSect;
            // CMD: getDistance var <fromSector> <toSector>
            ConvertToNumber(__Params[1].Value, ref FromSect);
            ConvertToNumber(__Params[2].Value, ref ToSect);
            CheckSector(FromSect);
            CheckSector(ToSect);
            Course = Global.Units.Global.TWXDatabase.PlotWarpCourse(FromSect, ToSect);
            try {
                __Params[0].Value = (Course.Count - 1).ToString();
            } finally {
                //@ Unsupported property or method(C): 'Free'
                Course.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetFileList(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            TSearchRec SearchRec;
            string Mask;
            List<string> List;
            // CMD: getFileList varArray <FileMask>
            if ((__Params.Length == 1))
            {
                Mask = '*';
            }
            else
            {
                Mask = __Params[1].Value;
                Utility.Units.Utility.Replace(ref Mask, '\r', '*');
            }
            List = new List<string>();
            try {
                //@ Unsupported function or procedure: 'FindFirst'
                if (FindFirst(Mask, 0x0000003f & ~0x00000010, SearchRec) == 0)
                {
                    do
                    {
                    // and not faDirectory
                        //@ Unsupported property or method(C): 'Name'
                        List.Add(SearchRec.Name);
                        //@ Unsupported function or procedure: 'FindNext'
                    } while (!(FindNext(SearchRec) != 0));
                    //@ Unsupported function or procedure: 'FindClose'
                    FindClose(SearchRec);
                }
                ((TVarParam)(__Params[0])).SetArrayFromStrings(List);
                __Params[0].Value = (List.Count).ToString();
            } finally {
                //@ Unsupported property or method(C): 'Free'
                List.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetInput(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: getInput var <prompt>
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + __Params[1].Value + Core.Units.Core.endl);
            ((TScript)(Script)).Locked = true;
            Global.Units.Global.TWXMenu.BeginScriptInput(((TScript)(Script)), ((TVarParam)(__Params[0])), false);
            result = ScriptRef.TCmdAction.caPause;
            return result;
        }

        public static TCmdAction CmdGetLength(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: getLength <text> var
            __Params[1].Value = (__Params[0].Value.Length).ToString();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetMenuValue(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: getMenuValue <menuName> var
            try {
                __Params[1].Value = Global.Units.Global.TWXMenu.GetMenuByName(__Params[0].Value.ToUpper()).Value;
            }
            catch(Exception E) {
                throw new EScriptError(E.Message);
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetNearestWarps(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int StartSect;
            List<string> StrList;
            ArrayList CourseList;
            // CMD: getNearestWarps <ArrayName> <StartingSector>
            ConvertToNumber(__Params[1].Value, ref StartSect);
            CheckSector(StartSect);
            CourseList = Global.Units.Global.TWXDatabase.PlotWarpCourse(StartSect, 0);
            try {
                StrList = Global.Units.Global.TWXDatabase.QueArrayToStringList();
                try {
                    __Params[0].Value = (StrList.Count).ToString();
                    if ((StrList.Count > 0))
                    {
                        ((TVarParam)(__Params[0])).SetArrayFromStrings(StrList);
                    }
                } finally {
                    //@ Unsupported property or method(C): 'Free'
                    StrList.Free;
                }
            } finally {
                //@ Unsupported property or method(C): 'Free'
                CourseList.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetOutText(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: getOutText var
            __Params[0].Value = ((TScript)(Script)).OutText;
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetRnd(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int RndMin;
            int RndMax;
            // CMD: getRnd var <lowestValue> <highestValue>
            ConvertToNumber(__Params[1].Value, ref RndMin);
            ConvertToNumber(__Params[2].Value, ref RndMax);
            __Params[0].Value = (Convert.ToInt64((new System.Random(RndMax + 1 - RndMin)).Next() + RndMin)).ToString();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetScriptVersion(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            System.IO.File F;
            ShortHdr Hdr;
            // CMD: getScriptVersion <fileName> var
            if (!(File.Exists(__Params[0].Value)))
            {
                throw new EScriptError("File \'" + __Params[0].Value + "\' not found");
                return result;
            }
            else
            {
                F = new FileInfo(__Params[0].Value);
                _R_1 = F.OpenText();
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, Hdr, sizeof(Hdr));
                if ((Hdr.ProgramName != "TWX SCRIPT"))
                {
                    _W_0.Close();
                    throw new EScriptError("File is not a compiled TWX script");
                    return result;
                }
                __Params[1].Value = (Hdr.Version).ToString();
                _W_0.Close();
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetSector(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            int Index;
            TSector S;
            ArrayList Items;
            string VarName;
            // CMD: getSector <index> var
            ConvertToNumber(__Params[0].Value, ref Index);
            CheckSector(Index);
            S = Global.Units.Global.TWXDatabase.Sectors[Index];
            VarName = ((TVarParam)(__Params[1])).Name;
            result = ScriptRef.TCmdAction.caNone;
            TScript _wvar1 = ((TScript)Script);
            if ((S.Explored == DataBase.TSectorExploredType.etNo))
            {
                _wvar1.SetVariable(VarName + ".EXPLORED", "NO", "");
            }
            else if ((S.Explored == DataBase.TSectorExploredType.etCalc))
            {
                _wvar1.SetVariable(VarName + ".EXPLORED", "CALC", "");
            }
            else if ((S.Explored == DataBase.TSectorExploredType.etDensity))
            {
                _wvar1.SetVariable(VarName + ".EXPLORED", "DENSITY", "");
            }
            else if ((S.Explored == DataBase.TSectorExploredType.etHolo))
            {
                _wvar1.SetVariable(VarName + ".EXPLORED", "YES", "");
            }
            _wvar1.SetVariable(VarName + ".INDEX", (Index).ToString(), "");
            _wvar1.SetVariable(VarName + ".BEACON", S.Beacon, "");
            _wvar1.SetVariable(VarName + ".CONSTELLATION", S.Constellation, "");
            _wvar1.SetVariable(VarName + ".ARMIDMINES.QUANTITY", (S.Mines_Armid.Quantity).ToString(), "");
            _wvar1.SetVariable(VarName + ".LIMPETMINES.QUANTITY", (S.Mines_Limpet.Quantity).ToString(), "");
            _wvar1.SetVariable(VarName + ".ARMIDMINES.OWNER", S.Mines_Armid.Owner, "");
            _wvar1.SetVariable(VarName + ".LIMPETMINES.OWNER", S.Mines_Limpet.Owner, "");
            _wvar1.SetVariable(VarName + ".FIGS.QUANTITY", (S.Figs.Quantity).ToString(), "");
            _wvar1.SetVariable(VarName + ".FIGS.OWNER", S.Figs.Owner, "");
            _wvar1.SetVariable(VarName + ".WARPS", (S.Warps).ToString(), "");
            _wvar1.SetVariable(VarName + ".DENSITY", (S.Density).ToString(), "");
            _wvar1.SetVariable(VarName + ".NAVHAZ", (S.NavHaz).ToString(), "");
            for (I = 1; I <= 6; I ++ )
            {
                _wvar1.SetVariable(VarName + ".WARP", (S.Warp[I]).ToString(), (I).ToString());
            }
            _wvar1.SetVariable(VarName + ".UPDATED", (S.UpDate).ToString() + ' ' + S.UpDate.ToString(), "");
            _wvar1.SetVariable(VarName + ".PORT.NAME", S.SPort.Name, "");
            if ((S.Figs.FigType == DataBase.TFighterType.ftToll))
            {
                _wvar1.SetVariable(VarName + ".FIGS.TYPE", "TOLL", "");
            }
            else if ((S.Figs.FigType == DataBase.TFighterType.ftDefensive))
            {
                _wvar1.SetVariable(VarName + ".FIGS.TYPE", "DEFENSIVE", "");
            }
            else
            {
                _wvar1.SetVariable(VarName + ".FIGS.TYPE", "OFFENSIVE", "");
            }
            if ((S.Anomaly))
            {
                _wvar1.SetVariable(VarName + ".ANOMALY", "YES", "");
            }
            else
            {
                _wvar1.SetVariable(VarName + ".ANOMALY", "NO", "");
            }
            if ((S.SPort.Name == ""))
            {
                _wvar1.SetVariable(VarName + ".PORT.CLASS", '0', "");
                _wvar1.SetVariable(VarName + ".PORT.EXISTS", '0', "");
            }
            else
            {
                _wvar1.SetVariable(VarName + ".PORT.CLASS", (S.SPort.ClassIndex).ToString(), "");
                _wvar1.SetVariable(VarName + ".PORT.EXISTS", '1', "");
                _wvar1.SetVariable(VarName + ".PORT.BUILDTIME", (S.SPort.BuildTime).ToString(), "");
                _wvar1.SetVariable(VarName + ".PORT.PERC_ORE", (S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre]).ToString(), "");
                _wvar1.SetVariable(VarName + ".PORT.PERC_ORG", (S.SPort.ProductPercent[DataBase.TProductType.ptOrganics]).ToString(), "");
                _wvar1.SetVariable(VarName + ".PORT.PERC_EQUIP", (S.SPort.ProductPercent[DataBase.TProductType.ptEquipment]).ToString(), "");
                _wvar1.SetVariable(VarName + ".PORT.ORE", (S.SPort.ProductAmount[DataBase.TProductType.ptFuelOre]).ToString(), "");
                _wvar1.SetVariable(VarName + ".PORT.ORG", (S.SPort.ProductAmount[DataBase.TProductType.ptOrganics]).ToString(), "");
                _wvar1.SetVariable(VarName + ".PORT.EQUIP", (S.SPort.ProductAmount[DataBase.TProductType.ptEquipment]).ToString(), "");
                _wvar1.SetVariable(VarName + ".PORT.UPDATED", (S.SPort.UpDate).ToString() + ' ' + S.SPort.UpDate.ToString(), "");
                if ((S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]))
                {
                    _wvar1.SetVariable(VarName + ".PORT.BUY_ORE", "YES", "");
                }
                else
                {
                    _wvar1.SetVariable(VarName + ".PORT.BUY_ORE", "NO", "");
                }
                if ((S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]))
                {
                    _wvar1.SetVariable(VarName + ".PORT.BUY_ORG", "YES", "");
                }
                else
                {
                    _wvar1.SetVariable(VarName + ".PORT.BUY_ORG", "NO", "");
                }
                if ((S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                {
                    _wvar1.SetVariable(VarName + ".PORT.BUY_EQUIP", "YES", "");
                }
                else
                {
                    _wvar1.SetVariable(VarName + ".PORT.BUY_EQUIP", "NO", "");
                }
            }
            // set planet variables
            Items = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itPlanet, S);
            _wvar1.SetVariable(VarName + ".PLANETS", (Items.Count).ToString(), "");
            I = 0;
            while ((Items.Count > 0))
            {
                I ++;
                _wvar1.SetVariable(VarName + ".PLANET", ((TPlanet)(Items[0])).Name, (I).ToString());
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(Items[0]);
                Items.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            Items.Free;
            // set trader variables
            Items = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itTrader, S);
            _wvar1.SetVariable(VarName + ".TRADERS", (Items.Count).ToString(), "");
            I = 0;
            while ((Items.Count > 0))
            {
                I ++;
                _wvar1.SetVariable(VarName + ".TRADER.NAME", ((TTrader)(Items[0])).Name, (I).ToString());
                _wvar1.SetVariable(VarName + ".TRADER.SHIP", ((TTrader)(Items[0])).ShipType, (I).ToString());
                _wvar1.SetVariable(VarName + ".TRADER.SHIPNAME", ((TTrader)(Items[0])).ShipName, (I).ToString());
                _wvar1.SetVariable(VarName + ".TRADER.FIGS", (((TTrader)(Items[0])).Figs).ToString(), (I).ToString());
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(Items[0]);
                Items.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            Items.Free;
            // set ship variables
            Items = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itShip, S);
            _wvar1.SetVariable(VarName + ".SHIPS", (Items.Count).ToString(), "");
            I = 0;
            while ((Items.Count > 0))
            {
                I ++;
                _wvar1.SetVariable(VarName + ".SHIP.NAME", ((TShip)(Items[0])).Name, (I).ToString());
                _wvar1.SetVariable(VarName + ".SHIP.SHIP", ((TShip)(Items[0])).ShipType, (I).ToString());
                _wvar1.SetVariable(VarName + ".SHIP.OWNER", ((TShip)(Items[0])).Owner, (I).ToString());
                _wvar1.SetVariable(VarName + ".SHIP.FIGS", (((TTrader)(Items[0])).Figs).ToString(), (I).ToString());
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(Items[0]);
                Items.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            Items.Free;
            // set backdoors
            if ((S.Explored != DataBase.TSectorExploredType.etNo))
            {
                Items = Global.Units.Global.TWXDatabase.GetBackDoors(S, Index);
                I = 0;
                while ((Items.Count > 0))
                {
                    I ++;
                    _wvar1.SetVariable(VarName + ".BACKDOOR", (((ushort)Items[0])).ToString(), (I).ToString());
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(Items[0]);
                    Items.RemoveAt(0);
                }
                //@ Unsupported property or method(C): 'Free'
                Items.Free;
            }
            return result;
        }

        public static TCmdAction CmdGetSectorParameter(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int Index;
            // CMD: getSectorParameter <sectorIndex> <parameterName> var
            ConvertToNumber(__Params[0].Value, ref Index);
            CheckSector(Index);
            if ((__Params[1].Value.Length > 10))
            {
                throw new EScriptError(SCSectorParameterError);
            }
            if ((__Params[2].Value.Length > 40))
            {
                throw new EScriptError(SCSectorParameterValueError);
            }
            __Params[2].Value = Global.Units.Global.TWXDatabase.GetSectorVar(Index, __Params[1].Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetText(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string S;
            string Line;
            string StartStr;
            string EndStr;
            int StartPos;
            int EndPos;
            // CMD: getText <line> var <startValue> <endValue>
            Line = __Params[0].Value;
            StartStr = __Params[2].Value;
            EndStr = __Params[3].Value;
            if ((StartStr == ""))
            {
                StartPos = 1;
            }
            else
            {
                StartPos = Line.IndexOf(StartStr);
            }
            if ((StartPos == 0))
            {
                __Params[1].Value = "";
                result = ScriptRef.TCmdAction.caNone;
                return result;
            }
            StartPos += StartStr.Length;
            Line = Line.Substring(StartPos - 1 ,Line.Length - StartPos + 1);
            if ((EndStr == ""))
            {
                EndPos = Line.Length + 1;
            }
            else
            {
                EndPos = Line.IndexOf(EndStr);
            }
            if ((EndPos > 0))
            {
                S = Line.Substring(1 - 1 ,EndPos - 1);
                __Params[1].Value = S;
            }
            else
            {
                __Params[1].Value = "";
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetTime(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: getTime var [<format>]
            if ((__Params.Length == 2))
            {
                //@ Unsupported function or procedure: 'FormatDateTime'
                __Params[0].Value = FormatDateTime(__Params[1].Value, DateTime.Now);
            }
            else
            {
                __Params[0].Value = DateTime.Now.ToString();
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetTimer(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            __Params[0].Value = (Utility.rdtsc()).ToString();
            // 
            // Params[0].Value := IntToStr(Utility.rdtsc);
            // Params[0].IsNumeric := FALSE; // EP - I could've done a float->str conversion, but we'll wait till we use it
            // 
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetWord(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            // CMD: getWord <line> var <index> <default>
            ConvertToNumber(__Params[2].Value, ref I);
            __Params[1].Value = Utility.Units.Utility.GetParameter(__Params[0].Value, I);
            if ((__Params[1].Value == ""))
            {
                if ((__Params.Length > 3))
                {
                    __Params[1].Value = __Params[3].Value;
                }
                else
                {
                    __Params[1].Value = '0';
                }
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetWordCount(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            int WordCount;
            string Line;
            char Last;
            // CMD: getWordCount <text> storageVar
            // EP: Ideally add CmdTextToArray command to speed up line parsing.
            WordCount = 0;
            Last = ' ';
            Line = __Params[0].Value;
            for (I = 1; I <= Line.Length; I ++ )
            {
                if ((Line[I] != ' ') && (Line[I] != "\09"))
                {
                    // If it isn't white space
                    if ((Last == ' ') || (Last == "\09"))
                    {
                        // but previously was
                        WordCount ++;
                    }
                }
                // then it's a new word
                Last = Line[I];
            }
            __Params[1].Value = (WordCount).ToString();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGetWordPos(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: getWordPos <text> storageVar <subString>
            __Params[1].Value = (__Params[0].Value.IndexOf(__Params[2].Value)).ToString();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGosub(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: gosub <label>
            ((TScript)(Script)).Gosub(__Params[0].Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdGoto(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: goto <label>
            ((TScript)(Script)).GotoLabel(__Params[0].Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdHalt(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: halt
            result = ScriptRef.TCmdAction.caStop;
            return result;
        }

        public static TCmdAction CmdIsEqual(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            bool __Bool;
            // CMD: isEqual var <value1> <value2>
            // var = 1 if <value1> = <value2> else var = 0
            try {
                // The difference must be within MaxFloatVariance to be considered equal
                __Bool = Math.Abs(__Params[1].DecValue - __Params[2].DecValue) <= MaxFloatVariance;
                __Params[0].SetBool(__Bool);
            }
            catch(EScriptError E) {
                // Float comparison failed, try string comparison
                __Params[0].SetBool(__Params[1].Value.Equals(__Params[2].Value));
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdIsGreater(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            bool __Bool;
            // CMD: isGreater var <value1> <value2>
            // var = 1 if <value1> > <value2> else var = 0
            __Bool = ((__Params[1].DecValue - MaxFloatVariance) > __Params[2].DecValue);
            __Params[0].SetBool(__Bool);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdIsGreaterEqual(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            bool __Bool;
            // CMD: isGreaterEqual var <value1> <value2>
            // var = 1 if <value1> >= <value2> else var = 0
            __Bool = ((__Params[1].DecValue - MaxFloatVariance) >= __Params[2].DecValue) || (Math.Abs(__Params[1].DecValue - __Params[2].DecValue) <= MaxFloatVariance);
            __Params[0].SetBool(__Bool);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdIsLesser(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            bool __Bool;
            // CMD: isLesser var <value1> <value2>
            // var = 1 if <value1> < <value2> else var = 0
            __Bool = ((__Params[1].DecValue + MaxFloatVariance) < __Params[2].DecValue);
            __Params[0].SetBool(__Bool);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdIsLesserEqual(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            bool __Bool;
            // CMD: isLesserEqual var <value1> <value2>
            // var = 1 if <value1> <= <value2> else var = 0
            // .01 <= .0099, and MaxVariance = .005 (Precision = 2), these should evaluate equal
            // Bool := (Params[1].DecValue - Params[2].DecValue) <= MaxFloatVariance;
            __Bool = ((__Params[1].DecValue + MaxFloatVariance) <= __Params[2].DecValue) || (Math.Abs(__Params[1].DecValue - __Params[2].DecValue) <= MaxFloatVariance);
            __Params[0].SetBool(__Bool);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdIsNotEqual(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            bool __Bool;
            // CMD: isNotEqual var <value1> <value2>
            // var = 1 if <value1> <> <value2> else var = 0
            try {
                __Bool = Math.Abs(__Params[1].DecValue - __Params[2].DecValue) > MaxFloatVariance;
                __Params[0].SetBool(__Bool);
            }
            catch(EScriptError E) {
                // Float comparison failed, try string comparison
                __Params[0].SetBool(__Params[1].Value.Equals(__Params[2].Value) == false);
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdIsNumber(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // Disable 'Value assigned to F is never used'
            double F;
            try {
                F = __Params[1].DecValue;
                __Params[0].DecValue = 1;
            }
            catch(Exception E) {
                __Params[0].DecValue = 0;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdKillAllTriggers(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: killAllTriggers
            ((TScript)(Script)).KillAllTriggers();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdKillTrigger(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: killTrigger <name>
            ((TScript)(Script)).KillTrigger(__Params[0].Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdKillWindow(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            TScriptWindow Window;
            // CMD: killWindow <windowName>
            Window = ((TScript)(Script)).FindWindow(__Params[0].Value);
            ((TScript)(Script)).RemoveWindow(Window);
            //@ Unsupported property or method(C): 'Free'
            Window.Free;
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdListActiveScripts(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            List<string> Scripts;
            // CMD: listActiveScripts <ArrayName>
            Scripts = new List<string>();
            try {
                for (I = 0; I < Global.Units.Global.TWXInterpreter.Count; I ++ )
                {
                    Scripts.Add(Global.Units.Global.TWXInterpreter[I].ScriptName);
                    ((TVarParam)(__Params[0])).SetArrayFromStrings(Scripts);
                    __Params[0].Value = (Scripts.Count).ToString();
                }
            } finally {
                //@ Unsupported property or method(C): 'Free'
                Scripts.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdListAvoids(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            ArrayList Avoids;
            // CMD: listAvoids <ArrayName>
            Avoids = Global.Units.Global.TWXDatabase.VoidList();
            try {
                ((TVarParam)(__Params[0])).SetArrayFromList(Avoids);
                __Params[0].Value = (Avoids.Count).ToString();
            } finally {
                //@ Unsupported property or method(C): 'Free'
                Avoids.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdListSectorParameters(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            List<string> ParamList;
            // CMD: listSectorParameters <SectorIndex> <ArrayName>
            ConvertToNumber(__Params[0].Value, ref I);
            ParamList = Global.Units.Global.TWXDatabase.ListSectorVars(I);
            try {
                ((TVarParam)(__Params[1])).SetArrayFromStrings(ParamList);
                __Params[1].Value = (ParamList.Count).ToString();
            } finally {
                //@ Unsupported property or method(C): 'Free'
                ParamList.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdLoad(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: load <scriptName>
            Global.Units.Global.TWXInterpreter.Load(Utility.Units.Utility.FetchScript(__Params[0].Value, false), false);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdLoadVar(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            FileStream INI;
            // CMD: loadVar var
            INI = new FileStream(((TScript)(Script)).ProgramDir + '\\' + Utility.Units.Utility.StripFileExtension(Global.Units.Global.TWXDatabase.DatabaseName) + ".cfg");
            try {
                //@ Unsupported property or method(A): 'ReadString'
                __Params[0].Value = INI.ReadString("Variables", ((TVarParam)(__Params[0])).Name, '0');
            } finally {
                //@ Unsupported property or method(C): 'Free'
                INI.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdLogging(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: logging <value>
            ((TScript)(Script)).LogData = (__Params[0].Value.ToUpper() == "ON") || (__Params[0].Value == '1');
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdLowerCase(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: lowerCase var
            __Params[0].Value = __Params[0].Value.ToLower();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdMakeDir(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: MakeDir <directory name>
            if ((__Params[0].Value.Substring(0 - 1 ,3) != "..\\"))
            {
                Directory.CreateDirectory(__Params[0].Value);
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdMergeText(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: mergeText <value1> <value2> var
            // Concatenate two values and store the result
            __Params[2].Value = __Params[0].Value + __Params[1].Value;
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdMultiply(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            double F1;
            double F2;
            // CMD: multiply var <value>
            // multiply a variable by a value
            F1 = __Params[0].DecValue;
            F2 = __Params[1].DecValue;
            UpdateParam(__Params[0], F1 * F2, ((TScript)(Script)).DecimalPrecision);
            // 
            // F1 := ConvertToFloat(Params[0]);
            // F2 := ConvertToFloat(Params[1]);
            // UpdateParam(Params[0], F1 * F2, TScript(Script).DecimalPrecision);
            // 
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdOpenMenu(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: openMenu <name> [<pause>]
            // Eg: openMenu TWX_SHOWSPECIALPORT FALSE
            try {
                Global.Units.Global.TWXMenu.OpenMenu(__Params[0].Value.ToUpper(), 0);
            }
            catch(Exception E) {
                throw new EScriptError(E.Message);
            }
            if ((__Params.Length > 1) && (__Params[1].Value == '0'))
            {
                result = ScriptRef.TCmdAction.caNone;
            }
            else
            {
                result = ScriptRef.TCmdAction.caPause;
            }
            return result;
        }

        public static TCmdAction CmdOr(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            bool B1;
            bool B2;
            // CMD: or var <value>
            ConvertToBoolean(__Params[0], ref B1);
            ConvertToBoolean(__Params[1], ref B2);
            __Params[0].Value = ConvertBoolToString(B1 || B2);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdPadLeft(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            string Pad;
            // CMD: padLeft var <value>
            // add spaces to the left of a variable
            Pad = "";
            for (I = __Params[0].Value.Length; I <= Convert.ToInt64(__Params[1].DecValue - 1); I ++ )
            {
                Pad = ' ' + Pad;
            }
            __Params[0].Value = Pad + __Params[0].Value;
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdPadRight(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            string Pad;
            // CMD: padRight var <value>
            // add spaces to the right of a variable
            Pad = "";
            for (I = __Params[0].Value.Length; I <= Convert.ToInt64(__Params[1].DecValue - 1); I ++ )
            {
                Pad = ' ' + Pad;
            }
            __Params[0].Value = __Params[0].Value + Pad;
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdPause(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: pause
            result = ScriptRef.TCmdAction.caPause;
            return result;
        }

        public static TCmdAction CmdProcessIn(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: processIn processType <text>
            if ((__Params[0].Value == '1'))
            {
                // process globally for all scripts
                ((TScript)(Script)).Controller.TextEvent(__Params[1].Value, true);
                ((TScript)(Script)).Controller.TextLineEvent(__Params[1].Value, true);
            }
            else
            {
                // process locally only
                ((TScript)(Script)).TextEvent(__Params[1].Value, true);
                ((TScript)(Script)).TextLineEvent(__Params[1].Value, true);
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdProcessOut(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: processOut <text>
            if (!(Global.Units.Global.TWXInterpreter.TextOutEvent(__Params[0].Value, ((TScript)(Script)))))
            {
                Global.Units.Global.TWXClient.Send(__Params[0].Value);
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdRead(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // Declared in Unit Var list:
            // LastFileRead : String;
            // LastFileModified : TFileTime;
            // LastFileStrings : TStringArray;
            int Line;
            int FileDate;
            WIN32_FILE_ATTRIBUTE_DATA LastReadFileData;
            // CMD: read <file> storageVar <line>
            //@ Undeclared identifier(3): 'GetFileExInfoStandard'
            //@ Undeclared identifier(3): 'GetFileAttributesEx'
            if ((GetFileAttributesEx((__Params[0].Value as string), GetFileExInfoStandard, LastReadFileData)))
            {
                // If the file name or timestamp has changed, update the constants
                //@ Unsupported property or method(D): 'ftLastWriteTime'
                if ((__Params[0].Value != LastReadFilename) || (((long)LastReadFileData.ftLastWriteTime) != LastReadModTime))
                {
                    LastReadFilename = __Params[0].Value;
                    //@ Unsupported property or method(D): 'ftLastWriteTime'
                    LastReadModTime = ((long)LastReadFileData.ftLastWriteTime);
                    if (!(LastReadStrings != null))
                    {
                        LastReadStrings = new List<string>();
                    }
                    // Destroyed in the Unit's Finalize section
                    //@ Unsupported property or method(A): 'LoadFromFile'
                    LastReadStrings.LoadFromFile(__Params[0].Value);
                }
                ConvertToNumber(__Params[2].Value, ref Line);
                if ((Line > LastReadStrings.Count))
                {
                    __Params[1].Value = "EOF";
                }
                else
                {
                    __Params[1].Value = LastReadStrings[Line - 1];
                }
            }
            else
            {
                throw new EScriptError("File \'" + __Params[0].Value + "\' not found");
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdReadToArray(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: readToArray <file> <storageArray>
            List<string> fileData;
            if (!(File.Exists(__Params[0].Value)))
            {
                throw new EScriptError("File \'" + __Params[0].Value + "\' not found");
                return result;
            }
            fileData = new List<string>();
            try {
                //@ Unsupported property or method(A): 'LoadFromFile'
                fileData.LoadFromFile(__Params[0].Value);
                ((TVarParam)(__Params[1])).SetArrayFromStrings(fileData);
                __Params[1].Value = (fileData.Count).ToString();
            } finally {
                //@ Unsupported property or method(C): 'Free'
                fileData.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdRemoveDir(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: RemoveDir <directory name>
            // EP - Safety: Make sure the target is not in a parent directory
            if ((__Params[0].Value.Substring(0 - 1 ,3) != "..\\"))
            {
                Directory.Delete(__Params[0].Value);
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdRename(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: rename <oldfile> <newfile>
            if (!(File.Move(__Params[0].Value, __Params[1].Value)))
            {
                new EScriptError("Cannot rename file \'" + __Params[0].Value + '\'');
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdReplaceText(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: replaceText var <oldText> <newText>
            __Params[0].Value = __Params[0].Value.Replace(__Params[1].Value, __Params[2].Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdReqRecording(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: reqRecording
            if ((Global.Units.Global.TWXDatabase.Recording))
            {
                result = ScriptRef.TCmdAction.caNone;
            }
            else
            {
                Global.Units.Global.TWXServer.ClientMessage("This script requires recording to be enabled");
                result = ScriptRef.TCmdAction.caStop;
            }
            return result;
        }

        public static TCmdAction CmdReturn(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: return
            ((TScript)(Script)).__Return();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdRound(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            double F;
            double Fraction;
            double Point5;
            double Factor;
            int Precision;
            // CW : Word;
            // CMD: round var <precision>
            // CW := Default8087CW;
            //@ Unsupported function or procedure: 'Default8087CW'
            //@ Unsupported function or procedure: 'Set8087CW'
            Set8087CW(Default8087CW);
            if ((__Params.Length < 2))
            {
                Precision = 0;
                Factor = 1;
            }
            else
            {
                Precision = Convert.ToInt64(__Params[1].DecValue);
                Factor = RaiseToPower(10, Precision);
            }
            F = __Params[0].DecValue * Factor;
            // F := Round(F) / Factor;
            //@ Unsupported function or procedure: 'Frac'
            Fraction = Frac(F);
            Point5 = 0.5 - 1E-17;
            // add a little fuzz factor
            // 1E-19
            if ((Fraction >= Point5))
            {
                F = (Convert.ToInt32(F) + 1) / Factor;
            }
            else
            {
                F = Convert.ToInt32(F) / Factor;
            }
            UpdateParam(__Params[0], F, Precision);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSaveVar(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            FileStream INI;
            // CMD: saveVar var
            INI = new FileStream(((TScript)(Script)).ProgramDir + '\\' + Utility.Units.Utility.StripFileExtension(Global.Units.Global.TWXDatabase.DatabaseName) + ".cfg");
            try {
                //@ Unsupported property or method(A): 'WriteString'
                INI.WriteString("Variables", ((TVarParam)(__Params[0])).Name, __Params[0].Value);
            } finally {
                //@ Unsupported property or method(C): 'Free'
                INI.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSend(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string SendText;
            int I;
            // CMD: send <values...>
            // string together the parameters and echo to all terms
            for (I = 0; I < __Params.Length; I ++ )
            {
                SendText = SendText + __Params[I].Value;
            }
            Global.Units.Global.TWXClient.Send(SendText);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetArray(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            int ValInt;
            int[] Dimensions;
            // CMD: setArray var <dimensions...>
            Dimensions = new int[__Params.Length - 1];
            for (I = 1; I < __Params.Length; I ++ )
            {
                ConvertToNumber(__Params[I].Value, ref ValInt);
                Dimensions[I - 1] = ValInt;
            }
            ((TVarParam)(__Params[0])).SetArray(Dimensions);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetAvoid(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: setAvoid <Sector>
            try {
                Global.Units.Global.TWXDatabase.SetVoid(Convert.ToInt32(__Params[0].Value));
            }
            catch {
                throw new EScriptError('\'' + __Params[0].Value + "\' is not a Sector number");
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetDelayTrigger(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int Value;
            // CMD: setDelayTrigger <name> <label> <tics>
            ConvertToNumber(__Params[2].Value, ref Value);
            ((TScript)(Script)).SetDelayTrigger(__Params[0].Value, __Params[1].Value, Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetEventTrigger(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string Param;
            // CMD: setEventTrigger <name> <label> <event> [<parameter>]
            if ((__Params.Length < 4))
            {
                Param = "";
            }
            else
            {
                Param = __Params[3].Value;
            }
            ((TScript)(Script)).SetEventTrigger(__Params[0].Value, __Params[1].Value, __Params[2].Value, Param);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetMenuHelp(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: setMenuHelp <menuName> <helpText>
            try {
                Global.Units.Global.TWXMenu.GetMenuByName(__Params[0].Value.ToUpper()).Help = __Params[1].Value.Replace('\r', Core.Units.Core.endl);
            }
            catch(Exception E) {
                throw new EScriptError(E.Message);
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetMenuKey(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string S;
            // CMD: setMenuKey <value>
            S = __Params[0].Value;
            Global.Units.Global.TWXExtractor.MenuKey = S[1];
            Global.Units.Global.TWXMenu.GetMenuByName("TWX_MENUKEY").Value = Global.Units.Global.TWXExtractor.MenuKey;
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetMenuValue(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: setMenuValue <menuName> <value>
            try {
                Global.Units.Global.TWXMenu.GetMenuByName(__Params[0].Value.ToUpper()).Value = __Params[1].Value;
            }
            catch(Exception E) {
                throw new EScriptError(E.Message);
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetMenuOptions(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            TTWXMenuItem MenuItem;
            // CMD: setMenuOptions <menuName> <Q> <?> <+>
            try {
                MenuItem = Global.Units.Global.TWXMenu.GetMenuByName(__Params[0].Value.ToUpper());
            }
            catch(Exception E) {
                throw new EScriptError(E.Message);
            }
            MenuItem.SetOptions((__Params[1].Value == '1'), (__Params[2].Value == '1'), (__Params[3].Value == '1'));
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetPrecision(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int V1;
            // CMD: setPrecision <value>
            ConvertToNumber(__Params[0].Value, ref V1);
            ((TScript)(Script)).DecimalPrecision = V1;
            // EP
            LastPrecision = SetPrecision;
            SetPrecision = V1;
            LastMultiplier = Math.Pow(10, 10);
            if (SetPrecision == 0)
            {
                MaxFloatVariance = 0;
            }
            else
            {
                MaxFloatVariance = 0.5 / LastMultiplier;
            }
            // EP: Effectively half of the next decimal beyond Precision
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetProgVar(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: setProgVar <varName> <value>
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetSectorParameter(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int Index;
            // CMD: setSectorParameter <sectorIndex> <parameterName> <value>
            ConvertToNumber(__Params[0].Value, ref Index);
            CheckSector(Index);
            if ((__Params[1].Value.Length > 10))
            {
                throw new EScriptError(SCSectorParameterError);
            }
            if ((__Params[2].Value.Length > 40))
            {
                throw new EScriptError(SCSectorParameterValueError);
            }
            Global.Units.Global.TWXDatabase.SetSectorVar(Index, __Params[1].Value, __Params[2].Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetTextLineTrigger(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string Value;
            // CMD: setTextLineTrigger <name> <label> [<value>]
            if ((__Params.Length < 3))
            {
                Value = "";
            }
            else
            {
                Value = __Params[2].Value;
            }
            ((TScript)(Script)).SetTextLineTrigger(__Params[0].Value, __Params[1].Value, Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetTextOutTrigger(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string Value;
            // CMD: setTextOutTrigger <name> <label> [<value>]
            if ((__Params.Length < 3))
            {
                Value = "";
            }
            else
            {
                Value = __Params[2].Value;
            }
            ((TScript)(Script)).SetTextOutTrigger(__Params[0].Value, __Params[1].Value, Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetTextTrigger(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string Value;
            // CMD: setTextTrigger <name> <label> [<value>]
            if ((__Params.Length < 3))
            {
                Value = "";
            }
            else
            {
                Value = __Params[2].Value;
            }
            ((TScript)(Script)).SetTextTrigger(__Params[0].Value, __Params[1].Value, Value);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetVar(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            double F;
            // CMD: setVar var <value>
            if (__Params[1].IsNumeric == true)
            {
                // Params[0].DecValue := Params[1].DecValue
                // UpdateParam(Params[0], Params[1].DecValue, TScript(Script).DecimalPrecision) // this way Precision is captured
                UpdateParam(__Params[0], __Params[1].DecValue, __Params[1].SigDigits);
            }
            else
            {
                __Params[0].Value = __Params[1].Value;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSetWindowContents(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: setWindowContents <windowName> <value>
            ((TScriptWindow)(((TScript)(Script)).FindWindow(__Params[0].Value))).TextContent = __Params[1].Value;
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSound(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: sound <filename>
            //@ Undeclared identifier(3): 'SND_NODEFAULT'
            //@ Undeclared identifier(3): 'PlaySound'
            PlaySound((__Params[0].Value as string), 0, SND_NODEFAULT);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSplitText(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            string Delims;
            List<string> Strings;
            // CMD: splitText <text> varArray {delims}
            if ((__Params.Length > 2))
            {
                // Delimiters were specified
                Delims = __Params[2].Value;
            }
            else
            {
                Delims = "";
            }
            // blank delims defaults to Space and Tab
            Strings = new List<string>();
            try {
                Utility.Units.Utility.Split(__Params[0].Value, ref Strings, Delims);
                __Params[1].Value = (Strings.Count).ToString();
                ((TVarParam)(__Params[1])).SetArrayFromStrings(Strings);
            } finally {
                //@ Unsupported property or method(C): 'Free'
                Strings.Free;
            }
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdStop(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            string Name;
            // CMD: stop <scriptName>
            Name = Utility.Units.Utility.ShortFilename(Utility.Units.Utility.StripFileExtension(__Params[0].Value)).ToUpper();
            result = ScriptRef.TCmdAction.caNone;
            for (I = 0; I < Global.Units.Global.TWXInterpreter.Count; I ++ )
            {
                if ((Utility.Units.Utility.ShortFilename(Utility.Units.Utility.StripFileExtension(Global.Units.Global.TWXInterpreter[I].Cmp.ScriptFile)).ToUpper() == Name))
                {
                    if ((Global.Units.Global.TWXInterpreter[I] == Script))
                    {
                        result = ScriptRef.TCmdAction.caStop;
                    }
                    else
                    {
                        Global.Units.Global.TWXInterpreter.Stop(I);
                    }
                    break;
                }
            }
            return result;
        }

        public static TCmdAction CmdStripText(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            int I;
            string RemText;
            string Value;
            // CMD: stripText var <value>
            Value = __Params[0].Value;
            RemText = __Params[1].Value;
            I = 1;
            while ((I <= Value.Length))
            {
                if ((Value.Substring(I - 1 ,RemText.Length) == RemText))
                {
                    Value.Remove(I, RemText.Length);
                    I = 0;
                }
                I ++;
            }
            __Params[0].Value = Value;
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSubtract(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            double F1;
            double F2;
            // CMD: subtract var <value>
            // subtract a value from a variable
            F1 = __Params[0].DecValue;
            F2 = __Params[1].DecValue;
            UpdateParam(__Params[0], F1 - F2, ((TScript)(Script)).DecimalPrecision);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSys_Check(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            TCmdParam[] X;
            // CMD: sys_check
            X = new TCmdParam[0];
            // to correct strange compiler problem!?
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSys_Fail(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: sys_fail
            Global.Units.Global.TWXServer.ClientMessage("Unable to access subroutine - " + Ansi.Units.Ansi.ANSI_12 + "Authentication failure.");
            result = ScriptRef.TCmdAction.caStop;
            return result;
        }

        public static TCmdAction CmdSys_NoAuth(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: sys_noAuth
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSys_Kill(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: sys_kill
            Environment.Exit(0);
            // will throw exceptions on exit - gives the user an impression of a serious bug out
            result = ScriptRef.TCmdAction.caStop;
            return result;
        }

        public static TCmdAction CmdSys_Nop(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: sys_nop
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSys_ShowMsg(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: sys_showMsg
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdSystemScript(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: systemScript
            ((TScript)(Script)).System = true;
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdTrim(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD trim var
            __Params[0].Value = __Params[0].Value.Trim();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdTruncate(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: truncate var
            UpdateParam(__Params[0], __Params[0].DecValue, 0);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdUpperCase(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: upperCase var
            __Params[0].Value = __Params[0].Value.ToUpper();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdWaitFor(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            // CMD: waitFor <value>
            ((TScript)(Script)).WaitText = __Params[0].Value;
            ((TScript)(Script)).WaitForActive = true;
            result = ScriptRef.TCmdAction.caPause;
            return result;
        }

        public static TCmdAction CmdWindow(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            TScriptWindow Window;
            int SizeX;
            int SizeY;
            // CMD: window <windowName> <sizeX> <sizeY> <title> [<ontop>]
            ConvertToNumber(__Params[1].Value, ref SizeX);
            ConvertToNumber(__Params[2].Value, ref SizeY);
            Window = new TScriptWindow(__Params[0].Value, __Params[3].Value, SizeX, SizeY, (__Params.Length == 5));
            ((TScript)(Script)).AddWindow(Window);
            Window.Show();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdWrite(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            System.IO.Stream F;
            // CMD: write <file> <value>
            Environment.CurrentDirectory = ((TScript)(Script)).ProgramDir;
            F = new FileInfo(__Params[0].Value);
            _W_0 = F.AppendText();
            //@ Unsupported function or procedure: 'IOResult'
            if ((IOResult != 0))
            {
                _W_0 = F.CreateText();
            }
            //@ Unsupported function or procedure: 'IOResult'
            if ((IOResult != 0))
            {
                throw new EScriptError("Unable to write to file \'" + __Params[0].Value + '\'');
            }
            _W_0.WriteLine(__Params[1].Value);
            _W_0.Close();
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        public static TCmdAction CmdXor(Object Script, TCmdParam[] __Params)
        {
            TCmdAction result;
            bool B1;
            bool B2;
            // CMD: xor var <value>
            ConvertToBoolean(__Params[0], ref B1);
            ConvertToBoolean(__Params[1], ref B2);
            __Params[0].Value = ConvertBoolToString(B1 ^ B2);
            result = ScriptRef.TCmdAction.caNone;
            return result;
        }

        // *****************************************************************************
        // SCRIPT SYSTEM CONST IMPLEMENTATION
        // *****************************************************************************
        public static string SCAlphaCentauri(string[] Indexes)
        {
            string result;
            result = (Global.Units.Global.TWXDatabase.DBHeader.AlphaCentauri).ToString();
            return result;
        }

        public static string SCAnsi_0(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_0;
            return result;
        }

        public static string SCAnsi_1(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_1;
            return result;
        }

        public static string SCAnsi_2(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_2;
            return result;
        }

        public static string SCAnsi_3(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_3;
            return result;
        }

        public static string SCAnsi_4(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_4;
            return result;
        }

        public static string SCAnsi_5(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_5;
            return result;
        }

        public static string SCAnsi_6(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_6;
            return result;
        }

        public static string SCAnsi_7(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_7;
            return result;
        }

        public static string SCAnsi_8(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_8;
            return result;
        }

        public static string SCAnsi_9(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_9;
            return result;
        }

        public static string SCAnsi_10(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_10;
            return result;
        }

        public static string SCAnsi_11(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_11;
            return result;
        }

        public static string SCAnsi_12(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_12;
            return result;
        }

        public static string SCAnsi_13(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_13;
            return result;
        }

        public static string SCAnsi_14(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_14;
            return result;
        }

        public static string SCAnsi_15(string[] Indexes)
        {
            string result;
            result = Ansi.Units.Ansi.ANSI_15;
            return result;
        }

        public static string SCConnected(string[] Indexes)
        {
            string result;
            if ((Global.Units.Global.TWXClient.Connected))
            {
                result = '1';
            }
            else
            {
                result = '0';
            }
            return result;
        }

        public static string SCCurrentANSILine(string[] Indexes)
        {
            string result;
            result = Global.Units.Global.TWXExtractor.CurrentANSILine;
            return result;
        }

        public static string SCCurrentLine(string[] Indexes)
        {
            string result;
            result = Global.Units.Global.TWXExtractor.CurrentLine;
            return result;
        }

        public static string SCCurrentSector(string[] Indexes)
        {
            string result;
            result = (Global.Units.Global.TWXExtractor.CurrentSector).ToString();
            return result;
        }

        public static string SCDate(string[] Indexes)
        {
            string result;
            result = (DateTime.Now).ToString();
            return result;
        }

        public static string SCFalse(string[] Indexes)
        {
            string result;
            result = '0';
            return result;
        }

        public static string SCGame(string[] Indexes)
        {
            string result;
            result = Global.Units.Global.TWXDatabase.DBHeader.Game;
            return result;
        }

        public static string SCGameName(string[] Indexes)
        {
            string result;
            result = Utility.Units.Utility.StripFileExtension(Utility.Units.Utility.ShortFilename(Global.Units.Global.TWXDatabase.DatabaseName));
            return result;
        }

        public static string SCLicenseName(string[] Indexes)
        {
            string result;
            result = "User";
            return result;
        }

        public static string SCLoginName(string[] Indexes)
        {
            string result;
            result = Global.Units.Global.TWXDatabase.DBHeader.LoginName;
            return result;
        }

        public static string SCPassword(string[] Indexes)
        {
            string result;
            result = Global.Units.Global.TWXDatabase.DBHeader.Password;
            return result;
        }

        public static string SCPort_Class(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.CLASS[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            if ((Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.Name == ""))
            {
                result = "-1";
            }
            else
            {
                result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.ClassIndex).ToString();
            }
            return result;
        }

        public static string SCPort_BuildTime(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.BUILDTIME[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.BuildTime).ToString();
            return result;
        }

        public static string SCPort_BuyFuel(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.BUYFUEL[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            if ((Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.BuyProduct[DataBase.TProductType.ptFuelOre]))
            {
                result = '1';
            }
            else
            {
                result = '0';
            }
            return result;
        }

        public static string SCPort_BuyOrg(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.BUYORG[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            if ((Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.BuyProduct[DataBase.TProductType.ptOrganics]))
            {
                result = '1';
            }
            else
            {
                result = '0';
            }
            return result;
        }

        public static string SCPort_BuyEquip(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.BUYEQUIP[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            if ((Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
            {
                result = '1';
            }
            else
            {
                result = '0';
            }
            return result;
        }

        public static string SCPort_Equip(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.EQUIPMENT[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.ProductAmount[DataBase.TProductType.ptEquipment]).ToString();
            return result;
        }

        public static string SCPort_Exists(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.EXISTS[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            if ((Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.Name == ""))
            {
                result = '0';
            }
            else
            {
                result = '1';
            }
            return result;
        }

        public static string SCPort_Fuel(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.FUEL[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.ProductAmount[DataBase.TProductType.ptFuelOre]).ToString();
            return result;
        }

        public static string SCPort_Name(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.NAME[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.Name;
            return result;
        }

        public static string SCPort_Org(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.ORGANICS[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.ProductAmount[DataBase.TProductType.ptOrganics]).ToString();
            return result;
        }

        public static string SCPort_PercentFuel(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.PERCENTORE[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.ProductPercent[DataBase.TProductType.ptFuelOre]).ToString();
            return result;
        }

        public static string SCPort_PercentOrg(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.PERCENTORG[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.ProductPercent[DataBase.TProductType.ptOrganics]).ToString();
            return result;
        }

        public static string SCPort_PercentEquip(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for PORT.PERCENTEQUIP[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.ProductPercent[DataBase.TProductType.ptEquipment]).ToString();
            return result;
        }

        public static string SCPort_Updated(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.UPDATED[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].SPort.UpDate).ToString();
            return result;
        }

        public static string SCRawPacket(string[] Indexes)
        {
            string result;
            result = Global.Units.Global.TWXExtractor.RawANSILine;
            return result;
        }

        public static string SCRylos(string[] Indexes)
        {
            string result;
            result = (Global.Units.Global.TWXDatabase.DBHeader.Rylos).ToString();
            return result;
        }

        public static string SCSector_Anomaly(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.Anomaly[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (((byte)Global.Units.Global.TWXDatabase.Sectors[SectIndex].Anomaly)).ToString();
            return result;
        }

        public static string SCSector_BackdoorCount(string[] Indexes)
        {
            string result;
            int SectIndex;
            ArrayList WarpsIn;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.BACKDOORCOUNT[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            WarpsIn = Global.Units.Global.TWXDatabase.GetBackDoors(Global.Units.Global.TWXDatabase.Sectors[SectIndex], SectIndex);
            result = (WarpsIn.Count).ToString();
            while ((WarpsIn.Count > 0))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(WarpsIn[0]);
                WarpsIn.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            WarpsIn.Free;
            return result;
        }

        public static string SCSector_Backdoors(string[] Indexes)
        {
            string result;
            int SectIndex;
            int WarpIndex;
            ArrayList WarpsIn;
            if ((Indexes.Length < 2))
            {
                throw new EScriptError("Invalid parameters for SECTOR.BACKDOORS[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            ConvertToNumber(Indexes[1], ref WarpIndex);
            CheckSector(SectIndex);
            WarpsIn = Global.Units.Global.TWXDatabase.GetBackDoors(Global.Units.Global.TWXDatabase.Sectors[SectIndex], SectIndex);
            if ((WarpIndex < 1) || (WarpIndex > WarpsIn.Count))
            {
                result = '0';
            }
            else
            {
                result = (((TWarpIn)(WarpsIn[WarpIndex - 1])).Origin).ToString();
            }
            while ((WarpsIn.Count > 0))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(WarpsIn[0]);
                WarpsIn.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            WarpsIn.Free;
            return result;
        }

        public static string SCSector_Beacon(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.BEACON[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = Global.Units.Global.TWXDatabase.Sectors[SectIndex].Beacon;
            return result;
        }

        public static string SCSector_Constellation(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.CONSTELLATION[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = Global.Units.Global.TWXDatabase.Sectors[SectIndex].Constellation;
            return result;
        }

        public static string SCSector_Density(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.DENSITY[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].Density).ToString();
            return result;
        }

        public static string SCSector_Explored(string[] Indexes)
        {
            string result;
            TSectorExploredType Explored;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.EXPLORED[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            Explored = Global.Units.Global.TWXDatabase.Sectors[SectIndex].Explored;
            switch(Explored)
            {
                case DataBase.TSectorExploredType.etNo:
                    result = "NO";
                    break;
                case DataBase.TSectorExploredType.etCalc:
                    result = "CALC";
                    break;
                case DataBase.TSectorExploredType.etDensity:
                    result = "DENSITY";
                    break;
                case DataBase.TSectorExploredType.etHolo:
                    result = "YES";
                    break;
            }
            return result;
        }

        public static string SCSector_Figs_Owner(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.FIGS.OWNER[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = Global.Units.Global.TWXDatabase.Sectors[SectIndex].Figs.Owner;
            return result;
        }

        public static string SCSector_Figs_Quantity(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.FIGS.QUANTITY[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].Figs.Quantity).ToString();
            return result;
        }

        public static string SCSector_Figs_Type(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.FIGS.TYPE[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            if ((Global.Units.Global.TWXDatabase.Sectors[SectIndex].Figs.Quantity > 0))
            {
                if ((Global.Units.Global.TWXDatabase.Sectors[SectIndex].Figs.FigType == DataBase.TFighterType.ftToll))
                {
                    result = "Toll";
                }
                else if ((Global.Units.Global.TWXDatabase.Sectors[SectIndex].Figs.FigType == DataBase.TFighterType.ftOffensive))
                {
                    result = "Offensive";
                }
                else if ((Global.Units.Global.TWXDatabase.Sectors[SectIndex].Figs.FigType == DataBase.TFighterType.ftDefensive))
                {
                    result = "Defensive";
                }
                else
                {
                    result = "None";
                }
            }
            return result;
        }

        public static string SCSector_Limpets_Owner(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.LIMPETS.OWNER[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = Global.Units.Global.TWXDatabase.Sectors[SectIndex].Mines_Limpet.Owner;
            return result;
        }

        public static string SCSector_Limpets_Quantity(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.LIMPETS.QUANTITY[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].Mines_Limpet.Quantity).ToString();
            return result;
        }

        public static string SCSector_Mines_Owner(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.MINES.OWNER[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = Global.Units.Global.TWXDatabase.Sectors[SectIndex].Mines_Armid.Owner;
            return result;
        }

        public static string SCSector_Mines_Quantity(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.MINES.QUANTITY[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].Mines_Armid.Quantity).ToString();
            return result;
        }

        public static string SCSector_NavHaz(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.NAVHAZ[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].NavHaz).ToString();
            return result;
        }

        public static string SCSector_PlanetCount(string[] Indexes)
        {
            string result;
            int SectIndex;
            ArrayList ItemList;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.PLANETCOUNT[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            ItemList = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itPlanet, Global.Units.Global.TWXDatabase.Sectors[SectIndex]);
            result = (ItemList.Count).ToString();
            Utility.Units.Utility.FreeList(ItemList, sizeof(TPlanet));
            return result;
        }

        public static string SCSector_Planets(string[] Indexes)
        {
            string result;
            int PlanetIndex;
            int SectIndex;
            ArrayList ItemList;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.PLANETS[sector][planetIndex]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            ConvertToNumber(Indexes[1], ref PlanetIndex);
            CheckSector(SectIndex);
            ItemList = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itPlanet, Global.Units.Global.TWXDatabase.Sectors[SectIndex]);
            if (((PlanetIndex > ItemList.Count) || (PlanetIndex < 1)))
            {
                result = '0';
            }
            else
            {
                result = ((TPlanet)(ItemList[PlanetIndex - 1])).Name;
            }
            Utility.Units.Utility.FreeList(ItemList, sizeof(TPlanet));
            return result;
        }

        public static string SCSector_Ships(string[] Indexes)
        {
            string result;
            int ShipIndex;
            int SectIndex;
            ArrayList ItemList;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.SHIPS[sector][shipIndex]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            ConvertToNumber(Indexes[1], ref ShipIndex);
            CheckSector(SectIndex);
            ItemList = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itShip, Global.Units.Global.TWXDatabase.Sectors[SectIndex]);
            if (((ShipIndex > ItemList.Count) || (ShipIndex < 1)))
            {
                result = '0';
            }
            else
            {
                result = ((TShip)(ItemList[ShipIndex - 1])).Name;
            }
            Utility.Units.Utility.FreeList(ItemList, sizeof(TShip));
            return result;
        }

        public static string SCSector_ShipCount(string[] Indexes)
        {
            string result;
            int SectIndex;
            ArrayList ItemList;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.SHIPCOUNT[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            ItemList = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itShip, Global.Units.Global.TWXDatabase.Sectors[SectIndex]);
            result = (ItemList.Count).ToString();
            Utility.Units.Utility.FreeList(ItemList, sizeof(TShip));
            return result;
        }

        public static string SCSector_Traders(string[] Indexes)
        {
            string result;
            int TraderIndex;
            int SectIndex;
            ArrayList ItemList;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.TRADERS[sector][traderIndex]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            ConvertToNumber(Indexes[1], ref TraderIndex);
            CheckSector(SectIndex);
            ItemList = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itTrader, Global.Units.Global.TWXDatabase.Sectors[SectIndex]);
            if (((TraderIndex > ItemList.Count) || (TraderIndex < 1)))
            {
                result = '0';
            }
            else
            {
                result = ((TTrader)(ItemList[TraderIndex - 1])).Name;
            }
            Utility.Units.Utility.FreeList(ItemList, sizeof(TTrader));
            return result;
        }

        public static string SCSector_TraderCount(string[] Indexes)
        {
            string result;
            int SectIndex;
            ArrayList ItemList;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.TRADERCOUNT[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            ItemList = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itTrader, Global.Units.Global.TWXDatabase.Sectors[SectIndex]);
            result = (ItemList.Count).ToString();
            Utility.Units.Utility.FreeList(ItemList, sizeof(TTrader));
            return result;
        }

        public static string SCSector_Updated(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.UPDATED[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].UpDate).ToString();
            return result;
        }

        public static string SCSector_WarpCount(string[] Indexes)
        {
            string result;
            int SectIndex;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.WARPCOUNT[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].Warps).ToString();
            return result;
        }

        public static string SCSector_Warps(string[] Indexes)
        {
            string result;
            int SectIndex;
            int WarpIndex;
            if ((Indexes.Length < 2))
            {
                throw new EScriptError("Invalid parameters for SECTOR.WARPS[sector][warpIndex]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            ConvertToNumber(Indexes[1], ref WarpIndex);
            CheckSector(SectIndex);
            if ((WarpIndex < 1) || (WarpIndex > 6))
            {
                result = '0';
            }
            else
            {
                result = (Global.Units.Global.TWXDatabase.Sectors[SectIndex].Warp[WarpIndex]).ToString();
            }
            return result;
        }

        public static string SCSector_WarpInCount(string[] Indexes)
        {
            string result;
            int SectIndex;
            ArrayList WarpsIn;
            if ((Indexes.Length < 1))
            {
                throw new EScriptError("Invalid parameters for SECTOR.WARPINCOUNT[sector]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            CheckSector(SectIndex);
            WarpsIn = Global.Units.Global.TWXDatabase.GetWarpsIn(SectIndex);
            result = (WarpsIn.Count).ToString();
            //@ Unsupported property or method(C): 'Free'
            WarpsIn.Free;
            return result;
        }

        public static string SCSector_WarpsIn(string[] Indexes)
        {
            string result;
            int SectIndex;
            int WarpIndex;
            ArrayList WarpsIn;
            if ((Indexes.Length < 2))
            {
                throw new EScriptError("Invalid parameters for SECTOR.WARPSIN[sector][warpIndex]");
            }
            ConvertToNumber(Indexes[0], ref SectIndex);
            ConvertToNumber(Indexes[1], ref WarpIndex);
            CheckSector(SectIndex);
            WarpsIn = Global.Units.Global.TWXDatabase.GetWarpsIn(SectIndex);
            if ((WarpIndex < 1) || (WarpIndex > WarpsIn.Count))
            {
                result = '0';
            }
            else
            {
                result = (((TWarpIn)(WarpsIn[WarpIndex - 1])).Origin).ToString();
            }
            //@ Unsupported property or method(C): 'Free'
            WarpsIn.Free;
            return result;
        }

        public static string SCSectors(string[] Indexes)
        {
            string result;
            result = (Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString();
            return result;
        }

        public static string SCStardock(string[] Indexes)
        {
            string result;
            result = (Global.Units.Global.TWXDatabase.DBHeader.StarDock).ToString();
            return result;
        }

        public static string SCTime(string[] Indexes)
        {
            string result;
            result = DateTime.Now.ToString();
            return result;
        }

        public static string SCTrue(string[] Indexes)
        {
            string result;
            result = '1';
            return result;
        }

        // *****************************************************************************
        // LIST BUILDER METHODS
        // *****************************************************************************
        public static void BuildSysConstList(TScriptRef ScriptRef)
        {
            ScriptRef.AddSysConstant("ANSI_0", SCAnsi_0);
            ScriptRef.AddSysConstant("ANSI_1", SCAnsi_1);
            ScriptRef.AddSysConstant("ANSI_2", SCAnsi_2);
            ScriptRef.AddSysConstant("ANSI_3", SCAnsi_3);
            ScriptRef.AddSysConstant("ANSI_4", SCAnsi_4);
            ScriptRef.AddSysConstant("ANSI_5", SCAnsi_5);
            ScriptRef.AddSysConstant("ANSI_6", SCAnsi_6);
            ScriptRef.AddSysConstant("ANSI_7", SCAnsi_7);
            ScriptRef.AddSysConstant("ANSI_8", SCAnsi_8);
            ScriptRef.AddSysConstant("ANSI_9", SCAnsi_9);
            ScriptRef.AddSysConstant("ANSI_10", SCAnsi_10);
            ScriptRef.AddSysConstant("ANSI_11", SCAnsi_11);
            ScriptRef.AddSysConstant("ANSI_12", SCAnsi_12);
            ScriptRef.AddSysConstant("ANSI_13", SCAnsi_13);
            ScriptRef.AddSysConstant("ANSI_14", SCAnsi_14);
            ScriptRef.AddSysConstant("ANSI_15", SCAnsi_15);
            ScriptRef.AddSysConstant("CONNECTED", SCConnected);
            ScriptRef.AddSysConstant("CURRENTANSILINE", SCCurrentANSILine);
            ScriptRef.AddSysConstant("CURRENTLINE", SCCurrentLine);
            ScriptRef.AddSysConstant("DATE", SCDate);
            ScriptRef.AddSysConstant("FALSE", SCFalse);
            ScriptRef.AddSysConstant("GAME", SCGame);
            ScriptRef.AddSysConstant("GAMENAME", SCGameName);
            ScriptRef.AddSysConstant("LICENSENAME", SCLicenseName);
            ScriptRef.AddSysConstant("LOGINNAME", SCLoginName);
            ScriptRef.AddSysConstant("PASSWORD", SCPassword);
            ScriptRef.AddSysConstant("PORT.CLASS", SCPort_Class);
            ScriptRef.AddSysConstant("PORT.BUYFUEL", SCPort_BuyFuel);
            ScriptRef.AddSysConstant("PORT.BUYORG", SCPort_BuyOrg);
            ScriptRef.AddSysConstant("PORT.BUYEQUIP", SCPort_BuyEquip);
            ScriptRef.AddSysConstant("PORT.EXISTS", SCPort_Exists);
            ScriptRef.AddSysConstant("PORT.FUEL", SCPort_Fuel);
            ScriptRef.AddSysConstant("PORT.NAME", SCPort_Name);
            ScriptRef.AddSysConstant("PORT.ORG", SCPort_Org);
            ScriptRef.AddSysConstant("PORT.EQUIP", SCPort_Equip);
            ScriptRef.AddSysConstant("PORT.PERCENTFUEL", SCPort_PercentFuel);
            ScriptRef.AddSysConstant("PORT.PERCENTORG", SCPort_PercentOrg);
            ScriptRef.AddSysConstant("PORT.PERCENTEQUIP", SCPort_PercentEquip);
            ScriptRef.AddSysConstant("SECTOR.ANOMALY", SCSector_Anomaly);
            ScriptRef.AddSysConstant("SECTOR.BACKDOORCOUNT", SCSector_BackdoorCount);
            ScriptRef.AddSysConstant("SECTOR.BACKDOORS", SCSector_Backdoors);
            ScriptRef.AddSysConstant("SECTOR.DENSITY", SCSector_Density);
            ScriptRef.AddSysConstant("SECTOR.EXPLORED", SCSector_Explored);
            ScriptRef.AddSysConstant("SECTOR.FIGS.OWNER", SCSector_Figs_Owner);
            ScriptRef.AddSysConstant("SECTOR.FIGS.QUANTITY", SCSector_Figs_Quantity);
            ScriptRef.AddSysConstant("SECTOR.LIMPETS.OWNER", SCSector_Limpets_Owner);
            ScriptRef.AddSysConstant("SECTOR.LIMPETS.QUANTITY", SCSector_Limpets_Quantity);
            ScriptRef.AddSysConstant("SECTOR.MINES.OWNER", SCSector_Mines_Owner);
            ScriptRef.AddSysConstant("SECTOR.MINES.QUANTITY", SCSector_Mines_Quantity);
            ScriptRef.AddSysConstant("SECTOR.NAVHAZ", SCSector_NavHaz);
            ScriptRef.AddSysConstant("SECTOR.PLANETCOUNT", SCSector_PlanetCount);
            ScriptRef.AddSysConstant("SECTOR.PLANETS", SCSector_Planets);
            ScriptRef.AddSysConstant("SECTOR.SHIPCOUNT", SCSector_ShipCount);
            ScriptRef.AddSysConstant("SECTOR.SHIPS", SCSector_Ships);
            ScriptRef.AddSysConstant("SECTOR.TRADERCOUNT", SCSector_TraderCount);
            ScriptRef.AddSysConstant("SECTOR.TRADERS", SCSector_Traders);
            ScriptRef.AddSysConstant("SECTOR.UPDATED", SCSector_Updated);
            ScriptRef.AddSysConstant("SECTOR.WARPCOUNT", SCSector_WarpCount);
            ScriptRef.AddSysConstant("SECTOR.WARPS", SCSector_Warps);
            ScriptRef.AddSysConstant("SECTOR.WARPSIN", SCSector_WarpsIn);
            ScriptRef.AddSysConstant("SECTOR.WARPINCOUNT", SCSector_WarpInCount);
            ScriptRef.AddSysConstant("SECTORS", SCSectors);
            ScriptRef.AddSysConstant("STARDOCK", SCStardock);
            ScriptRef.AddSysConstant("TIME", SCTime);
            ScriptRef.AddSysConstant("TRUE", SCTrue);
            // SysConstants added in 2.04
            ScriptRef.AddSysConstant("ALPHACENTAURI", SCAlphaCentauri);
            ScriptRef.AddSysConstant("CURRENTSECTOR", SCCurrentSector);
            ScriptRef.AddSysConstant("RYLOS", SCRylos);
            // Added in 2.04a
            ScriptRef.AddSysConstant("PORT.BUILDTIME", SCPort_BuildTime);
            ScriptRef.AddSysConstant("PORT.UPDATED", SCPort_Updated);
            ScriptRef.AddSysConstant("RAWPACKET", SCRawPacket);
            ScriptRef.AddSysConstant("SECTOR.BEACON", SCSector_Beacon);
            ScriptRef.AddSysConstant("SECTOR.CONSTELLATION", SCSector_Constellation);
            ScriptRef.AddSysConstant("SECTOR.FIGS.TYPE", SCSector_Figs_Type);
        }

        public static void BuildCommandList(TScriptRef ScriptRef)
        {
            ScriptRef.AddCommand("ADD", 2, 2, CmdAdd, new TParamKind[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ADDMENU", 7, 7, CmdAddMenu, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("AND", 2, 2, CmdAnd, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("BRANCH", 2, 2, CmdBranch, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("CLIENTMESSAGE", 1, 1, CmdClientMessage, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("CLOSEMENU", 0, 0, CmdCloseMenu, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("CONNECT", 0, 0, CmdConnect, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("CUTTEXT", 4, 4, CmdCutText, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("DELETE", 1, 1, CmdDelete, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("DISCONNECT", 0, 0, CmdDisconnect, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("DIVIDE", 2, 2, CmdDivide, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ECHO", 1,  -1, CmdEcho, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("FILEEXISTS", 2, 2, CmdFileExists, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETCHARCODE", 2, 2, CmdGetCharCode, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETCONSOLEINPUT", 1, 2, CmdGetConsoleInput, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETCOURSE", 3, 3, CmdGetCourse, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETDATE", 1, 1, CmdGetDate, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETDISTANCE", 3, 3, CmdGetDistance, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETINPUT", 2, 3, CmdGetInput, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETLENGTH", 2, 2, CmdGetLength, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETMENUVALUE", 2, 2, CmdGetMenuValue, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETOUTTEXT", 1, 1, CmdGetOutText, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETRND", 3, 3, CmdGetRnd, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETSECTOR", 2, 2, CmdGetSector, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETSECTORPARAMETER", 3, 3, CmdGetSectorParameter, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETTEXT", 4, 4, CmdGetText, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETTIME", 1, 2, CmdGetTime, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GOSUB", 1, 1, CmdGosub, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GOTO", 1, 1, CmdGoto, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETWORD", 3, 4, CmdGetWord, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETWORDPOS", 3, 3, CmdGetWordPos, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("HALT", 0, 0, CmdHalt, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ISEQUAL", 3, 3, CmdIsEqual, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ISGREATER", 3, 3, CmdIsGreater, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ISGREATEREQUAL", 3, 3, CmdIsGreaterEqual, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ISLESSER", 3, 3, CmdIsLesser, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ISLESSEREQUAL", 3, 3, CmdIsLesserEqual, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ISNOTEQUAL", 3, 3, CmdIsNotEqual, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ISNUMBER", 2, 2, CmdIsNumber, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("KILLWINDOW", 1, 1, CmdKillWindow, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("KILLALLTRIGGERS", 0, 0, CmdKillAllTriggers, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("KILLTRIGGER", 1, 1, CmdKillTrigger, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("LOAD", 1, 1, CmdLoad, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("LOADVAR", 1, 1, CmdLoadVar, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("LOGGING", 1, 1, CmdLogging, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("LOWERCASE", 1, 1, CmdLowerCase, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("MERGETEXT", 3, 3, CmdMergeText, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("MULTIPLY", 2, 2, CmdMultiply, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("OPENMENU", 1, 2, CmdOpenMenu, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("OR", 2, 2, CmdOr, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("PAUSE", 0, 0, CmdPause, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("PROCESSIN", 2, 2, CmdProcessIn, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("PROCESSOUT", 1, 1, CmdProcessOut, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("READ", 3, 3, CmdRead, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("RENAME", 2, 2, CmdRename, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("REPLACETEXT", 3, 3, CmdReplaceText, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("REQRECORDING", 0, 0, CmdReqRecording, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("RETURN", 0, 0, CmdReturn, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("ROUND", 1, 2, CmdRound, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SAVEVAR", 1, 1, CmdSaveVar, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SEND", 1,  -1, CmdSend, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETARRAY", 2,  -1, CmdSetArray, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETDELAYTRIGGER", 3, 3, CmdSetDelayTrigger, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETEVENTTRIGGER", 3, 4, CmdSetEventTrigger, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETMENUHELP", 2, 2, CmdSetMenuHelp, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETMENUVALUE", 2, 2, CmdSetMenuValue, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETMENUOPTIONS", 4, 4, CmdSetMenuOptions, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETPRECISION", 1, 1, CmdSetPrecision, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETPROGVAR", 2, 2, CmdSetProgVar, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETSECTORPARAMETER", 3, 3, CmdSetSectorParameter, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETTEXTLINETRIGGER", 2, 3, CmdSetTextLineTrigger, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETTEXTOUTTRIGGER", 2, 3, CmdSetTextOutTrigger, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETTEXTTRIGGER", 2, 3, CmdSetTextTrigger, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETVAR", 2, 2, CmdSetVar, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETWINDOWCONTENTS", 2, 2, CmdSetWindowContents, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SOUND", 1, 1, CmdSound, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("STOP", 1, 1, CmdStop, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("STRIPTEXT", 2, 2, CmdStripText, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SUBTRACT", 2, 2, CmdSubtract, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SYS_CHECK", 0, 0, CmdSys_Check, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SYS_FAIL", 0, 0, CmdSys_Fail, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SYS_KILL", 0, 0, CmdSys_Kill, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SYS_NOAUTH", 0, 0, CmdSys_NoAuth, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SYS_NOP", 0, 0, CmdSys_Nop, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SYS_SHOWMSG", 0, 0, CmdSys_ShowMsg, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SYSTEMSCRIPT", 0, 0, CmdSystemScript, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("UPPERCASE", 1, 1, CmdUpperCase, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("XOR", 2, 2, CmdXor, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("WAITFOR", 1, 1, CmdWaitFor, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("WINDOW", 4, 5, CmdWindow, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("WRITE", 2, 2, CmdWrite, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            // Commands added for 2.04beta
            ScriptRef.AddCommand("GETTIMER", 1, 1, CmdGetTimer, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("READTOARRAY", 2, 2, CmdReadToArray, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            // Commands added for 2.04final
            ScriptRef.AddCommand("CLEARALLAVOIDS", 0, 0, CmdClearAllAvoids, new object[] {}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("CLEARAVOID", 1, 1, CmdClearAvoid, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETALLCOURSES", 2, 2, CmdGetAllCourses, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETFILELIST", 1, 2, CmdGetFileList, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETNEARESTWARPS", 2, 2, CmdGetNearestWarps, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETSCRIPTVERSION", 2, 2, CmdGetScriptVersion, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("LISTACTIVESCRIPTS", 1, 1, CmdListActiveScripts, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("LISTAVOIDS", 1, 1, CmdListAvoids, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("LISTSECTORPARAMETERS", 2, 2, CmdListSectorParameters, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETAVOID", 1, 1, CmdSetAvoid, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            // Commands added for 2.05beta
            ScriptRef.AddCommand("CUTLENGTHS", 3, 3, CmdCutLengths, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("FORMAT", 3, 3, CmdFormat, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETDIRLIST", 1, 2, CmdGetDirList, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("GETWORDCOUNT", 2, 2, CmdGetWordCount, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("MAKEDIR", 1, 1, CmdMakeDir, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("PADLEFT", 2, 2, CmdPadLeft, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("PADRIGHT", 2, 2, CmdPadRight, new object[] {ScriptRef.TParamKind.pkVar, ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("REMOVEDIR", 1, 1, CmdRemoveDir, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SETMENUKEY", 1, 1, CmdSetMenuKey, new object[] {ScriptRef.TParamKind.pkValue}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("SPLITTEXT", 2, 3, CmdSplitText, new object[] {ScriptRef.TParamKind.pkValue, ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("TRIM", 1, 1, CmdTrim, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
            ScriptRef.AddCommand("TRUNCATE", 1, 1, CmdTruncate, new object[] {ScriptRef.TParamKind.pkVar}, ScriptRef.TParamKind.pkValue);
        }

        public void initialization()
        {
            //@ Undeclared identifier(3): 'rmDown'
            //@ Undeclared identifier(3): 'SetRoundMode'
            SetRoundMode(rmDown);
        }

        public void finalization()
        {
            // EP - We want all floats rounded down (truncated).
            //@ Unsupported property or method(C): 'Free'
            LastReadStrings.Free;
        }

    } // end ScriptCmd

}

