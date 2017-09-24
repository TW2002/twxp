using System;
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
namespace Ansi.Units
{
    public class Ansi
    {
        // ANSI Code Constants
        public const string ANSI_0 = '' + "[0m" + '' + "[30m";
        public const string ANSI_1 = '' + "[0m" + '' + "[34m";
        public const string ANSI_2 = '' + "[0m" + '' + "[32m";
        public const string ANSI_3 = '' + "[0m" + '' + "[36m";
        public const string ANSI_4 = '' + "[0m" + '' + "[31m";
        public const string ANSI_5 = '' + "[0m" + '' + "[35m";
        public const string ANSI_6 = '' + "[0m" + '' + "[33m";
        public const string ANSI_7 = '' + "[0m" + '' + "[37m";
        public const string ANSI_8 = '' + "[30;1m";
        public const string ANSI_9 = '' + "[34;1m";
        public const string ANSI_10 = '' + "[32;1m";
        public const string ANSI_11 = '' + "[36;1m";
        public const string ANSI_12 = '' + "[31;1m";
        public const string ANSI_13 = '' + "[35;1m";
        public const string ANSI_14 = '' + "[33;1m";
        public const string ANSI_15 = '' + "[37;1m";
        public const string ANSI_CLEARLINE = '' + "[K";
        public const string ANSI_MOVEUP = '' + "[1A";
    } // end Ansi

}

