using System;
using System.Windows.Forms;
using System.IO;
using FormMain;
using FormSetup;
using Process;
using Script;
using Menu;
using DataBase;
using Utility;
using FormHistory;
using Bubble;
using Log;
using ScriptCmd;
using TWXExport;
using ScriptCmp;
using Ansi;
using ScriptRef;
using FormAbout;
using TCP;
using FormScript;
using Core;
using Global;
using Persistence;
using GUI;
using Observer;
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
namespace TWXProxy
{
    // TMessageHandler: This class exists only because the Application.OnMessage has
    // to be implmented as a property on an object.
    public class TMessageHandler
    {
        public void OnApplicationMessage(ref TMsg Msg, ref bool Handled)
        {
            TNotificationEvent NotificationEvent;
            //@ Unsupported property or method(C): 'Message'
            //@ Undeclared identifier(3): 'WM_USER'
            //@ Unsupported property or method(C): 'wParam'
            if ((Msg.Message == WM_USER) && (Msg.wParam != 47806))
            {
                //@ Unsupported property or method(C): 'wParam'
                if ((Msg.wParam == 47806))
                {
                    // 47806 = $BABE, still unsure what the cause is
                    //@ Unsupported property or method(C): 'wParam'
                    //@ Unsupported function or procedure: 'Dispose'
                    Dispose((Msg.wParam as object));
                // There appears to be no side effects to dismissing it
                }
                else
                {
                    // Dispatch message to the object its meant for
                    //@ Unsupported property or method(C): 'wParam'
                    NotificationEvent = ((TNotificationEvent)((Msg.wParam as object)));
                    //@ Unsupported property or method(C): 'lParam'
                    NotificationEvent((Msg.lParam as object));
                    //@ Unsupported property or method(C): 'wParam'
                    //@ Unsupported function or procedure: 'Dispose'
                    Dispose((Msg.wParam as object));
                }
                Handled = true;
            }
        }

    } // end TMessageHandler

    public enum TModuleType
    {
        mtDatabase,
        mtBubble,
        mtExtractor,
        mtMenu,
        mtServer,
        mtInterpreter,
        mtClient,
        mtLog,
        mtGUI
    } // end TModuleType

}

namespace TWXProxy.Units
{
    public class TWXProxy
    {
        public static TPersistenceManager PersistenceManager = null;
        public static TMessageHandler MessageHandler = null;
        public static string ProgramDir = String.Empty;
        // ModuleClasses: Must line up with TModuleType for constructors to work properly
        public static TModuleClass[] ModuleClasses = {TModDatabase, TModBubble, TModExtractor, TModMenu, TModServer, TModInterpreter, TModClient, TModLog, TModGUI};
        public static TTWXModule ModuleFactory(TModuleType Module)
        {
            TTWXModule result;
            ITWXGlobals Globals;
            //@ Unsupported property or method(B): 'Create'
            result = ModuleClasses[Module].Create(Application, PersistenceManager);
            //@ Unsupported property or method(A): 'GetInterface'
            if ((result.GetInterface(ITWXGlobals, Globals)))
            {
                // set globals for this module
                //@ Unsupported property or method(D): 'ProgramDir'
                Globals.ProgramDir = ProgramDir;
            }
            switch(Module)
            {
                case TModuleType.mtMenu:
                    // Not ideal.  This completely breaks the idea behind the factory method.  Having
                    // all of these objects existing in a global scope destroys the modularity of
                    // the application but is unfortunately necessary because of their current
                    // interdependency.  The vision was to have each module abstracted through the
                    // use of interfaces - I just never had time to pull this off.
                    Global.Units.Global.TWXMenu = (TModMenu)result;
                    break;
                case TModuleType.mtDatabase:
                    Global.Units.Global.TWXDatabase = (TModDatabase)result;
                    break;
                case TModuleType.mtLog:
                    Global.Units.Global.TWXLog = (TModLog)result;
                    break;
                case TModuleType.mtExtractor:
                    Global.Units.Global.TWXExtractor = (TModExtractor)result;
                    break;
                case TModuleType.mtInterpreter:
                    Global.Units.Global.TWXInterpreter = (TModInterpreter)result;
                    break;
                case TModuleType.mtServer:
                    Global.Units.Global.TWXServer = (TModServer)result;
                    break;
                case TModuleType.mtClient:
                    Global.Units.Global.TWXClient = (TModClient)result;
                    break;
                case TModuleType.mtBubble:
                    Global.Units.Global.TWXBubble = (TModBubble)result;
                    break;
                case TModuleType.mtGUI:
                    Global.Units.Global.TWXGUI = (TModGUI)result;
                    break;
            }
            return result;
        }

        public static void InitProgram()
        {
            int I;
            int Sectors;
            string DBName;
            string Usage;
            string __Switch;
            bool NewDB;
            TModuleType ModuleType;
            TSearchRec S;
            //@ Undeclared identifier(3): 'DebugHook'
            //@ Undeclared identifier(3): 'ReportMemoryLeaksOnShutdown'
            ReportMemoryLeaksOnShutdown = DebugHook != 0;
            // EP - Enables new mem-manager to report leaks if Debug=TRUE
            //@ Unsupported function or procedure: 'Randomize'
            Randomize;
            ProgramDir = Environment.CurrentDirectory;
            MessageHandler = new TMessageHandler();
            //@ Unsupported property or method(C): 'OnMessage'
            Application.OnMessage = MessageHandler.OnApplicationMessage();
            // Create dirs if they aren't there
            if (!(Directory.Exists(ProgramDir + "\\data")))
            {
                Directory.CreateDirectory(ProgramDir + "\\data");
            }
            if (!(Directory.Exists(ProgramDir + "\\scripts")))
            {
                Directory.CreateDirectory(ProgramDir + "\\scripts");
            }
            if (!(Directory.Exists(ProgramDir + "\\logs")))
            {
                Directory.CreateDirectory(ProgramDir + "\\logs");
            }
            PersistenceManager = new TPersistenceManager(Application);
            //@ Unsupported property or method(D): 'OutputFile'
            PersistenceManager.OutputFile = "TWXSetup.dat";
            // call object constructors
            //@ Unsupported function: 'Low'
            //@ Unsupported function: 'High'
            for (ModuleType = Low(TModuleType); ModuleType <= High(TModuleType); ModuleType ++ )
            {
                ModuleFactory(ModuleType);
            }
            //@ Unsupported property or method(D): 'LoadStateValues'
            PersistenceManager.LoadStateValues;
            // check command line values
            I = 1;
            while ((I <= Environment.GetCommandLineArgs().Length))
            {
                Usage = "Usage:/ntwxproxy /p <port#> /dblist";
                __Switch = Environment.GetCommandLineArgs()[I].ToUpper();
                // WriteLn(Switch + endl);
                if ((__Switch.Substring(1 - 1 ,2) == "/P") && (__Switch.Length > 2))
                {
                    Global.Units.Global.TWXServer.ListenPort = Utility.Units.Utility.StrToIntSafe(__Switch.Substring(3 - 1 ,__Switch.Length));
                // EP - New Switches
                // Single Parameters
                }
                else if ((__Switch == "/DBLIST"))
                {
                    // List Database Files
                    ;
                    // Exit;
                    Environment.CurrentDirectory = ProgramDir;
                    //@ Unsupported function or procedure: 'FindFirst'
                    if ((FindFirst("data\\*.xdb", 0x0000003f, S) == 0))
                    {
                        do
                        {
                            //@ Unsupported property or method(C): 'Name'
                            ;
                            //@ Unsupported function or procedure: 'FindNext'
                        } while (!((FindNext(S) != 0)));
                        //@ Unsupported function or procedure: 'FindClose'
                        FindClose(S);
                    }
                    return;
                // Multiple Parameters
                }
                else if ((Environment.GetCommandLineArgs().Length > I))
                {
                    I ++;
                    // Alternate syntax for listening port, e.g. "twxproxy /p 2002"
                    if (__Switch == "/P")
                    {
                        Global.Units.Global.TWXServer.ListenPort = Utility.Units.Utility.StrToIntSafe(Environment.GetCommandLineArgs()[I]);
                    }
                    else if (__Switch == "/DBCREATE")
                    {
                        // Create a new Database
                        // Get Database Name
                        DBName = Environment.GetCommandLineArgs()[I];
                        NewDB = true;
                    }
                    else if (__Switch == "/SECTORS")
                    {
                        try {
                            Sectors = Utility.Units.Utility.StrToIntSafe(Environment.GetCommandLineArgs()[I]);
                            NewDB = true;
                        }
                        catch {
                            Global.Units.Global.TWXServer.Broadcast(Usage);
                        }
                    }
                    else if (__Switch == "/SCRIPT")
                    {
                    // Launch the specified script
                    }
                }
                // End Multi-Parameters
                I ++;
            }
            // End While (I <= ParamCount)

        }

        public static void FinaliseProgram()
        {
            //@ Unsupported property or method(D): 'SaveStateValues'
            PersistenceManager.SaveStateValues;
            // More hacks ... force a destruction order using global variables to prevent
            // AVs on exit (some modules have extra processing on shutdown)
            // Note that modules not freed here are owned by the application object anyway -
            // so they will be freed implicitly.
            //@ Unsupported property or method(C): 'Free'
            Global.Units.Global.TWXInterpreter.Free;
            //@ Unsupported property or method(C): 'Free'
            Global.Units.Global.TWXGUI.Free;
            //@ Unsupported property or method(C): 'Free'
            Global.Units.Global.TWXClient.Free;
            //@ Unsupported property or method(C): 'Free'
            Global.Units.Global.TWXServer.Free;
            //@ Unsupported property or method(C): 'Free'
            Global.Units.Global.TWXLog.Free;
            //@ Unsupported property or method(C): 'Free'
            Global.Units.Global.TWXMenu.Free;
            //@ Unsupported property or method(C): 'Free'
            Global.Units.Global.TWXDatabase.Free;
            //@ Unsupported property or method(C): 'Free'
            Global.Units.Global.TWXBubble.Free;
            //@ Unsupported property or method(C): 'Free'
            Global.Units.Global.TWXExtractor.Free;
            //@ Unsupported property or method(C): 'Free'
            MessageHandler.Free;
        }

        [STAThread]
        public static void Main(string[] args)
        {
            // {$IFNDEF RELEASE}
            // MemChk;
            // {$ENDIF}
            // Application.Initialize;
            //@ Unsupported property or method(C): 'Title'
            Application.Title = "TWX Proxy";
            Environment.CurrentDirectory = Path.GetDirectoryName(System.Environment.GetCommandLineArgs()[0]);
            InitProgram();
            // EP - The Server ListenPort is persisted by the database now, so load from there
            if (Global.Units.Global.TWXDatabase.DataBaseOpen)
            {
                Global.Units.Global.TWXServer.ListenPort = Global.Units.Global.TWXDatabase.DBHeader.ServerPort;
            }
            else
            {
                Global.Units.Global.TWXServer.ListenPort = 23;
            }
            Global.Units.Global.TWXServer.Activate();
            try {
                do
                {
                // we don't use the TApplication message loop, as it requires a main form
                    //@ Unsupported property or method(C): 'HandleMessage'
                    Application.HandleMessage;
                    //@ Unsupported property or method(C): 'Terminated'
                } while (!(Application.Terminated));
            } finally {
                FinaliseProgram();
            }
            Application.Run();
        }

    } // end TWXProxy

}

