using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Collections.Specialized;
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
 // This unit controls all utility functions used by the other units
namespace Utility.Units
{
    public class Utility
    {
        // default string parameter should be blank
        public static void SetFileExtension(ref string Filename, string Extension)
        {
            // ensure the filename has an extention.  If not, make one
            if ((Filename.IndexOf('.') == 0))
            {
                Filename = Filename + Extension;
            }
        }

        public static string GetSpace(int I)
        {
            string result;
            int X;
            result = "";
            for (X = 1; X <= I; X ++ )
            {
                result = result + ' ';
            }
            return result;
        }

        public static string StripChars(string S)
        {
            string result;
            int I;
            result = "";
            // remove all unusual characters from line
            for (I = 1; I <= S.Length; I ++ )
            {
                if ((((byte)S[I]) >= 32) && (((byte)S[I]) < 127))
                {
                    result = result + S[I];
                }
            }
            return result;
        }

        public static string GetTelnetLogin(string InStr)
        {
            string result;
            int I;
            int X;
            string Retn;
            // get telnet commands from this line
            X = 0;
            Retn = "";
            for (I = 1; I <= InStr.Length; I ++ )
            {
                if ((X > 0))
                {
                    X -= 1;
                }
                if ((InStr[I] == 'ÿ'))
                {
                    X = 3;
                }
                if ((X > 0))
                {
                    Retn = Retn + InStr[I];
                }
            }
            result = Retn;
            return result;
        }

        public static string Generate(string Name, string __Base)
        {
            string result;
            int I;
            byte Key;
            byte A;
            byte B;
            string Retn;
            Retn = "";
            Key = 0x5A;
            B = 0x9F;
            for (I = 1; I <= Name.Length; I ++ )
            {
                Key = ((Key ^ ((byte)Name[I])) * I) ^ 127 ^ ((byte)Name[2]);
            }
            for (I = 1; I <= __Base.Length; I ++ )
            {
                A = ((byte)__Base[I]);
                A = A ^ Key ^ B * I;
                B = A;
                A = A / 8;
                if ((A < 10))
                {
                    A = A + 48;
                }
                else
                {
                    A = A + 55;
                }
                Retn = Retn + (char)A;
            }
            result = Retn;
            return result;
        }

        public static string FetchScript(string S, bool Include)
        {
            string result;
            string[] NameList = new string[6 + 1];
            int Limit;
            int I;
            I = 1;
            while ((I <= 5))
            {
                NameList[I] = S;
                I += 2;
            }
            I = 2;
            while ((I <= 6))
            {
                NameList[I] = "scripts\\" + S;
                I += 2;
            }
            CompleteFileName(ref NameList[1], "ts");
            CompleteFileName(ref NameList[2], "ts");
            CompleteFileName(ref NameList[3], "cts");
            CompleteFileName(ref NameList[4], "cts");
            CompleteFileName(ref NameList[5], "inc");
            CompleteFileName(ref NameList[6], "inc");
            if (Include)
            {
                Limit = 6;
            }
            else
            {
                Limit = 4;
            }
            result = S;
            for (I = 1; I <= Limit; I ++ )
            {
                if ((File.Exists(NameList[I])))
                {
                    result = NameList[I];
                    break;
                }
            }
            return result;
        }

        public static void CompleteFileName(ref string S, string X)
        {
            int I;
            // add an extention to the filename if there isn't one
            for (I = S.Length; I >= 1; I-- )
            {
                if ((S[I] == '.'))
                {
                    return;
                }
                if ((S[I] == '\\'))
                {
                    break;
                }
            }
            S = S + '.' + X;
        }

        public static void Replace(ref string S, char A, char B)
        {
            int I;
            string N;
            N = "";
            for (I = 1; I <= S.Length; I ++ )
            {
                if ((S[I] == A))
                {
                    N = N + B;
                }
                else
                {
                    N = N + S[I];
                }
            }
            S = N;
        }

        public static string ShortFilename(string S)
        {
            string result;
            int I;
            // take the directories out of the filename
            for (I = S.Length; I >= 1; I-- )
            {
                if ((S[I] == '\\'))
                {
                    break;
                }
            }
            result = S.Substring(I + 1 - 1 ,S.Length);
            return result;
        }

        public static string StripFileExtension(string S)
        {
            string result;
            int I;
            // take the extension out of the filename (if its there)
            for (I = S.Length; I >= 1; I-- )
            {
                if ((S[I] == '.'))
                {
                    result = S.Substring(1 - 1 ,I - 1);
                    return result;
                }
            }
            result = S;
            return result;
        }

        public static int StrToIntSafe(string S)
        {
            int result;
            int ErrorC;
            int Value;
            //@ Unsupported function or procedure: 'Val'
            Val(S, Value, ErrorC);
            if ((ErrorC != 0))
            {
                Value = 0;
            }
            result = Value;
            return result;
        }

        public static string AsterixToEnter(string S)
        {
            string result;
            string X;
            int I;
            for (I = 1; I <= S.Length; I ++ )
            {
                if ((S[I] == '*'))
                {
                    X = X + (char)(13);
                    X = X + (char)(10);
                }
                else
                {
                    X = X + S[I];
                }
            }
            result = X;
            return result;
        }

        public static string Segment(int I)
        {
            string result;
            int X;
            int C;
            string M;
            string O;
            // Moving from the right side, add commas every 3rd digit
            M = (I).ToString();
            O = "";
            C =  -1;
            for (X = 0; X < M.Length; X ++ )
            {
                C ++;
                if ((C == 3))
                {
                    C = 0;
                    O = ',' + O;
                }
                O = M[M.Length - X] + O;
            }
            result = O;
            return result;
        }

        public static string GetDirectory(string S)
        {
            string result;
            int I;
            string Retn;
            // gets the directory out of the passed filename
            Retn = "";
            for (I = S.Length; I >= 1; I-- )
            {
                if ((S[I] == '\\'))
                {
                    Retn = S.Substring(1 - 1 ,I - 1);
                    break;
                }
            }
            result = Retn;
            return result;
        }

        public static string StripChar(ref string S, char C)
        {
            string result;
            int I;
            string X;
            // Remove character from string
            X = "";
            for (I = 1; I <= S.Length; I ++ )
            {
                if ((S[I] != C))
                {
                    X = X + S[I];
                }
            }
            S = X;
            result = X;
            return result;
        }

        public static bool IsIn(string S, string X)
        {
            bool result;
            if ((S == ""))
            {
                result = true;
            }
            else
            {
                if ((X.IndexOf(S) > 0))
                {
                    result = true;
                }
                else
                {
                    result = false;
                }
            }
            return result;
        }

        public static string GetParameter(string S, ushort Parameter)
        {
            string result;
            int I;
            int P;
            string retn;
            char Last;
            // Get text parameter
            if ((S == ""))
            {
                result = "";
                return result;
            }
            P = 1;
            Last = ' ';
            retn = "";
            for (I = 1; I <= S.Length; I ++ )
            {
                if ((P == Parameter) && (S[I] != ' ') && (S[I] != "\09"))
                {
                    retn = retn + S[I];
                }
                if (((S[I] == ' ') || (S[I] == "\09")) && (Last != ' ') && (Last != "\09"))
                {
                    P ++;
                    if ((P > Parameter))
                    {
                        break;
                    }
                }
                Last = S[I];
            }
            result = retn;
            return result;
        }

        public static int GetParameterPos(string S, int Parameter)
        {
            int result;
            int I;
            int P;
            char Last;
            // Get text parameter
            P = 1;
            Last = ' ';
            for (I = 1; I <= S.Length; I ++ )
            {
                if ((S[I] == ' ') && (Last != ' '))
                {
                    P ++;
                }
                if ((P == Parameter))
                {
                    break;
                }
                Last = S[I];
            }
            result = I + 1;
            return result;
        }

        public static void FreeList(ArrayList List, int MemSize)
        {
            // remove all items and free list
            while ((List.Count > 0))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(List[0], MemSize);
                List.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            List.Free;
        }

        public static string WordWrap(string S)
        {
            string result;
            int I;
            int J;
            int Col;
            // word-wrap value to max 60 characters
            Col = 1;
            for (I = 1; I <= S.Length; I ++ )
            {
                if ((S[I] == '\r'))
                {
                    Col = 0;
                }
                else
                {
                    Col ++;
                }
                if ((Col > 60) && (S[I] == ' '))
                {
                    for (J = I; J <= S.Length; J ++ )
                    {
                        if ((S[J] != ' '))
                        {
                            S = S.Insert(J - 1, '\r' + '\n');
                            Col = 0;
                            break;
                        }
                    }
                }
            }
            result = S;
            return result;
        }

        public static bool IsIpAddress(string Addr)
        {
            bool result;
            int I;
            int Dots;
            result = true;
            Dots = 0;
            for (I = 1; I <= Addr.Length; I ++ )
            {
                if ((Addr[I] == '.'))
                {
                    Dots ++;
                }
                else if ((((byte)Addr[I]) < 48) || (((byte)Addr[I]) > 57))
                {
                    result = false;
                    break;
                }
            }
            if ((Dots != 3))
            {
                result = false;
            }
            return result;
        }

        public static long rdtsc()
        {
            long result = 0;
            // asm
            // rdtsc
            // end

            return result;
        }

        public static void ReverseTList(ref ArrayList List)
        {
            // This procedure flips a lists' order, primarily for course lists
            int I;
            int J;
            J = List.Count / 2;
            for (I = 1; I <= J; I ++ )
            {
                //@ Unsupported property or method(A): 'Exchange'
                List.Exchange(I - 1, List.Count - I);
            }
        }

        public static void Split(string Line, ref List<string> Strings, string Delimiters)
        {
            // default string parameter should be blank
            char[] Separators;
            char[] WhiteSpace;
            // set of Char
            int I;
            if ((Delimiters != ""))
            {
                // Delimiters were specified
                Separators = new object[] {};
                for (I = 1; I <= Delimiters.Length; I ++ )
                {
                    Separators = Separators + new char[] {Delimiters[I]};
                }
            }
            else
            {
                Separators = new char[] {"\09", ' '};
            }
            // Tab and Space, if omitted
            WhiteSpace = new object[] {};
            //@ Unsupported function or procedure: 'ExtractStrings'
            ExtractStrings(Separators, WhiteSpace, Line[1], ((Strings) as StringDictionary));
        }

        public static void Split(string Line, ref List<string> Strings)
        {
            Split(Line, Strings, "");
        }

    } // end Utility

}

