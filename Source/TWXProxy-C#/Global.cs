using System;
using GUI;
using Bubble;
using Menu;
using DataBase;
using Log;
using Process;
using Script;
using TCP;
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
namespace Global.Units
{
    public class Global
    {
    // Module variables:
        public static TModMenu TWXMenu = null;
        public static TModDatabase TWXDatabase = null;
        public static TModLog TWXLog = null;
        public static TModExtractor TWXExtractor = null;
        public static TModInterpreter TWXInterpreter = null;
        public static TModServer TWXServer = null;
        public static TModClient TWXClient = null;
        public static TModBubble TWXBubble = null;
        public static TModGUI TWXGUI = null;
    } // end Global

}

