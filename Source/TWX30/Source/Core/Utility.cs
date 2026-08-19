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
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace TWXProxy.Core
{
    /// <summary>
    /// This class controls all utility functions used by the other units
    /// </summary>
    public static class Utility
    {
        public static string GetSpace(int count)
        {
            return new string(' ', count);
        }

        public static string AsterixToEnter(string s)
        {
            return s.Replace("*", "\r\n");
        }

        public static string GetParameter(string s, int parameter)
        {
            // Get text parameter
            if (string.IsNullOrEmpty(s))
                return string.Empty;

            int p = 1;
            char last = ' ';
            string result = string.Empty;

            for (int i = 0; i < s.Length; i++)
            {
                if (p == parameter && s[i] != ' ' && s[i] != '\t')
                    result += s[i];

                if ((s[i] == ' ' || s[i] == '\t') && last != ' ' && last != '\t')
                {
                    p++;
                    if (p > parameter)
                        break;
                }

                last = s[i];
            }

            return result;
        }

        public static int GetParameterPos(string s, int parameter)
        {
            // Get text parameter position
            int p = 1;
            char last = ' ';

            for (int i = 0; i < s.Length; i++)
            {
                if (s[i] == ' ' && last != ' ')
                    p++;

                if (p == parameter)
                    return i + 1;

                last = s[i];
            }

            return s.Length;
        }

        public static string Segment(int value)
        {
            // Moving from the right side, add commas every 3rd digit
            return value.ToString("N0");
        }

        public static bool IsIn(string s, string x)
        {
            if (string.IsNullOrEmpty(s))
                return true;

            return x.Contains(s);
        }

        public static int StrToIntSafe(string s)
        {
            if (int.TryParse(s, out int value))
                return value;
            return 0;
        }

        public static string StripChar(string s, char c)
        {
            return s.Replace(c.ToString(), string.Empty);
        }

        public static string ShortFilename(string s)
        {
            // take the directories out of the filename
            return Path.GetFileName(s);
        }

        public static string StripFileExtension(string s)
        {
            // take the extension out of the filename (if its there)
            return Path.GetFileNameWithoutExtension(s);
        }

        public static string GetDirectory(string s)
        {
            // gets the directory out of the passed filename
            return Path.GetDirectoryName(s) ?? string.Empty;
        }

        public static string FetchScript(string s, bool include)
        {
            string[] nameList = new string[6];
            int limit = include ? 6 : 4;

            // Initialize name variations
            for (int i = 0; i < 3; i++)
                nameList[i * 2] = s;

            for (int i = 0; i < 3; i++)
                nameList[i * 2 + 1] = Path.Combine("scripts", s);

            CompleteFileName(ref nameList[0], "ts");
            CompleteFileName(ref nameList[1], "ts");
            CompleteFileName(ref nameList[2], "cts");
            CompleteFileName(ref nameList[3], "cts");
            CompleteFileName(ref nameList[4], "inc");
            CompleteFileName(ref nameList[5], "inc");

            for (int i = 0; i < limit; i++)
            {
                if (File.Exists(nameList[i]))
                    return nameList[i];
            }

            return s;
        }

        public static void CompleteFileName(ref string s, string extension)
        {
            // add an extension to the filename if there isn't one
            if (!Path.HasExtension(s))
                s = s + "." + extension;
        }

        public static void Replace(ref string s, char a, char b)
        {
            s = s.Replace(a, b);
        }

        public static string NormalizePathSeparators(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return path;

            return Path.DirectorySeparatorChar == '\\'
                ? path.Replace('/', Path.DirectorySeparatorChar)
                : path.Replace('\\', Path.DirectorySeparatorChar);
        }

        public static string ResolvePlatformPath(string path, string? baseDir = null)
        {
            if (string.IsNullOrWhiteSpace(path))
                return path;

            string normalized = NormalizePathSeparators(path);
            if (!Path.IsPathRooted(normalized))
            {
                string root = string.IsNullOrWhiteSpace(baseDir)
                    ? Directory.GetCurrentDirectory()
                    : baseDir;
                normalized = Path.Combine(root, normalized);
            }

            return normalized;
        }

        public static string? ResolveExistingPath(string path, string? baseDir = null)
        {
            return ResolveExistingPath(path, baseDir, requireFile: false, requireDirectory: false);
        }

        public static string? ResolveExistingFilePath(string path, string? baseDir = null)
        {
            return ResolveExistingPath(path, baseDir, requireFile: true, requireDirectory: false);
        }

        public static string? ResolveExistingDirectoryPath(string path, string? baseDir = null)
        {
            return ResolveExistingPath(path, baseDir, requireFile: false, requireDirectory: true);
        }

        private static string? ResolveExistingPath(
            string path,
            string? baseDir,
            bool requireFile,
            bool requireDirectory)
        {
            if (string.IsNullOrWhiteSpace(path))
                return null;

            string fullPath = Path.GetFullPath(ResolvePlatformPath(path, baseDir));
            if (PathMatchesKind(fullPath, requireFile, requireDirectory))
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

                string? match;
                try
                {
                    match = Directory.EnumerateFileSystemEntries(current)
                        .FirstOrDefault(entry => string.Equals(Path.GetFileName(entry), part, StringComparison.OrdinalIgnoreCase));
                }
                catch
                {
                    return null;
                }

                if (string.IsNullOrEmpty(match))
                    return null;

                current = match;
            }

            return PathMatchesKind(current, requireFile, requireDirectory) ? current : null;
        }

        private static bool PathMatchesKind(string path, bool requireFile, bool requireDirectory)
        {
            if (requireFile)
                return File.Exists(path);

            if (requireDirectory)
                return Directory.Exists(path);

            return File.Exists(path) || Directory.Exists(path);
        }

        public static string GetTelnetLogin(string inStr)
        {
            // get telnet commands from this line
            int x = 0;
            string result = string.Empty;

            for (int i = 0; i < inStr.Length; i++)
            {
                if (x > 0)
                    x--;

                if (inStr[i] == (char)255)
                    x = 3;

                if (x > 0)
                    result += inStr[i];
            }

            return result;
        }

        public static string StripChars(string s)
        {
            // remove all unusual characters from line
            string result = string.Empty;

            for (int i = 0; i < s.Length; i++)
            {
                if (s[i] >= 32 && s[i] < 127)
                    result += s[i];
            }

            return result;
        }

        public static void SetFileExtension(ref string filename, string extension)
        {
            // ensure the filename has an extension.  If not, make one
            if (!filename.Contains("."))
                filename = filename + extension;
        }

        public static string WordWrap(string s, int maxWidth = 60)
        {
            // word-wrap value to max characters
            int col = 1;
            char[] chars = s.ToCharArray();

            for (int i = 0; i < chars.Length; i++)
            {
                if (chars[i] == '\r')
                    col = 0;
                else
                    col++;

                if (col > maxWidth && chars[i] == ' ')
                {
                    for (int j = i; j < chars.Length; j++)
                    {
                        if (chars[j] != ' ')
                        {
                            s = s.Insert(j, "\r\n");
                            col = 0;
                            break;
                        }
                    }
                }
            }

            return s;
        }

        public static bool IsIpAddress(string addr)
        {
            int dots = 0;

            foreach (char c in addr)
            {
                if (c == '.')
                    dots++;
                else if (c < '0' || c > '9')
                    return false;
            }

            return dots == 3;
        }

        public static void ReverseTList<T>(List<T> list)
        {
            // This procedure flips a lists' order
            list.Reverse();
        }

        public static List<string> Split(string line, string? delimiters = null)
        {
            char[] separators = string.IsNullOrEmpty(delimiters)
                ? new[] { '\t', ' ' }
                : delimiters.ToCharArray();

            return line.Split(separators, StringSplitOptions.RemoveEmptyEntries).ToList();
        }

        public static string Generate(string name, string baseStr)
        {
            byte key = 0x5A;
            byte b = 0x9F;

            for (int i = 0; i < name.Length; i++)
            {
                key = (byte)(((key ^ (byte)name[i]) * (i + 1)) ^ 127 ^ (byte)name[Math.Min(1, name.Length - 1)]);
            }

            string result = string.Empty;
            for (int i = 0; i < baseStr.Length; i++)
            {
                byte a = (byte)baseStr[i];
                a = (byte)(a ^ key ^ (b * (i + 1)));
                b = a;

                a = (byte)(a / 8);

                if (a < 10)
                    a += 48;
                else
                    a += 55;

                result += (char)a;
            }

            return result;
        }
    }
}
