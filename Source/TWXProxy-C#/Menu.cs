using System;
using System.Collections;
using System.IO;
using System.Windows.Forms;
using Core;
using Script;
using ScriptCmp;
using Utility;
using DataBase;
using Global;
using Bubble;
using TCP;
using Ansi;
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
 // This unit controls all hard coded menus send to the client
namespace Menu
{
    public class EMenuException: Exception
    {
        //@ Constructor auto-generated 
        public EMenuException(String message)
            :base(message)
        {
        }
        //@ Constructor auto-generated 
        public EMenuException(String message, Exception innerException)
            :base(message, innerException)
        {
        }
    } // end EMenuException

    // an option within a menu
    public class TTWXMenuItem
    {
        public TMenuEvent OnLineComplete
        {
          get {
            return FOnLineComplete;
          }
          set {
            FOnLineComplete = value;
          }
        }
        public TMenuEvent OnActivate
        {
          get {
            return FOnActivate;
          }
          set {
            FOnActivate = value;
          }
        }
        public string Title
        {
          get {
            return FTitle;
          }
          set {
            FTitle = value;
          }
        }
        public char HotKey
        {
          get {
            return FHotKey;
          }
          set {
            FHotKey = value;
          }
        }
        public string Line
        {
          get {
            return FLine;
          }
          set {
            FLine = value;
          }
        }
        public TTWXMenuItem ParentMenu
        {
          get {
            return FParentMenu;
          }
          set {
            FParentMenu = value;
          }
        }
        public bool ScriptMacrosOn
        {
          get {
            return FScriptMacrosOn;
          }
          set {
            FScriptMacrosOn = value;
          }
        }
        public string Name
        {
          get {
            return FName;
          }
          set {
            FName = value;
          }
        }
        public bool CloseActivate
        {
          get {
            return FCloseActivate;
          }
          set {
            FCloseActivate = value;
          }
        }
        public string Reference
        {
          get {
            return FReference;
          }
          set {
            FReference = value;
          }
        }
        public TModMenu Controller
        {
          get {
            return FController;
          }
          set {
            FController = value;
          }
        }
        public TScript ScriptOwner
        {
          get {
            return FScriptOwner;
          }
          set {
            FScriptOwner = value;
          }
        }
        public bool IsCustom
        {
          get {
            return FIsCustom;
          }
          set {
            FIsCustom = value;
          }
        }
        public int MenuItemCount
        {
          get {
            return GetMenuItemCount();
          }
        }
        public string Value
        {
          get {
            return FValue;
          }
          set {
            FValue = value;
          }
        }
        public string Help
        {
          get {
            return FHelp;
          }
          set {
            FHelp = value;
          }
        }
        public bool ClearLine
        {
          get {
            return FClearLine;
          }
          set {
            FClearLine = value;
          }
        }
        protected string FName = String.Empty;
        protected string FValue = String.Empty;
        protected string FPrompt = String.Empty;
        protected string FLine = String.Empty;
        protected string FReference = String.Empty;
        protected string FTitle = String.Empty;
        protected string FHelp = String.Empty;
        protected TMenuEvent FOnLineComplete = null;
        protected TMenuEvent FOnActivate = null;
        // activated by process unit
        protected char FHotKey = (char)0;
        protected TModMenu FController = null;
        protected ArrayList MenuParams = null;
        protected ArrayList MenuItems = null;
        protected TTWXMenuItem FParentMenu = null;
        protected bool FOpExit = false;
        protected bool FOpList = false;
        protected bool FOpHelp = false;
        protected bool FCloseActivate = false;
        protected bool FClearLine = false;
        protected bool FIsCustom = false;
        protected bool FScriptMacrosOn = false;
        protected TScript FScriptOwner = null;
        // ***************************************************************
        // TTWXMenuItem implementation
        //Constructor  Create( Owner,  Name,  OnActivate,  Title,  Prmpt,  Key)
        public TTWXMenuItem(TModMenu Owner, string Name, TMenuEvent OnActivate, string Title, string Prmpt, char Key) : base()
        {
            FController = Owner;
            FTitle = Title;
            FHotKey = Key;
            FOnActivate = OnActivate;
            FPrompt = Prmpt;
            FLine = "";
            FReference = "";
            FScriptMacrosOn = false;
            FName = Name;
            FScriptOwner = null;
            FIsCustom = false;
            FClearLine = true;
            FOpExit = true;
            FOpHelp = true;
            FOpList = true;
            MenuParams = new ArrayList();
            MenuItems = new ArrayList();
            Owner.LinkMenu(this);
        }
        //Constructor  Create( Owner,  Name,  Title,  Prmpt,  Key)
        public TTWXMenuItem(TModMenu Owner, string Name, string Title, string Prmpt, char Key) : base()
        {
            // alternative constructor for menu without activation procedure
            FController = Owner;
            FTitle = Title;
            FHotKey = Key;
            FPrompt = Prmpt;
            FLine = "";
            FReference = "";
            FScriptMacrosOn = false;
            FName = Name;
            FIsCustom = false;
            FScriptOwner = null;
            FClearLine = true;
            FOpExit = true;
            FOpHelp = true;
            FOpList = true;
            MenuParams = new ArrayList();
            MenuItems = new ArrayList();
            Owner.LinkMenu(this);
        }
        //@ Destructor  Destroy()
        ~TTWXMenuItem()
        {
            int I;
            for (I = 0; I < MenuItems.Count; I ++ )
            {
                ((MenuItems[I]) as TTWXMenuItem).ParentMenu = null;
            }
            //@ Unsupported property or method(C): 'Free'
            MenuItems.Free;
            while ((MenuParams.Count > 0))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(MenuParams[0]);
                MenuParams.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            MenuParams.Free;
            // unlink from controller list
            Controller.UnlinkMenu(this);
            // remove from parent list
            if ((FParentMenu != null))
            {
                FParentMenu.RemoveItem(this);
            }
            //@ Unsupported property or method(D): 'Destroy'
            base.Destroy;
        }
        public void DumpOptions()
        {
            int I;
            TTWXMenuItem Item;
            // show all menu options
            Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_CLEARLINE + '\r' + Units.Menu.MENU_LIGHT + FTitle + ':' + Core.Units.Core.endl);
            if (FOpList)
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + '?' + Ansi.Units.Ansi.ANSI_7 + " - Command list" + Core.Units.Core.endl);
            }
            if (FOpHelp)
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + '+' + Ansi.Units.Ansi.ANSI_7 + " - Help on command" + Core.Units.Core.endl);
            }
            if (FOpExit)
            {
                if ((ParentMenu == null) && (ScriptOwner != null))
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + 'Q' + Ansi.Units.Ansi.ANSI_7 + " - Terminate script" + Core.Units.Core.endl);
                }
                else
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + 'Q' + Ansi.Units.Ansi.ANSI_7 + " - Exit menu" + Core.Units.Core.endl);
                }
            }
            // sort menu options by their hotkey
            if ((MenuItems.Count > 1))
            {
                MenuItems.Sort(Units.Menu.MenuSortFunc);
            }
            for (I = 0; I < MenuItems.Count; I ++ )
            {
                Item = ((MenuItems[I]) as TTWXMenuItem);
                Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + Item.HotKey + Units.Menu.MENU_DARK + " - " + Item.Title);
                if ((Item.Value != ""))
                {
                    // display menu item value
                    Global.Units.Global.TWXServer.Broadcast(Utility.Units.Utility.GetSpace(25 - Item.Title.Length) + Units.Menu.MENU_LIGHT + Item.Value.Replace('\r', '*'));
                }
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + GetPrompt());
        }

        public void SetOptions(bool OpExit, bool OpList, bool OpHelp)
        {
            FOpExit = OpExit;
            FOpList = OpList;
            FOpHelp = OpHelp;
        }

        public void AddItem(object Item)
        {
            // add menu item to list
            MenuItems.Add(Item);
            //@ Unsupported property or method(D): 'ParentMenu'
            Item.ParentMenu = this;
        }

        public void RemoveItem(object Item)
        {
            // remove item from list
            MenuItems.Remove(Item);
        }

        public void AddParam(object P)
        {
            // save menu parameter in list
            MenuParams.Add(P);
        }

        public object GetParam(int Index)
        {
            object result;
            // get stored parameter by index
            result = MenuParams[Index];
            return result;
        }

        public void MenuKey(char Key, byte ClientIndex)
        {
            int I;
            TMenuEvent LastLineSub;
            bool Found;
            if (!((FOnLineComplete != null)))
            {
                // non text menu option
                if ((Key == '?'))
                {
                    DumpOptions();
                }
                else if ((Controller.HelpMode))
                {
                    // display help text for selected option
                    Found = false;
                    for (I = 0; I < MenuItems.Count; I ++ )
                    {
                        if ((((MenuItems[I]) as TTWXMenuItem).HotKey == Char.ToUpper(Key)))
                        {
                            if ((((MenuItems[I]) as TTWXMenuItem).Help != ""))
                            {
                                Found = true;
                            }
                            break;
                        }
                    }
                    if (Found)
                    {
                        Global.Units.Global.TWXServer.ClientMessage("Help for option \'" + Char.ToUpper(Key) + "\':" + Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_MID + Utility.Units.Utility.WordWrap(((MenuItems[I]) as TTWXMenuItem).Help) + Core.Units.Core.endl);
                    }
                    else
                    {
                        Global.Units.Global.TWXServer.ClientMessage("No help is available for this option");
                    }
                    Controller.HelpMode = false;
                }
                else if ((Key == '+'))
                {
                    // enter help mode
                    Global.Units.Global.TWXServer.ClientMessage("Select the option you need help on");
                    Controller.HelpMode = true;
                }
                else if (((Key == 'Q') || (Key == 'q')))
                {
                    if (((ParentMenu != null)))
                    {
                        // go back to parent menu
                        Controller.OpenMenuItem(ParentMenu, ClientIndex, FName);
                    }
                    else
                    {
                        Controller.CloseMenu(true);
                    }
                }
                else
                {
                    Found = false;
                    for (I = 0; I < MenuItems.Count; I ++ )
                    {
                        if ((((MenuItems[I]) as TTWXMenuItem).HotKey == Char.ToUpper(Key)))
                        {
                            Controller.OpenMenuItem(MenuItems[I], ClientIndex, FName);
                            Found = true;
                            break;
                        }
                    }
                    if (!Found && ((byte)Key >= 48) && ((byte)Key <= 57) && FScriptMacrosOn)
                    {
                        Controller.CloseMenu(false);
                        Global.Units.Global.TWXInterpreter.Load(Utility.Units.Utility.FetchScript(Key, false), false);
                    }
                }
            }
            else
            {
                // hack for singlekey script inputs
                if ((FName == "TWX_SCRIPTKEY"))
                {
                    Controller.CloseMenu(false);
                    Controller.InputScript.InputCompleted(Key, Global.Units.Global.TWXMenu.InputScriptVar);
                    return;
                }
                // echo the key pressed
                if ((Key != "\08"))
                {
                    Global.Units.Global.TWXServer.Broadcast(Key);
                }
                // Check for backspace
                if ((Key == "\08"))
                {
                    if ((Line.Length > 0))
                    {
                        Line = Line.Substring(1 - 1 ,Line.Length - 1);
                        Global.Units.Global.TWXServer.Broadcast("\08" + ' ' + "\08");
                    }
                }
                else if (((int)(Key) >= 32))
                {
                    Line = Line + Key;
                }
                else if ((Key == '\r'))
                {
                    // input line completed
                    if (((FOnLineComplete != null)))
                    {
                        LastLineSub = FOnLineComplete;
                        FOnLineComplete = null;
                        // call line completed handler
                        LastLineSub(ClientIndex);
                        FLine = "";
                        if ((Controller.CurrentMenu == this) && (FName != "TWX_SCRIPTTEXT"))
                        {
                            // menu has not branched
                            if (!((FOnLineComplete != null)))
                            {
                                // option is completed - purge parameters and return to parent menu
                                while ((MenuParams.Count > 0))
                                {
                                    //@ Unsupported function or procedure: 'FreeMem'
                                    FreeMem(MenuParams[0]);
                                    MenuParams.RemoveAt(0);
                                }
                                if (((FParentMenu != null)))
                                {
                                    if ((Controller.CurrentMenu != null))
                                    {
                                        Controller.OpenMenuItem(FParentMenu, ClientIndex, FName);
                                    }
                                }
                                else
                                {
                                    Controller.CloseMenu(false);
                                }
                            }
                            else
                            {
                                Global.Units.Global.TWXServer.Broadcast(GetPrompt());
                            }
                        }
                    }
                    else
                    {
                        Controller.CloseMenu(false);
                    }
                // menu function not properly implemented?
                }
            }
        }

        public string GetPrompt()
        {
            string result;
            result = Units.Menu.MENU_LIGHT + FPrompt + Units.Menu.MENU_MID + "> " + Ansi.Units.Ansi.ANSI_7 + FLine;
            return result;
        }

        public int GetMenuItemCount()
        {
            int result;
            result = MenuItems.Count;
            return result;
        }

    } // end TTWXMenuItem

    // TModMenu - controls all menus
    public class TModMenu: TTWXModule, ITWXGlobals
    {
        public bool HelpMode
        {
          get {
            return FHelpMode;
          }
          set {
            FHelpMode = value;
          }
        }
        public string SandboxGame
        {
          get {
            return FSandboxGame;
          }
          set {
            FSandboxGame = value;
          }
        }
        public TTWXMenuItem CurrentMenu
        {
          get {
            return FCurrentMenu;
          }
        }
        public TScript InputScript
        {
          get {
            return FInputScript;
          }
        }
        private TTWXMenuItem MainMenu = null;
        private TTWXMenuItem ScriptMenu = null;
        private TTWXMenuItem ScriptMenuKey = null;
        private TTWXMenuItem FCurrentMenu = null;
        private string LastBurst = String.Empty;
        private TScript FInputScript = null;
        private TVarParam InputScriptVar = null;
        private ArrayList MenuItemList = null;
        private bool FHelpMode = false;
        private string FProgramDir = String.Empty;
        private string FSandboxGame = String.Empty;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        // ***************************************************************
        // TModMenu implementation
        public override void AfterConstruction()
        {
            TTWXMenuItem DatabaseMenu;
            TTWXMenuItem SetupMenu;
            TTWXMenuItem SptMenu;
            TTWXMenuItem DataMenu;
            TTWXMenuItem PortMenu;
            TTWXMenuItem Menu;
            // called by program initialisation
            base.AfterConstruction();
            // menu item list
            MenuItemList = new ArrayList();
            // base menus
            MainMenu = new TTWXMenuItem(this, "TWX_MAIN", "Main menu", "Main", '\0');
            MainMenu.ScriptMacrosOn = true;
            SptMenu = new TTWXMenuItem(this, "TWX_SCRIPT", "Script menu", "Script", 'S');
            DataMenu = new TTWXMenuItem(this, "TWX_DATA", "Data menu", "Data", 'D');
            PortMenu = new TTWXMenuItem(this, "TWX_PORT", "Port menu", "Port", 'P');
            SetupMenu = new TTWXMenuItem(this, "TWX_SETUP", "Setup menu", "Setup", 'T');
            DatabaseMenu = new TTWXMenuItem(this, "TWX_DATABASE", "Database control menu", "Database", 'D');
            // base menu help text
            SptMenu.Help = "The script menu contains all the options that allow you to control scripts.";
            DataMenu.Help = "The data menu contains options that allow you to query the currently selected game database.";
            PortMenu.Help = "The port menu contains options that allow you to run port-related queries on the currently selected game database.";
            SetupMenu.Help = "The setup menu reflects all the options in the program Setup Form.  Here you can configure the program just the way you need it.";
            DatabaseMenu.Help = "The database menu allows you to select and configure TWX Proxy Databases.";
            // script inputs
            ScriptMenu = new TTWXMenuItem(this, "TWX_SCRIPTTEXT", miScriptInputActivate, "", "", '\0');
            ScriptMenuKey = new TTWXMenuItem(this, "TWX_SCRIPTKEY", miScriptInputActivate, "", "", '\0');
            ScriptMenu.ClearLine = false;
            ScriptMenuKey.ClearLine = false;
            // Build hard-coded menu options
            // setup menu options
            SetupMenu.AddItem(DatabaseMenu);
            Menu = new TTWXMenuItem(this, "TWX_LISTENPORT", miListenPort, "Listen port", "Port", 'P');
            Menu.Help = "The listening port is the network port that TWX Proxy will listen on for its telnet clients.  Usually this should be set to 23, unless you are running some other kind of telnet server.";
            SetupMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_BUBBLESIZE", miBubbleSize, "Max bubble size", "Bubble size", 'B');
            Menu.Help = "The bubble size is the max size possible of bubbles that are calculated in the data menu.  A higher number of sectors will give you more information on large bubbles, but the calculation will take much longer.";
            SetupMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_RECONNECT", miReconnect, "Auto reconnect", "Reconnect", 'R');
            Menu.Help = "If this option is enabled, TWX Proxy will automatically reconnect to the server 3 seconds after it" + " is disconnected.  This is an excellent feature if you are running scripts while you are away from the keyboard, as most scripts are able to resume when they log you back in.";
            SetupMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_LOG", miLog, "Logging", "Logging", 'L');
            Menu.Help = "If logging is enabled, TWX Proxy will log all game data to a .log file for you to view later.  Scripts are able to turn logging off so that the log file doesn\'t get too big.";
            SetupMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_LOGANSI", miLogAnsi, "Log ANSI", "Log ANSI", 'A');
            Menu.Help = "If ANSI logging is enabled, TWX Proxy will log ANSI codes along with other data logged.  This could be useful if you have some sort of ANSI viewer - as you could view your logs in full colour.";
            SetupMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_ACCEPTEXTERNAL", miAcceptExternal, "Accept external connects", "External", 'X');
            Menu.Help = "If accept external connections is enabled, people from outside your computer will be able to connect to TWX Proxy and see things the same way that you do.  Note that they will be locked in view only mode if they connect from outside your local network.";
            SetupMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_CACHE", miCache, "Database cache", "Cache", 'C');
            Menu.Help = "If the database cache is turned on, TWX Proxy will store a copy of the selected database in memory, allowing it to access it very quickly.  Turning this off will save you some memory, at the expense of performance.";
            SetupMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_RECORDING", miRecording, "Recording", "Recording", 'E');
            Menu.Help = "If recording is turned on, TWX Proxy will try to record everything it sees directly into the selected database.  If this is disabled, all data will be ignored.  Note that most scripts require recording to be enabled to function properly.";
            SetupMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_MENUKEY", miMenuKey, "Terminal menu key", "Key", 'K');
            Menu.Help = "The terminal menu key is the key that you need to press to access this menu.  You can set this to any key on the keyboard.";
            SetupMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_LOCALECHO", miLocalEcho, "Local echo", "Local echo", 'H');
            Menu.Help = "If local echo is enabled, all keypresses that you send to the remove server will be echoed back to your terminal.  This is especially useful if you want to use TWX Proxy for MUDs.";
            SetupMenu.AddItem(Menu);
            // main menu options
            MainMenu.AddItem(SptMenu);
            MainMenu.AddItem(DataMenu);
            MainMenu.AddItem(PortMenu);
            MainMenu.AddItem(SetupMenu);
            Menu = new TTWXMenuItem(this, "TWX_BURST", miBurst, "Send burst", "Burst", 'B');
            Menu.Help = "The burst option lets you send one block of text straight to the remote server in one \'burst\'.  This is basically a one-shot macro - it allows you to move as fast as the game allows you to do so.  " + "To send an ENTER in a burst, use the * character, i.e, to deploy a toll fighter: f1*ct";
            MainMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_REPEATBURST", miBurstRepeat, "Repeat last burst", "Burst", 'R');
            Menu.Help = "The repeat burst option repeats the last burst you sent to the remote server.";
            MainMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_EDITBURST", miBurstEdit, "Edit/Send last burst", "Burst", 'E');
            Menu.Help = "The edit burst option opens up the last burst you sent, so that you can change it before sending it again.";
            MainMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_CONNECT", miConnect, "Connect/Disconnect from server", "", 'C');
            Menu.Help = "This option will immediately connect or disconnect you from the remote server.  The remote server address is configured in the database setup menu, under setup.";
            MainMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_STOPALLFAST", miStopScript, "Stop all scripts", "", 'Z');
            Menu.Help = "This option will immediately terminate all active non-system scripts.  Remember this option for if you ever run a script that gets out of control.";
            MainMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_TOGGLEDEAF", miToggleDeaf, "Toggle deaf client", "", '=');
            Menu.Help = "Deafs clients are telnet terminals that don\'t receive anything from the remote server.  This option will " + "turn your connected terminal into a \'deaf\' terminal.  This is great if you have a fast-paced script running in the background and you want to query your database.";
            MainMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWCLIENTS", miShowClients, "Show all clients", "", '-');
            Menu.Help = "This option will show all telnet terminals connected to TWX Proxy, along with their IP addresses.";
            MainMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_EXIT", miExit, "Exit Program", "", 'X');
            Menu.Help = "This option will immediately shut down TWX Proxy, disconnecting from the remote server.";
            MainMenu.AddItem(Menu);
            // script menu options
            Menu = new TTWXMenuItem(this, "TWX_LOADSCRIPT", miLoad, "Load script", "Load Script", 'S');
            Menu.Help = "The load script option will load and begin execution of a TWX Proxy script.";
            SptMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_LOADLASTSCRIPT", miLoadLast, "Load last script", "", 'L');
            Menu.Help = "This option will reload the last script you executed.";
            SptMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_STOPALL", miStopScript, "Stop all scripts", "", 'X');
            Menu.Help = "This option will immediately terminate all active non-system scripts.  Remember this option for if you ever run a script that gets out of control.";
            SptMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_DUMPSCRIPTVARS", miDumpVars, "Dump script variables", "", 'V');
            Menu.Help = "This option will move through every active script, showing variables and their values.  This is a very useful debugging tool - but it can take a while if you have lots of variables in your scripts.";
            SptMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_DUMPSCRIPTTRIGGERS", miDumpTriggers, "Dump all script triggers", "", 'T');
            Menu.Help = "This option will move through every active script, showing all active triggers.";
            SptMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_LISTACTIVE", miListActive, "List active scripts", "", 'I');
            Menu.Help = "This option will list all the scripts you currently have running, along with the IDs.";
            SptMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_LISTDIRECTORY", miListDirectory, "List script directory", "", 'D');
            Menu.Help = "This option will list all the scripts in your \\scripts folder.";
            SptMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_KILL", miKill, "Kill script by ID", "Kill", 'K');
            Menu.Help = "This option will take the ID number of any script you have running and immediately terminate it.";
            SptMenu.AddItem(Menu);
            // data menu options
            Menu = new TTWXMenuItem(this, "TWX_SHOWSECTOR", miShowSector, "Display sector as last seen", "Sector", 'D');
            Menu.Help = "This option will display a sector as TWX Proxy last saw it.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWFIGS", miShowFigs, "Show all sectors with foreign fighters", "", 'F');
            Menu.Help = "This option will show all the sectors TWX Proxy has seen with enemy fighters in them.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWMINES", miShowMines, "Show all sectors with mines", "", 'M');
            Menu.Help = "This option will show all the sectors TWX Proxy has seen with mines in them.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWDENSITY", miShowDensity, "Show all sectors by density comparison", "Density", 'S');
            Menu.Help = "This option will show all sectors that match a particular density range.  Note that this can only show sectors that have been density scanned before.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWANOM", miShowAnomaly, "Show all sectors with Anomaly", "", 'A');
            Menu.Help = "This option will show all the sectors that have been picked up with an Anomaly by density scans.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWTRADERS", miShowTraders, "Show all sectors with traders", "", 'R');
            Menu.Help = "This option will show all the sectors have been seen with other traders in them.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_PLOTCOURSE", miPlotCourse, "Plot warp course", "Sector", 'C');
            Menu.Help = "This option will allow you to plot a warp course between two sectors, internally within TWX Proxy.  Note that you need to have at least a semi-completed ZTM for this option to work properly.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_HOLOSCAN", miHoloscan, "Simulate holo scan", "Sector", 'H');
            Menu.Help = "This option will simulate a holo-scan from a certain sector.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_TOTALSCANNED", miShowTotal, "Show total sectors scanned", "", 'T');
            Menu.Help = "This option will show a ratio of how many sectors have been explored, scanned, etc.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWBUBBLES", miShowBubbles, "Show bubbles found", "", 'B');
            Menu.Help = "This option will calculate and list all the bubbles found within a game.  Note that this bubble list is a reflection of how accurate your ZTM.  If ZTM hasn\'t been done yet, your bubble list will likely be very inaccurate.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWBUBBLE", miShowBubble, "Show bubble details", "Sector", 'Z');
            Menu.Help = "This option will calculate a single bubble, you only need to know the gate and a sector within the bubble.  You need to have visited the bubble or have a fairly accurate ZTM for this option to work properly.";
            DataMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWBACKDOORS", miShowBackdoors, "Show backdoors to specific sector", "Sector", '-');
            Menu.Help = "This option will show all the backdoors TWX Proxy knows about to a certain sector.";
            DataMenu.AddItem(Menu);
            // port menu options
            Menu = new TTWXMenuItem(this, "TWX_SHOWPORT", miShowPort, "Show port details as last seen", "Sector", 'D');
            Menu.Help = "This option will show a particular port as it was reported in your last port CIM check.";
            PortMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_SHOWSPECIALPORT", miShowClassPort, "Show all class 0/9 port sectors", "", '0');
            Menu.Help = "This option will display the sectors of all class 0 or stardock ports that TWX Proxy has seen.";
            PortMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_LISTPORTS", miListPorts, "List all ports", "", 'L');
            Menu.Help = "This option will show a summary of all the ports TWX Proxy has seen.";
            PortMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_LISTUPGRADEDPORTS", miListUpgradedPorts, "List all heavily upgraded ports", "", 'U');
            Menu.Help = "This option will show a summary of all ports that have been upgraded to a max of 10,000 or more in any one product category.";
            PortMenu.AddItem(Menu);
            // game menu options
            Menu = new TTWXMenuItem(this, "TWX_DATABASE_CREATE", miDatabaseCreate, "Create database", "", 'C');
            Menu.Help = "This option will create a new database, with details that you enter.";
            DatabaseMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_DATABASE_EDIT", miDatabaseEdit, "Edit database", "", 'E');
            Menu.Help = "This option will edit the details of an existing database.";
            DatabaseMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_DATABASE_DELETE", miDatabaseDelete, "Delete database", "", 'D');
            Menu.Help = "This option will permanently delete an existing database.";
            DatabaseMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_DATABASE_SELECT", miDatabaseSelect, "Select active database", "Name", 'S');
            Menu.Help = "This option can be used to change the selected database.";
            DatabaseMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_DATABASE_LIST", miDatabaseList, "List databases", "", 'L');
            Menu.Help = "This option will list all the databases TWX Proxy knows about.";
            DatabaseMenu.AddItem(Menu);
            Menu = new TTWXMenuItem(this, "TWX_DATABASE_VIEW", miDatabaseView, "View database details", "", 'V');
            Menu.Help = "This option will display the details of a particular database.";
            DatabaseMenu.AddItem(Menu);
        }

        public override void BeforeDestruction()
        {
            // free up menu items
            while ((MenuItemList.Count > 0))
            {
                //@ Unsupported property or method(C): 'Free'
                ((MenuItemList[0]) as TTWXMenuItem).Free;
            }
            //@ Unsupported property or method(C): 'Free'
            MenuItemList.Free;
            base.BeforeDestruction();
        }

        public override void StateValuesLoaded()
        {
            // this is called when all modules have been fully initialised
            // grab the setup from the other modules to where we can access it
            ApplySetup();
        }

        // ITWXGlobals
        protected string GetProgramDir()
        {
            string result;
            result = FProgramDir;
            return result;
        }

        protected void SetProgramDir(string Value)
        {
            FProgramDir = Value;
        }

        public TTWXMenuItem AddCustomMenu(string Parent, string Name, string Title, string Reference, string Prompt, char HotKey, bool CloseActivate, TScript ScriptOwner)
        {
            TTWXMenuItem result;
            result = new TTWXMenuItem(this, Name, Title, Prompt, HotKey);
            result.Reference = Reference.ToUpper();
            result.CloseActivate = CloseActivate;
            result.ScriptOwner = ScriptOwner;
            result.IsCustom = true;
            if ((Parent != ""))
            {
                GetMenuByName(Parent).AddItem(result);
            }
            return result;
        }

        public void LinkMenu(object Item)
        {
            // add menu item to menu list
            MenuItemList.Add(Item);
        }

        public void UnlinkMenu(object Item)
        {
            // remove menu item from menu list
            MenuItemList.Remove(Item);
        }

        public void OpenMenu(string MenuName, byte ClientIndex)
        {
            // do NOT call with mtNone
            string LastMenuName;
            if ((FCurrentMenu != null))
            {
                LastMenuName = FCurrentMenu.Name;
            }
            else
            {
                LastMenuName = "";
            }
            OpenMenuItem(GetMenuByName(MenuName), ClientIndex, LastMenuName);
        }

        public void CloseMenu(bool TerminateScript)
        {
            TTWXMenuItem Menu;
            CurrentMenu.Line = "";
            Menu = FCurrentMenu;
            FCurrentMenu = null;
            if (TerminateScript)
            {
                if ((Menu.ScriptOwner != null))
                {
                    // terminate parent script
                    Global.Units.Global.TWXInterpreter.StopByHandle(Menu.ScriptOwner);
                }
                else if ((Menu == ScriptMenu) || (Menu == ScriptMenuKey))
                {
                    Global.Units.Global.TWXInterpreter.StopByHandle(InputScript);
                }
            }
            if ((Global.Units.Global.TWXClient.Connected) && (Global.Units.Global.TWXExtractor.CurrentANSILine != ""))
            {
                Global.Units.Global.TWXServer.Broadcast('\r' + Ansi.Units.Ansi.ANSI_CLEARLINE + Global.Units.Global.TWXExtractor.CurrentANSILine);
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast('\r' + Ansi.Units.Ansi.ANSI_CLEARLINE);
            }
        }

        public void MenuText(string Text, byte ClientIndex)
        {
            int I;
            // break the text down into individual characters and process separately
            for (I = 1; I <= Text.Length; I ++ )
            {
                if ((CurrentMenu != null))
                {
                    CurrentMenu.MenuKey(Text[I], ClientIndex);
                }
                else
                {
                    break;
                }
            }
        }

        public void OpenMenuItem_CallComplete()
        {
            if (!((Item.OnLineComplete != null)) && (Item.MenuItems.Count == 0) && (FCurrentMenu != null) && (Item.ParentMenu != null) && (Item == FCurrentMenu))
            {
                // go back to parent menu
                OpenMenuItem(Item.ParentMenu, ClientIndex, FCurrentMenu.Name);
            }
            else if ((FCurrentMenu != null) && (FCurrentMenu == Item))
            {
                // menu may have been closed in activation procedure
                if ((LastMenuName == "") || !(Item.ClearLine))
                {
                    Global.Units.Global.TWXServer.Broadcast(GetPrompt());
                }
                else
                {
                    Global.Units.Global.TWXServer.Broadcast('\r' + Ansi.Units.Ansi.ANSI_CLEARLINE + GetPrompt());
                }
            // go over existing menu prompt
            }
        }

        // do NOT call with mtNone
        public void OpenMenuItem(TTWXMenuItem Item, byte ClientIndex, string LastMenuName)
        {
            bool GotoFailed;
            bool ShowPrompt;
            FCurrentMenu = Item;
            if ((Item.MenuItemCount > 0) && (Item.ScriptOwner != null))
            {
                Item.DumpOptions();
                // display options when menu is shown (if an in-script menu)
                ShowPrompt = true;
            }
            else
            {
                ShowPrompt = false;
            }
            if ((Item.Reference != ""))
            {
                if ((Item.Reference[1] == ':') && (Item.ScriptOwner != null))
                {
                    GotoFailed = false;
                    try {
                        Item.ScriptOwner.GotoLabel(Item.Reference);
                    }
                    catch(EScriptError E) {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Script run-time error (menu activation): " + Ansi.Units.Ansi.ANSI_7 + E.Message + Core.Units.Core.endl);
                        Item.ScriptOwner.Controller.StopByHandle(Item.ScriptOwner);
                        GotoFailed = true;
                    }
                    catch {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_15 + "Unknown script run-time error (menu activation)" + Ansi.Units.Ansi.ANSI_7 + Core.Units.Core.endl);
                        Item.ScriptOwner.Controller.StopByHandle(Item.ScriptOwner);
                        GotoFailed = true;
                    }
                    if (!GotoFailed)
                    {
                        if ((Item.ScriptOwner.Execute()))
                        {
                            // script was self-terminated, close the menu with it
                            if ((FCurrentMenu != null))
                            {
                                CloseMenu(false);
                            }
                            return;
                        }
                    }
                }
                else
                {
                    Global.Units.Global.TWXInterpreter.Load(Utility.Units.Utility.FetchScript(Item.Reference, false), true);
                }
                if ((Item.CloseActivate))
                {
                    CloseMenu(false);
                }
                else
                {
                    OpenMenuItem_CallComplete();
                }
            }
            else if (((Item.OnActivate != null)))
            {
                // call menu's activation procedure
                Item.OnActivate(ClientIndex);
                OpenMenuItem_CallComplete();
            }
            else if ((LastMenuName != "") && !ShowPrompt && (Item.ClearLine))
            {
                // go over existing menu prompt
                Global.Units.Global.TWXServer.Broadcast('\r' + Ansi.Units.Ansi.ANSI_CLEARLINE + GetPrompt());
            }
            else if (((Global.Units.Global.TWXExtractor.CurrentLine == "") && !ShowPrompt) || !(Item.ClearLine))
            {
                Global.Units.Global.TWXServer.Broadcast(GetPrompt());
            }
            else if (!ShowPrompt)
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + GetPrompt());
            }
            // don't go over text received from server

        }

        public string GetPrompt()
        {
            string result;
            result = CurrentMenu.GetPrompt();
            return result;
        }

        public void BeginScriptInput(TScript Script, TVarParam VarParam, bool SingleKey)
        {
            FInputScript = Script;
            InputScriptVar = VarParam;
            if (SingleKey)
            {
                OpenMenu("TWX_SCRIPTKEY", 0);
            }
            else
            {
                OpenMenu("TWX_SCRIPTTEXT", 0);
            }
        }

        public string ApplySetup_BoolToStr(bool B)
        {
            string result;
            if (B)
            {
                result = "ON";
            }
            else
            {
                result = "OFF";
            }
            return result;
        }

        public void ApplySetup()
        {
            // set items in setup menu to match this program setup
            GetMenuByName("TWX_LISTENPORT").Value = (Global.Units.Global.TWXServer.ListenPort).ToString();
            GetMenuByName("TWX_BUBBLESIZE").Value = (Global.Units.Global.TWXBubble.MaxBubbleSize).ToString();
            GetMenuByName("TWX_RECONNECT").Value = ApplySetup_BoolToStr(Global.Units.Global.TWXClient.Reconnect);
            GetMenuByName("TWX_LOG").Value = ApplySetup_BoolToStr(Global.Units.Global.TWXLog.LogData);
            GetMenuByName("TWX_LOGANSI").Value = ApplySetup_BoolToStr(Global.Units.Global.TWXLog.LogANSI);
            GetMenuByName("TWX_ACCEPTEXTERNAL").Value = ApplySetup_BoolToStr(Global.Units.Global.TWXServer.AcceptExternal);
            GetMenuByName("TWX_CACHE").Value = ApplySetup_BoolToStr(Global.Units.Global.TWXDatabase.UseCache);
            GetMenuByName("TWX_RECORDING").Value = ApplySetup_BoolToStr(Global.Units.Global.TWXDatabase.Recording);
            GetMenuByName("TWX_MENUKEY").Value = Global.Units.Global.TWXExtractor.MenuKey;
            GetMenuByName("TWX_LOCALECHO").Value = ApplySetup_BoolToStr(Global.Units.Global.TWXServer.LocalEcho);
        }

        public TTWXMenuItem GetMenuByName(string MenuName)
        {
            TTWXMenuItem result;
            int I;
            result = null;
            if ((MenuItemList.Count > 0))
            {
                for (I = 0; I < MenuItemList.Count; I ++ )
                {
                    if ((((MenuItemList[I]) as TTWXMenuItem).Name == MenuName))
                    {
                        result = ((MenuItemList[I]) as TTWXMenuItem);
                        break;
                    }
                }
            }
            if ((result == null))
            {
                throw new EMenuException("Cannot find menu \'" + MenuName + '\'');
            }
            return result;
        }

        // menu commands:
        // ***************************************************************
        // TModMenu: Menu event implementation
        private void miBurst(byte ClientIndex)
        {
            // set for when input is complete
            CurrentMenu.OnLineComplete = miBurst2;
        }

        private void miBurst2(byte ClientIndex)
        {
            // throw burst to server
            Global.Units.Global.TWXClient.Send(CurrentMenu.Line.Replace('*', '\r'));
            LastBurst = CurrentMenu.Line;
            CloseMenu(false);
        }

        private void miBurstRepeat(byte ClientIndex)
        {
            Global.Units.Global.TWXClient.Send(LastBurst.Replace('*', '\r'));
        }

        private void miBurstEdit(byte ClientIndex)
        {
            CurrentMenu.Line = LastBurst;
            CurrentMenu.OnLineComplete = miBurst2;
        }

        private void miConnect(byte ClientIndex)
        {
            CloseMenu(false);
            Global.Units.Global.TWXClient.Connect();
        }

        private void miStopScript(byte ClientIndex)
        {
            CloseMenu(false);
            Global.Units.Global.TWXServer.ClientMessage("Stopping all non-system scripts");
            Global.Units.Global.TWXInterpreter.StopAll(false);
        }

        private void miToggleDeaf(byte ClientIndex)
        {
            if ((ClientIndex > Global.Units.Global.TWXServer.ClientCount - 1))
            {
                return;
            }
            if ((Global.Units.Global.TWXServer.ClientTypes[ClientIndex] == TCP.TClientType.ctStandard))
            {
                Global.Units.Global.TWXServer.ClientMessage("Client " + (ClientIndex).ToString() + " is now deaf");
                Global.Units.Global.TWXServer.ClientTypes[ClientIndex] = TCP.TClientType.ctDeaf;
            }
            else
            {
                Global.Units.Global.TWXServer.ClientMessage("Client " + (ClientIndex).ToString() + " is no longer deaf");
                Global.Units.Global.TWXServer.ClientTypes[ClientIndex] = TCP.TClientType.ctStandard;
            }
        }

        private void miShowClients(byte ClientIndex)
        {
            int I;
            string M1;
            string M2;
            Global.Units.Global.TWXServer.Broadcast('\r' + Units.Menu.MENU_LIGHT + "#   Address:        Type:" + Core.Units.Core.endl + Core.Units.Core.endl);
            for (I = 0; I < Global.Units.Global.TWXServer.ClientCount; I ++ )
            {
                M1 = (I).ToString();
                M2 = M1 + Utility.Units.Utility.GetSpace(4 - M1.Length);
                M1 = Global.Units.Global.TWXServer.ClientAddresses[I];
                M2 = M2 + M1 + Utility.Units.Utility.GetSpace(16 - M1.Length);
                if ((Global.Units.Global.TWXServer.ClientTypes[I] == TCP.TClientType.ctStandard))
                {
                    M1 = "STANDARD";
                }
                else if ((Global.Units.Global.TWXServer.ClientTypes[I] == TCP.TClientType.ctStandard))
                {
                    M1 = "VIEW ONLY";
                }
                else if ((Global.Units.Global.TWXServer.ClientTypes[I] == TCP.TClientType.ctStandard))
                {
                    M1 = "DEAF";
                }
                M2 = M2 + M1 + Core.Units.Core.endl;
                Global.Units.Global.TWXServer.Broadcast(M2);
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
        }

        private void miExit(byte ClientIndex)
        {
            // exit program
            //@ Unsupported property or method(C): 'Terminate'
            Application.Terminate;
        }

        // --------------------
        // Script menu
        private void miLoad(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = miLoad2;
        }

        private void miLoad2(byte ClientIndex)
        {
            string ScriptName;
            ScriptName = CurrentMenu.Line;
            CloseMenu(false);
            Global.Units.Global.TWXInterpreter.Load(Utility.Units.Utility.FetchScript(ScriptName, false), false);
        }

        private void miLoadLast(byte ClientIndex)
        {
            if ((Global.Units.Global.TWXInterpreter.LastScript == ""))
            {
                CloseMenu(false);
                Global.Units.Global.TWXServer.ClientMessage("You have loaded no scripts this session.");
            }
            else
            {
                CloseMenu(false);
                Global.Units.Global.TWXInterpreter.Load(Global.Units.Global.TWXInterpreter.LastScript, false);
            }
        }

        private void miDumpVars(byte ClientIndex)
        {
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter a full or partial variable name to search for (or blank to list them all)" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDumpVars2;
        }

        private void miDumpVars2(byte ClientIndex)
        {
            Global.Units.Global.TWXInterpreter.DumpVars(CurrentMenu.Line);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
        }

        private void miDumpTriggers(byte ClientIndex)
        {
            Global.Units.Global.TWXInterpreter.DumpTriggers();
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
        }

        private void miListActive(byte ClientIndex)
        {
            int I;
            // list all active scripts
            if ((Global.Units.Global.TWXInterpreter.Count > 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "ID" + "\09" + "File" + Core.Units.Core.endl + Core.Units.Core.endl);
                for (I = 0; I < Global.Units.Global.TWXInterpreter.Count; I ++ )
                {
                    Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + (I).ToString() + "\09" + Units.Menu.MENU_DARK + Global.Units.Global.TWXInterpreter[I].Cmp.ScriptFile + Core.Units.Core.endl);
                }
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + "No scripts are active");
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
        }

        private void miListDirectory(byte ClientIndex)
        {
            TSearchRec SearchRec;
            bool HighLight;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Listing contents of script directory" + Core.Units.Core.endl + Core.Units.Core.endl);
            //@ Unsupported function or procedure: 'FindFirst'
            if ((FindFirst("scripts\\*.*", 0x0000003f, SearchRec) == 0))
            {
                do
                {
                    HighLight = false;
                    //@ Unsupported property or method(C): 'Name'
                    if ((SearchRec.Name.Length > 4))
                    {
                        //@ Unsupported property or method(C): 'Name'
                        //@ Unsupported property or method(C): 'Name'
                        //@ Unsupported function or procedure: 'Copy'
                        //@ Unsupported property or method(C): 'Name'
                        //@ Unsupported property or method(C): 'Name'
                        //@ Unsupported function or procedure: 'Copy'
                        if ((Copy(SearchRec.Name, SearchRec.Name.Length - 2, 3).ToUpper() == ".TS") || (Copy(SearchRec.Name, SearchRec.Name.Length - 3, 4).ToUpper() == ".CTS"))
                        {
                            HighLight = true;
                        }
                    }
                    if (HighLight)
                    {
                        //@ Unsupported property or method(C): 'Name'
                        Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + SearchRec.Name + Core.Units.Core.endl);
                    }
                    else
                    {
                        //@ Unsupported property or method(C): 'Name'
                        Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_DARK + SearchRec.Name + Core.Units.Core.endl);
                    }
                    //@ Unsupported function or procedure: 'FindNext'
                } while (!((FindNext(SearchRec) != 0)));
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
                //@ Unsupported function or procedure: 'FindClose'
                FindClose(SearchRec);
            }
        }

        private void miKill(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = miKill2;
        }

        private void miKill2(byte ClientIndex)
        {
            int I;
            try {
                I = Convert.ToInt32(CurrentMenu.Line);
            }
            catch {
                I =  -1;
            }
            if ((I < 0) || (I >= Global.Units.Global.TWXInterpreter.Count))
            {
                Global.Units.Global.TWXServer.ClientMessage("Bad script ID");
            }
            else
            {
                Global.Units.Global.TWXInterpreter.Stop(I);
            }
        }

        // ------------------
        // Data menu
        private void miShowSector(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = miShowSector2;
        }

        private void miShowSector2(byte ClientIndex)
        {
            int I;
            TSector S;
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            if ((I < 1) || (I > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That is not a valid sector" + Core.Units.Core.endl + Core.Units.Core.endl);
            }
            else
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.Explored == DataBase.TSectorExploredType.etNo))
                {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That sector has not been recorded" + Core.Units.Core.endl + Core.Units.Core.endl);
                }
                else
                {
                    // Display this sector
                    Units.Menu.DisplaySector(S, I);
                }
            }
        }

        private void miShowFigs(byte ClientIndex)
        {
            TSector S;
            int I;
            // Scan through sectors showing sectors with fighters in them
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Showing all sectors with foreign fighters in them..." + Core.Units.Core.endl + Core.Units.Core.endl);
            for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.Figs.Quantity > 0) && (S.Figs.Owner != "belong to your Corp") && (S.Figs.Owner != "yours") && (S.Explored != DataBase.TSectorExploredType.etNo))
                {
                    Units.Menu.DisplaySector(S, I);
                }
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Completed." + Core.Units.Core.endl + Core.Units.Core.endl);
        }

        private void miShowMines(byte ClientIndex)
        {
            TSector S;
            int I;
            // Scan through sectors showing sectors with mines in them
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Showing all sectors with mines in them..." + Core.Units.Core.endl + Core.Units.Core.endl);
            for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.Mines_Armid.Quantity > 0) && (S.Explored != DataBase.TSectorExploredType.etNo))
                {
                    Units.Menu.DisplaySector(S, I);
                }
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Completed." + Core.Units.Core.endl + Core.Units.Core.endl);
        }

        private void miShowDensity(byte ClientIndex)
        {
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter the lowest density to display" + Core.Units.Core.endl + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miShowDensity2;
        }

        private void miShowDensity2(byte ClientIndex)
        {
            int I;
            //@ Unsupported function or procedure: 'AllocMem'
            I = AllocMem(sizeof(int));
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            CurrentMenu.AddParam(I);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter the highest density to display" + Core.Units.Core.endl + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miShowDensity3;
        }

        private void miShowDensity3(byte ClientIndex)
        {
            int X;
            int I;
            TSector S;
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Showing all sectors within the specified density range" + Core.Units.Core.endl);
            for (X = 1; X <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; X ++ )
            {
                S = Global.Units.Global.TWXDatabase.Sectors[X];
                if ((S.Density <= I) && (S.Density >= ((int)CurrentMenu.GetParam(0))))
                {
                    Units.Menu.DisplaySector(S, X);
                }
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Completed." + Core.Units.Core.endl + Core.Units.Core.endl);
        }

        private void miShowAnomaly(byte ClientIndex)
        {
            int I;
            TSector S;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Showing all sectors with Anomaly" + Core.Units.Core.endl);
            for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.Anomaly) && (S.Explored != DataBase.TSectorExploredType.etNo))
                {
                    Units.Menu.DisplaySector(S, I);
                }
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Completed." + Core.Units.Core.endl + Core.Units.Core.endl);
        }

        private void miShowTraders(byte ClientIndex)
        {
            int I;
            TSector S;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Showing sectors with traders" + Core.Units.Core.endl);
            for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.Traders > 0) && (S.Explored > DataBase.TSectorExploredType.etNo))
                {
                    Units.Menu.DisplaySector(S, I);
                }
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Completed." + Core.Units.Core.endl + Core.Units.Core.endl);
        }

        private void miPlotCourse(byte ClientIndex)
        {
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "From:" + Core.Units.Core.endl + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miPlotCourse2;
        }

        private void miPlotCourse2(byte ClientIndex)
        {
            int I;
            //@ Unsupported function or procedure: 'AllocMem'
            I = AllocMem(sizeof(int));
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            CurrentMenu.AddParam(I);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "To:" + Core.Units.Core.endl + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miPlotCourse3;
        }

        private void miPlotCourse3(byte ClientIndex)
        {
            int WarpFrom;
            int I;
            ArrayList Lane;
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            WarpFrom = ((int)CurrentMenu.GetParam(0));
            if ((I < 1) || (I > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That is not a valid sector" + Core.Units.Core.endl);
            }
            else
            {
                try {
                    Lane = Global.Units.Global.TWXDatabase.PlotWarpCourse(WarpFrom, I);
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
                    if ((Lane.Count == 0))
                    {
                        Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Insufficient mapping data to plot warp course." + Core.Units.Core.endl);
                    }
                    else
                    {
                        Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Warp lane from " + Units.Menu.MENU_MID + (WarpFrom).ToString() + Units.Menu.MENU_LIGHT + " to " + Units.Menu.MENU_MID + (I).ToString() + Units.Menu.MENU_LIGHT + " (" + (Lane.Count - 1).ToString() + " hops):" + Core.Units.Core.endl + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_7);
                        for (I = Lane.Count - 1; I >= 0; I-- )
                        {
                            Global.Units.Global.TWXServer.Broadcast((((ushort)Lane[I])).ToString());
                            if ((I > 0))
                            {
                                Global.Units.Global.TWXServer.Broadcast(" > ");
                            }
                            // This List's memory is persistent, and no longer needs freeing
                            // FreeMem(Lane[I]);
                            Lane.RemoveAt(I);
                        }
                        Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl);
                    }
                    //@ Unsupported property or method(C): 'Free'
                    Lane.Free;
                }
                catch {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Error while mapping warp course" + Core.Units.Core.endl);
                }
            }
        }

        private void miHoloscan(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = miHoloscan2;
        }

        private void miHoloscan2(byte ClientIndex)
        {
            int I;
            int X;
            TSector S;
            TSector L;
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            if ((I < 1) || (I > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That is not a valid sector" + Core.Units.Core.endl);
            }
            else
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.Explored == DataBase.TSectorExploredType.etNo))
                {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That sector has not been recorded" + Core.Units.Core.endl);
                }
                else
                {
                    // Display sectors
                    for (X = 1; X <= 6; X ++ )
                    {
                        if ((S.Warp[X] > 0))
                        {
                            L = Global.Units.Global.TWXDatabase.Sectors[S.Warp[X]];
                            if ((L.Explored != DataBase.TSectorExploredType.etNo))
                            {
                                Units.Menu.DisplaySector(L, S.Warp[X]);
                            }
                        }
                    }
                }
            }
        }

        private void miShowTotal(byte ClientIndex)
        {
            int I;
            int Holo;
            int Density;
            int Calc;
            int Scanned;
            TSector S;
            // Show the number of sectors seen or scanned
            if ((Global.Units.Global.TWXDatabase.DBHeader.Sectors > 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Querying database..." + Core.Units.Core.endl);
                Holo = 0;
                Density = 0;
                Calc = 0;
                Scanned = 0;
                for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
                {
                    S = Global.Units.Global.TWXDatabase.Sectors[I];
                    if ((S.Explored == DataBase.TSectorExploredType.etHolo))
                    {
                        Holo ++;
                        Scanned ++;
                        if ((S.Density >  -1))
                        {
                            Density ++;
                        }
                    }
                    else if ((S.Explored == DataBase.TSectorExploredType.etDensity))
                    {
                        Density ++;
                        Scanned ++;
                    }
                    else if ((S.Explored == DataBase.TSectorExploredType.etCalc))
                    {
                        Calc ++;
                    }
                }
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Scanned Sector Summary" + Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Visual/holo: " + Units.Menu.MENU_MID + (Holo).ToString() + " (" + (Holo * 100 / Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString() + "%)" + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Density: " + Units.Menu.MENU_MID + (Density).ToString() + " (" + (Density * 100 / Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString() + "%)" + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Calculation: " + Units.Menu.MENU_MID + (Calc).ToString() + " (" + (Calc * 100 / Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString() + "%)" + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Total scanned: " + Units.Menu.MENU_MID + (Scanned).ToString() + " (" + (Scanned * 100 / Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString() + "%)" + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Total accounted for: " + Units.Menu.MENU_MID + (Scanned + Calc).ToString() + " (" + ((Scanned + Calc) * 100 / Global.Units.Global.TWXDatabase.DBHeader.Sectors).ToString() + "%)" + Core.Units.Core.endl + Core.Units.Core.endl);
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "No sectors to compute." + Core.Units.Core.endl);
            }
#if !RELEASE
            Units.Menu.DumpHeapStatus();
            Units.Menu.DumpScriptCmdStatus();
#endif

        }

        private void miShowBubbles(byte ClientIndex)
        {
            // Look for bubbles
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Calculating bubbles, please wait..." + Core.Units.Core.endl);
            Global.Units.Global.TWXBubble.DumpBubbles();
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
        }

        private void miShowBubble(byte ClientIndex)
        {
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter bubble gateway sector" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miShowBubble2;
        }

        private void miShowBubble2(byte ClientIndex)
        {
            int I;
            //@ Unsupported function or procedure: 'AllocMem'
            I = AllocMem(sizeof(int));
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            CurrentMenu.AddParam(I);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter a sector within the bubble" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miShowBubble3;
        }

        private void miShowBubble3(byte ClientIndex)
        {
            int BubbleGate;
            int I;
            ArrayList Lane;
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            BubbleGate = ((int)CurrentMenu.GetParam(0));
            if ((I < 1) || (I > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That is not a valid sector" + Core.Units.Core.endl);
            }
            else
            {
                // find interior sector
                try {
                    Lane = Global.Units.Global.TWXDatabase.PlotWarpCourse(BubbleGate, I);
                    if ((Lane.Count == 0))
                    {
                        Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Insufficient warp data to map bubble interior" + Core.Units.Core.endl);
                    }
                    else
                    {
                        Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl);
                        Global.Units.Global.TWXBubble.ShowBubble(BubbleGate, ((ushort)Lane[Lane.Count - 2]));
                    }
                    Utility.Units.Utility.FreeList(Lane, 2);
                }
                catch {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Error while mapping bubble (insufficient warp data?)" + Core.Units.Core.endl);
                }
            }
        }

        private void miShowBackdoors(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = miShowBackdoors2;
        }

        private void miShowBackdoors2(byte ClientIndex)
        {
            int I;
            int Index;
            ArrayList Lane;
            TSector S;
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            if ((I < 1) || (I > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That is not a valid sector" + Core.Units.Core.endl);
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Displaying all backdoors to sector " + CurrentMenu.Line + Core.Units.Core.endl);
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                Lane = Global.Units.Global.TWXDatabase.GetBackDoors(S, I);
                for (I = 0; I < Lane.Count; I ++ )
                {
                    Index = ((ushort)Lane[I]);
                    Units.Menu.DisplaySector(Global.Units.Global.TWXDatabase.Sectors[Index], Index);
                }
                Utility.Units.Utility.FreeList(Lane, 2);
            }
        }

        // ----------------------
        // Port menu
        private void miShowPort(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = miShowPort2;
        }

        private void miShowPort2(byte ClientIndex)
        {
            int I;
            TSector S;
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            if ((I < 1) || (I > Global.Units.Global.TWXDatabase.DBHeader.Sectors))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That is not a valid sector" + Core.Units.Core.endl);
            }
            else
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.SPort.Name == ""))
                {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That port has not been recorded or does not exist" + Core.Units.Core.endl);
                }
                else if ((S.SPort.UpDate == 0))
                {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "That port has not been recorded" + Core.Units.Core.endl);
                }
                else
                {
                    // Display this sector
                    Units.Menu.DisplayPort(S, I);
                }
            }
        }

        private void miShowClassPort(byte ClientIndex)
        {
            int I;
            TSector S;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Showing all sectors with class 0 or 9 ports..." + Core.Units.Core.endl);
            for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.SPort.Name != "") && ((S.SPort.ClassIndex == 0) || (S.SPort.ClassIndex == 9)))
                {
                    Units.Menu.DisplaySector(S, I);
                }
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Completed." + Core.Units.Core.endl);
        }

        private void miListPorts(byte ClientIndex)
        {
            int I;
            TSector S;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Sector Class Fuel Ore     Organics     Equipment    Updated" + Core.Units.Core.endl + "-------------------------------------------------------------" + Core.Units.Core.endl + Core.Units.Core.endl);
            for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.SPort.Name != "") && (S.SPort.ClassIndex > 0) && (S.SPort.ClassIndex < 9))
                {
                    Units.Menu.DisplayPortSummary(S, I);
                }
            }
            if ((Global.Units.Global.TWXDatabase.DBHeader.LastPortCIM == 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "No port CIM check has taken place." + Core.Units.Core.endl + "You can do port/warp CIM checks by pressing ^ inside the game" + Core.Units.Core.endl + Core.Units.Core.endl);
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Last port CIM check took place on " + DataBase.Units.DataBase.Day[Global.Units.Global.TWXDatabase.DBHeader.LastPortCIM.DayOfWeek] + ' ' + (Global.Units.Global.TWXDatabase.DBHeader.LastPortCIM).ToString() + " at " + Global.Units.Global.TWXDatabase.DBHeader.LastPortCIM.ToString() + Core.Units.Core.endl + "Ports in red were not updated in the last CIM check" + Core.Units.Core.endl + Core.Units.Core.endl);
            }
        }

        private void miListUpgradedPorts(byte ClientIndex)
        {
            int I;
            TSector S;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Sector Class Fuel Ore     Organics     Equipment    Updated" + Core.Units.Core.endl + "-------------------------------------------------------------" + Core.Units.Core.endl + Core.Units.Core.endl);
            for (I = 1; I <= Global.Units.Global.TWXDatabase.DBHeader.Sectors; I ++ )
            {
                S = Global.Units.Global.TWXDatabase.Sectors[I];
                if ((S.SPort.Name != "") && (S.SPort.ClassIndex > 0) && (S.SPort.ClassIndex < 9) && ((S.SPort.ProductAmount[DataBase.TProductType.ptFuelOre] * (100 / (S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre] + 1)) >= 10000) || (S.SPort.ProductAmount[DataBase.TProductType.ptOrganics] * (100 / (S.SPort.ProductPercent[DataBase.TProductType.ptOrganics] + 1)) >= 10000) || (S.SPort.ProductAmount[DataBase.TProductType.ptEquipment] * (100 / (S.SPort.ProductPercent[DataBase.TProductType.ptEquipment] + 1)) >= 10000)))
                {
                    Units.Menu.DisplayPortSummary(S, I);
                }
            }
            if ((Global.Units.Global.TWXDatabase.DBHeader.LastPortCIM == 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "No port CIM check has taken place." + Core.Units.Core.endl + "You can do port/warp CIM checks by pressing ^ inside the game" + Core.Units.Core.endl + Core.Units.Core.endl);
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Last port CIM check took place on " + DataBase.Units.DataBase.Day[Global.Units.Global.TWXDatabase.DBHeader.LastPortCIM.DayOfWeek] + ' ' + (Global.Units.Global.TWXDatabase.DBHeader.LastPortCIM).ToString() + " at " + Global.Units.Global.TWXDatabase.DBHeader.LastPortCIM.ToString() + Core.Units.Core.endl + "Ports in red were not updated in the last CIM check" + Core.Units.Core.endl + Core.Units.Core.endl);
            }
        }

        // ----------------------
        // Setup menu
        private void miListenPort(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = miListenPort2;
        }

        private void miListenPort2(byte ClientIndex)
        {
            Global.Units.Global.TWXServer.ListenPort = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            Global.Units.Global.TWXServer.Activate();
            CurrentMenu.Value = (Global.Units.Global.TWXServer.ListenPort).ToString();
        }

        private void miBubbleSize(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = miBubbleSize2;
        }

        private void miBubbleSize2(byte ClientIndex)
        {
            Global.Units.Global.TWXBubble.MaxBubbleSize = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            CurrentMenu.Value = (Global.Units.Global.TWXBubble.MaxBubbleSize).ToString();
        }

        private void miReconnect(byte ClientIndex)
        {
            Global.Units.Global.TWXClient.Reconnect = !Global.Units.Global.TWXClient.Reconnect;
            if ((Global.Units.Global.TWXClient.Reconnect))
            {
                CurrentMenu.Value = "ON";
            }
            else
            {
                CurrentMenu.Value = "OFF";
            }
            Global.Units.Global.TWXServer.ClientMessage("Auto reconnect is now " + Units.Menu.MENU_MID + CurrentMenu.Value);
        }

        private void miLog(byte ClientIndex)
        {
            Global.Units.Global.TWXLog.LogData = !Global.Units.Global.TWXLog.LogData;
            if ((Global.Units.Global.TWXLog.LogData))
            {
                CurrentMenu.Value = "ON";
            }
            else
            {
                CurrentMenu.Value = "OFF";
            }
            Global.Units.Global.TWXServer.ClientMessage("Logging of data is now " + Units.Menu.MENU_MID + CurrentMenu.Value);
        }

        private void miLogAnsi(byte ClientIndex)
        {
            Global.Units.Global.TWXLog.LogANSI = !Global.Units.Global.TWXLog.LogANSI;
            if ((Global.Units.Global.TWXLog.LogANSI))
            {
                CurrentMenu.Value = "ON";
            }
            else
            {
                CurrentMenu.Value = "OFF";
            }
            Global.Units.Global.TWXServer.ClientMessage("Logging of ANSI data is now " + Units.Menu.MENU_MID + CurrentMenu.Value);
        }

        private void miAcceptExternal(byte ClientIndex)
        {
            Global.Units.Global.TWXServer.AcceptExternal = !Global.Units.Global.TWXServer.AcceptExternal;
            if ((Global.Units.Global.TWXServer.AcceptExternal))
            {
                CurrentMenu.Value = "ON";
            }
            else
            {
                CurrentMenu.Value = "OFF";
            }
            Global.Units.Global.TWXServer.ClientMessage("Accept external connections is now " + Units.Menu.MENU_MID + CurrentMenu.Value);
        }

        private void miCache(byte ClientIndex)
        {
            Global.Units.Global.TWXDatabase.UseCache = !Global.Units.Global.TWXDatabase.UseCache;
            if ((Global.Units.Global.TWXDatabase.UseCache))
            {
                CurrentMenu.Value = "ON";
            }
            else
            {
                CurrentMenu.Value = "OFF";
            }
            Global.Units.Global.TWXServer.ClientMessage("Database cache is now " + Units.Menu.MENU_MID + CurrentMenu.Value);
        }

        private void miRecording(byte ClientIndex)
        {
            Global.Units.Global.TWXDatabase.Recording = !Global.Units.Global.TWXDatabase.Recording;
            if ((Global.Units.Global.TWXDatabase.Recording))
            {
                CurrentMenu.Value = "ON";
            }
            else
            {
                CurrentMenu.Value = "OFF";
            }
            Global.Units.Global.TWXServer.ClientMessage("Data recording is now " + Units.Menu.MENU_MID + CurrentMenu.Value);
        }

        private void miMenuKey(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = miMenuKey2;
        }

        private void miMenuKey2(byte ClientIndex)
        {
            if ((CurrentMenu.Line != ""))
            {
                Global.Units.Global.TWXExtractor.MenuKey = CurrentMenu.Line[1];
                CurrentMenu.Value = Global.Units.Global.TWXExtractor.MenuKey;
            }
        }

        private void miLocalEcho(byte ClientIndex)
        {
            Global.Units.Global.TWXServer.LocalEcho = !Global.Units.Global.TWXServer.LocalEcho;
            if ((Global.Units.Global.TWXServer.LocalEcho))
            {
                CurrentMenu.Value = "ON";
            }
            else
            {
                CurrentMenu.Value = "OFF";
            }
            Global.Units.Global.TWXServer.ClientMessage("Local echo is now " + Units.Menu.MENU_MID + CurrentMenu.Value);
        }

        // ----------------------
        // Database menu
        private void miDatabaseCreate(byte ClientIndex)
        {
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter new database name" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseCreate2;
        }

        private void miDatabaseCreate2(byte ClientIndex)
        {
            string Name;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter new database size (in sectors)" + Core.Units.Core.endl);
            //@ Unsupported function or procedure: 'AllocMem'
            Name = AllocMem(sizeof(string));
            //@ Unsupported function or procedure: 'StrNew'
            Name = StrNew((CurrentMenu.Line as string));
            CurrentMenu.AddParam(Name);
            CurrentMenu.OnLineComplete = miDatabaseCreate3;
        }

        private void miDatabaseCreate3(byte ClientIndex)
        {
            TDataHeader Head;
            string Name;
            string NameChar;
            NameChar = CurrentMenu.GetParam(0);
            //@ Unsupported function or procedure: 'SetString'
            SetString(Name, NameChar, NameChar.Length);
            NameChar = null ;
            Head = DataBase.Units.DataBase.GetBlankHeader();
            Head.Sectors = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            if ((Head.Sectors == 0))
            {
                Head.Sectors = 5000;
            }
            if ((Name.IndexOf('.') == 0))
            {
                Name = Name + ".xdb";
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
            Global.Units.Global.TWXDatabase.CreateDatabase("data\\" + Name, Head);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(Head);
        }

        private void miDatabaseEdit(byte ClientIndex)
        {
            miDatabaseList(ClientIndex);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter database name" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseEdit2;
        }

        private void miDatabaseEdit2(byte ClientIndex)
        {
            string C;
            //@ Unsupported function or procedure: 'AllocMem'
            C = AllocMem(sizeof(string));
            //@ Unsupported function or procedure: 'StrNew'
            C = StrNew((CurrentMenu.Line as string));
            CurrentMenu.AddParam(C);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter new server address (blank for no change)" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseEdit3;
        }

        private void miDatabaseEdit3(byte ClientIndex)
        {
            string C;
            //@ Unsupported function or procedure: 'AllocMem'
            C = AllocMem(sizeof(string));
            //@ Unsupported function or procedure: 'StrNew'
            C = StrNew((CurrentMenu.Line as string));
            CurrentMenu.AddParam(C);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter new server port (blank for no change)" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseEdit4;
        }

        private void miDatabaseEdit4(byte ClientIndex)
        {
            int I;
            //@ Unsupported function or procedure: 'AllocMem'
            I = AllocMem(sizeof(int));
            I = Utility.Units.Utility.StrToIntSafe(CurrentMenu.Line);
            CurrentMenu.AddParam(I);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Use login script? (" + Units.Menu.MENU_MID + 'Y' + Units.Menu.MENU_LIGHT + '/' + Units.Menu.MENU_MID + 'N' + Units.Menu.MENU_LIGHT + ')' + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseEdit5;
        }

        private void miDatabaseEdit5(byte ClientIndex)
        {
            bool FileOpen;
            System.IO.File F;
            string Name;
            string Address;
            TDataHeader Head;
            if ((CurrentMenu.Line.ToUpper() == 'Y'))
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter login script name (blank for no change)" + Core.Units.Core.endl);
                CurrentMenu.OnLineComplete = miDatabaseEdit6;
            }
            else
            {
                // write changes to database
                FileOpen = false;
                try {
                    //@ Unsupported function or procedure: 'SetString'
                    SetString(Name, (CurrentMenu.GetParam(0) as string), (CurrentMenu.GetParam(0) as string).Length);
                    //@ Unsupported function or procedure: 'SetString'
                    SetString(Address, (CurrentMenu.GetParam(1) as string), (CurrentMenu.GetParam(1) as string).Length);
                    if ((Name.IndexOf('.') == 0))
                    {
                        Name = Name + ".xdb";
                    }
                    Name = "data\\" + Name;
                    F = new FileInfo(Name);
                    _R_1 = F.OpenText();
                    //@ Unsupported function or procedure: 'BlockRead'
                    BlockRead(F, Head, sizeof(TDataHeader));
                    Head.UseLogin = false;
                    if ((Address != ""))
                    {
                        Head.Address = Address;
                    }
                    if ((((int)CurrentMenu.GetParam(2)) != 0))
                    {
                        Head.Port = ((int)CurrentMenu.GetParam(2));
                    }
                    _R_1.BaseStream.Seek(0, SeekOrigin.Begin);
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(F, Head, sizeof(TDataHeader));
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Changes saved to database: " + Name + Core.Units.Core.endl + Core.Units.Core.endl);
                }
                catch {
                    Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Unable to save changes to database: " + Name + Core.Units.Core.endl + Core.Units.Core.endl);
                }
                if (FileOpen)
                {
                    _W_0.Close();
                }
            }
        }

        private void miDatabaseEdit6(byte ClientIndex)
        {
            string C;
            //@ Unsupported function or procedure: 'AllocMem'
            C = AllocMem(sizeof(string));
            //@ Unsupported function or procedure: 'StrNew'
            C = StrNew((CurrentMenu.Line as string));
            CurrentMenu.AddParam(C);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter login name (blank for no change)" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseEdit7;
        }

        private void miDatabaseEdit7(byte ClientIndex)
        {
            string C;
            //@ Unsupported function or procedure: 'AllocMem'
            C = AllocMem(sizeof(string));
            //@ Unsupported function or procedure: 'StrNew'
            C = StrNew((CurrentMenu.Line as string));
            CurrentMenu.AddParam(C);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter login password (blank for no change)" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseEdit8;
        }

        private void miDatabaseEdit8(byte ClientIndex)
        {
            string C;
            //@ Unsupported function or procedure: 'AllocMem'
            C = AllocMem(sizeof(string));
            //@ Unsupported function or procedure: 'StrNew'
            C = StrNew((CurrentMenu.Line as string));
            CurrentMenu.AddParam(C);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter game letter (blank for no change)" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseEdit9;
        }

        private void miDatabaseEdit9(byte ClientIndex)
        {
            bool FileOpen;
            System.IO.File F;
            string Name;
            string Address;
            string LoginScript;
            string LoginName;
            string Password;
            TDataHeader Head;
            // write changes to database
            FileOpen = false;
            try {
                //@ Unsupported function or procedure: 'SetString'
                SetString(Name, (CurrentMenu.GetParam(0) as string), (CurrentMenu.GetParam(0) as string).Length);
                //@ Unsupported function or procedure: 'SetString'
                SetString(Address, (CurrentMenu.GetParam(1) as string), (CurrentMenu.GetParam(1) as string).Length);
                //@ Unsupported function or procedure: 'SetString'
                SetString(LoginScript, (CurrentMenu.GetParam(3) as string), (CurrentMenu.GetParam(3) as string).Length);
                //@ Unsupported function or procedure: 'SetString'
                SetString(LoginName, (CurrentMenu.GetParam(4) as string), (CurrentMenu.GetParam(4) as string).Length);
                //@ Unsupported function or procedure: 'SetString'
                SetString(Password, (CurrentMenu.GetParam(5) as string), (CurrentMenu.GetParam(5) as string).Length);
                if ((Name.IndexOf('.') == 0))
                {
                    Name = Name + ".xdb";
                }
                Name = "data\\" + Name;
                F = new FileInfo(Name);
                _R_1 = F.OpenText();
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, Head, sizeof(TDataHeader));
                Head.UseLogin = true;
                if ((Address != ""))
                {
                    Head.Address = Address;
                }
                if ((((int)CurrentMenu.GetParam(2)) != 0))
                {
                    Head.Port = ((int)CurrentMenu.GetParam(2));
                }
                if ((LoginScript != ""))
                {
                    Head.LoginScript = LoginScript;
                }
                if ((LoginName != ""))
                {
                    Head.LoginName = LoginName;
                }
                if ((Password != ""))
                {
                    Head.Password = Password;
                }
                if ((CurrentMenu.Line != ""))
                {
                    Head.Game = CurrentMenu.Line[1];
                }
                _R_1.BaseStream.Seek(0, SeekOrigin.Begin);
                //@ Unsupported function or procedure: 'BlockWrite'
                BlockWrite(F, Head, sizeof(TDataHeader));
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Changes saved to database: " + Name + Core.Units.Core.endl + Core.Units.Core.endl);
            }
            catch {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Unable to save changes to database: " + Name + Core.Units.Core.endl + Core.Units.Core.endl);
            }
            if (FileOpen)
            {
                _W_0.Close();
            }
        }

        private void miDatabaseDelete(byte ClientIndex)
        {
            miDatabaseList(ClientIndex);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter database name" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseDelete2;
        }

        private void miDatabaseDelete2(byte ClientIndex)
        {
            string Name;
            Name = CurrentMenu.Line;
            if ((Name.IndexOf('.') == 0))
            {
                Name = Name + ".xdb";
            }
            Name = "data\\" + Name;
            if ((Name.ToUpper() == Global.Units.Global.TWXDatabase.DatabaseName.ToUpper()))
            {
                Global.Units.Global.TWXDatabase.CloseDataBase();
            }
            Environment.CurrentDirectory = FProgramDir;
            if ((File.Exists(Name)))
            {
                Global.Units.Global.TWXServer.ClientMessage(Core.Units.Core.endl + Core.Units.Core.endl + "Deleting database: " + Ansi.Units.Ansi.ANSI_7 + Name + Core.Units.Core.endl);
                File.Delete(Name);
            }
            Name = Utility.Units.Utility.StripFileExtension(Name) + ".cfg";
            if ((File.Exists(Name)))
            {
                File.Delete(Name);
            }
        }

        private void miDatabaseSelect(byte ClientIndex)
        {
            miDatabaseList(ClientIndex);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter database name" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseSelect2;
        }

        private void miDatabaseSelect2(byte ClientIndex)
        {
            string Name;
            // attempt to open database by name
            Name = CurrentMenu.Line;
            if ((Name.IndexOf('.') == 0))
            {
                Name = Name + ".xdb";
            }
            Global.Units.Global.TWXDatabase.CloseDataBase();
            Global.Units.Global.TWXDatabase.OpenDataBase("data\\" + Name);
            CloseMenu(false);
        }

        private void miDatabaseList(byte ClientIndex)
        {
            TSearchRec S;
            bool FileOpen;
            bool Errored;
            TDataHeader Head;
            System.IO.File F;
            string Sectors;
            string Col;
            string Name;
            // display all items in 'data\' directory
            Environment.CurrentDirectory = FProgramDir;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Name                Sectors   Server" + Core.Units.Core.endl + Core.Units.Core.endl);
            //@ Unsupported function or procedure: 'FindFirst'
            if ((FindFirst("data\\*.xdb", 0x0000003f, S) == 0))
            {
                do
                {
                    Errored = false;
                    FileOpen = false;
                    try {
                        //@ Unsupported property or method(C): 'Name'
                        F = new FileInfo("data\\" + S.Name);
                        _R_1 = F.OpenText();
                        FileOpen = true;
                        //@ Unsupported function or procedure: 'BlockRead'
                        BlockRead(F, Head, sizeof(TDataHeader));
                    }
                    catch {
                        Errored = true;
                    }
                    if (FileOpen)
                    {
                        _W_0.Close();
                    }
                    if (!Errored && (Head.ProgramName == "TWX DATABASE") && (Head.Version == DataBase.Units.DataBase.DATABASE_VERSION))
                    {
                        //@ Unsupported property or method(C): 'Name'
                        Name = Utility.Units.Utility.StripFileExtension(S.Name);
                        Sectors = (Head.Sectors).ToString();
                        if (("data\\" + Name + ".xdb".ToUpper() == Global.Units.Global.TWXDatabase.DatabaseName.ToUpper()) && (Global.Units.Global.TWXDatabase.DataBaseOpen))
                        {
                            Col = Units.Menu.MENU_MID;
                        }
                        else
                        {
                            Col = Units.Menu.MENU_DARK;
                        }
                        Global.Units.Global.TWXServer.Broadcast(Col + Name + Utility.Units.Utility.GetSpace(20 - Name.Length) + Units.Menu.MENU_DARK + Sectors + Utility.Units.Utility.GetSpace(10 - Sectors.Length) + Head.Address + Core.Units.Core.endl);
                    }
                    //@ Unsupported function or procedure: 'FindNext'
                } while (!((FindNext(S) != 0)));
                //@ Unsupported function or procedure: 'FindClose'
                FindClose(S);
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
        }

        private void miDatabaseView(byte ClientIndex)
        {
            miDatabaseList(ClientIndex);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Enter database name" + Core.Units.Core.endl);
            CurrentMenu.OnLineComplete = miDatabaseView2;
        }

        private void miDatabaseView2(byte ClientIndex)
        {
            System.IO.File F;
            string UseLogin;
            string Name;
            bool Errored;
            bool FileOpen;
            TDataHeader Head;
            Name = CurrentMenu.Line;
            if ((Name.IndexOf('.') == 0))
            {
                Name = Name + ".xdb";
            }
            Name = "data\\" + Name;
            // probe database header
            FileOpen = false;
            Errored = false;
            try {
                F = new FileInfo(Name);
                _R_1 = F.OpenText();
                FileOpen = true;
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(F, Head, sizeof(Head));
            }
            catch {
                Errored = true;
            }
            if (FileOpen)
            {
                _W_0.Close();
            }
            if (Errored)
            {
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + "Unable to open this database." + Core.Units.Core.endl);
                return;
            }
            // display database details
            if ((Head.UseLogin))
            {
                UseLogin = "YES";
            }
            else
            {
                UseLogin = "NO";
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Units.Menu.MENU_LIGHT + "Details for TWX Proxy database \'" + Units.Menu.MENU_MID + Name + Units.Menu.MENU_LIGHT + "\':" + Core.Units.Core.endl + Core.Units.Core.endl);
            Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + "Size: " + Units.Menu.MENU_DARK + (Head.Sectors).ToString() + Core.Units.Core.endl);
            Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + "Server: " + Units.Menu.MENU_DARK + Head.Address + Core.Units.Core.endl);
            Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + "Port: " + Units.Menu.MENU_DARK + (Head.Port).ToString() + Core.Units.Core.endl);
            Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + "Use login script: " + Units.Menu.MENU_DARK + UseLogin + Core.Units.Core.endl);
            if ((Head.UseLogin))
            {
                Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + "Login script: " + Units.Menu.MENU_DARK + Head.LoginScript + Core.Units.Core.endl);
                Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + "Login name: " + Units.Menu.MENU_DARK + Head.LoginName + Core.Units.Core.endl);
                Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + "Login password: " + Units.Menu.MENU_DARK + Head.Password + Core.Units.Core.endl);
                Global.Units.Global.TWXServer.Broadcast(Units.Menu.MENU_MID + "Login game: " + Units.Menu.MENU_DARK + Head.Game + Core.Units.Core.endl);
            }
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
        }

        // ----------------------
        // Script inputs
        private void miScriptInputActivate(byte ClientIndex)
        {
            CurrentMenu.OnLineComplete = ScriptLineComplete;
        }

        private void ScriptLineComplete(byte ClientIndex)
        {
            string InputLine;
            InputLine = CurrentMenu.Line;
            CloseMenu(false);
            InputScript.InputCompleted(InputLine, InputScriptVar);
        }

    } // end TModMenu

    public delegate void TMenuEvent(byte ClientIndex);
}

namespace Menu.Units
{
    public class Menu
    {
        // Windows,
        public const string MENU_DARK = Ansi.Units.Ansi.ANSI_2;
        public const string MENU_MID = Ansi.Units.Ansi.ANSI_10;
        public const string MENU_LIGHT = Ansi.Units.Ansi.ANSI_15;
        public static void DumpHeapStatus()
        {
            THeapStatus HeapStatus;
            //@ Undeclared identifier(3): 'GetHeapStatus'
            HeapStatus = GetHeapStatus;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Memory heap status: " + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_7);
            //@ Unsupported property or method(C): 'TotalAddrSpace'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Total address space: " + (HeapStatus.TotalAddrSpace).ToString());
            //@ Unsupported property or method(C): 'TotalUncommitted'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Total uncommitted: " + (HeapStatus.TotalUncommitted).ToString());
            //@ Unsupported property or method(C): 'TotalCommitted'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Total committed: " + (HeapStatus.TotalCommitted).ToString());
            //@ Unsupported property or method(C): 'TotalAllocated'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Total allocated: " + (HeapStatus.TotalAllocated).ToString());
            //@ Unsupported property or method(C): 'TotalFree'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Total free: " + (HeapStatus.TotalFree).ToString());
            //@ Unsupported property or method(C): 'FreeSmall'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Free small: " + (HeapStatus.FreeSmall).ToString());
            //@ Unsupported property or method(C): 'FreeBig'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Free big: " + (HeapStatus.FreeBig).ToString());
            //@ Unsupported property or method(C): 'Unused'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Unused: " + (HeapStatus.Unused).ToString());
            //@ Unsupported property or method(C): 'Overhead'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Overhead: " + (HeapStatus.Overhead).ToString());
            //@ Unsupported property or method(C): 'HeapErrorCode'
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "Heap error code: " + (HeapStatus.HeapErrorCode).ToString() + Core.Units.Core.endl + Core.Units.Core.endl);
        }

        public static void DumpScriptCmdStatus()
        {
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Script cmd status: " + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_7);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "sys_check: " + (Global.Units.Global.TWXInterpreter.ScriptRef.FindCmd("SYS_CHECK")).ToString());
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "sys_fail: " + (Global.Units.Global.TWXInterpreter.ScriptRef.FindCmd("SYS_FAIL")).ToString());
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "sys_kill: " + (Global.Units.Global.TWXInterpreter.ScriptRef.FindCmd("SYS_KILL")).ToString());
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + "sys_nop: " + (Global.Units.Global.TWXInterpreter.ScriptRef.FindCmd("SYS_NOP")).ToString() + Core.Units.Core.endl + Core.Units.Core.endl);
        }

        public static string ColourPlanet(string S)
        {
            string result;
            string X;
            // Make a nice pretty ANSI planet
            if ((Utility.Units.Utility.GetParameter(S, 1) == "<<<<"))
            {
                // Shielded planet...
                X = Ansi.Units.Ansi.ANSI_12 + "<<<< " + Ansi.Units.Ansi.ANSI_2 + '(' + Ansi.Units.Ansi.ANSI_14 + S.Substring(7 - 1 ,1) + Ansi.Units.Ansi.ANSI_2 + ") " + Ansi.Units.Ansi.ANSI_1 + S.Substring(10 - 1 ,S.Length - 25) + Ansi.Units.Ansi.ANSI_12 + " >>>> " + Ansi.Units.Ansi.ANSI_2 + "(Shielded)";
            }
            else
            {
                // Non shielded planet...
                X = Ansi.Units.Ansi.ANSI_2 + '(' + Ansi.Units.Ansi.ANSI_14 + S.Substring(2 - 1 ,1) + Ansi.Units.Ansi.ANSI_2 + ") " + S.Substring(5 - 1 ,S.Length - 4);
            }
            result = X;
            return result;
        }

        public static void DisplayPort(TSector S, int Index)
        {
            Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_14 + "Commerce report for " + Ansi.Units.Ansi.ANSI_11 + S.SPort.Name + Ansi.Units.Ansi.ANSI_15 + " (sector " + (Index).ToString() + ") " + Ansi.Units.Ansi.ANSI_14 + ": " + S.SPort.UpDate.ToString() + ' ' + (S.SPort.UpDate).ToString() + Core.Units.Core.endl + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_2 + " Items     Status  Trading % of max" + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_5 + " -----     ------  ------- --------" + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_11 + "Fuel Ore   " + Ansi.Units.Ansi.ANSI_2);
            if ((S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]))
            {
                Global.Units.Global.TWXServer.Broadcast("Buying   ");
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast("Selling  ");
            }
            Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + Utility.Units.Utility.GetSpace(5 - (S.SPort.ProductAmount[DataBase.TProductType.ptFuelOre]).ToString().Length) + (S.SPort.ProductAmount[DataBase.TProductType.ptFuelOre]).ToString() + "    " + Ansi.Units.Ansi.ANSI_2 + Utility.Units.Utility.GetSpace(3 - (S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre]).ToString().Length) + (S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre]).ToString() + Ansi.Units.Ansi.ANSI_12 + '%' + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_11 + "Organics   " + Ansi.Units.Ansi.ANSI_2);
            if ((S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]))
            {
                Global.Units.Global.TWXServer.Broadcast("Buying   ");
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast("Selling  ");
            }
            Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + Utility.Units.Utility.GetSpace(5 - (S.SPort.ProductAmount[DataBase.TProductType.ptOrganics]).ToString().Length) + (S.SPort.ProductAmount[DataBase.TProductType.ptOrganics]).ToString() + "    " + Ansi.Units.Ansi.ANSI_2 + Utility.Units.Utility.GetSpace(3 - (S.SPort.ProductPercent[DataBase.TProductType.ptOrganics]).ToString().Length) + (S.SPort.ProductPercent[DataBase.TProductType.ptOrganics]).ToString() + Ansi.Units.Ansi.ANSI_12 + '%' + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_11 + "Equipment  " + Ansi.Units.Ansi.ANSI_2);
            if ((S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
            {
                Global.Units.Global.TWXServer.Broadcast("Buying   ");
            }
            else
            {
                Global.Units.Global.TWXServer.Broadcast("Selling  ");
            }
            Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + Utility.Units.Utility.GetSpace(5 - (S.SPort.ProductAmount[DataBase.TProductType.ptEquipment]).ToString().Length) + (S.SPort.ProductAmount[DataBase.TProductType.ptEquipment]).ToString() + "    " + Ansi.Units.Ansi.ANSI_2 + Utility.Units.Utility.GetSpace(3 - (S.SPort.ProductPercent[DataBase.TProductType.ptEquipment]).ToString().Length) + (S.SPort.ProductPercent[DataBase.TProductType.ptEquipment]).ToString() + Ansi.Units.Ansi.ANSI_12 + '%' + Core.Units.Core.endl + Core.Units.Core.endl + Core.Units.Core.endl);
        }

        public static void DisplayPortSummary(TSector S, int Index)
        {
            string SectColour;
            string SIndex;
            string PClass;
            string POre;
            string POrg;
            string PEquip;
            string POreClr;
            string POrgClr;
            string PEquipClr;
            string Update;
            int POreLen;
            int POrgLen;
            int PEquipLen;
            if ((S.SPort.UpDate < Global.Units.Global.TWXDatabase.DBHeader.LastPortCIM))
            {
                // not updated within 24 hours
                SectColour = Ansi.Units.Ansi.ANSI_12;
            }
            else
            {
                SectColour = Ansi.Units.Ansi.ANSI_11;
            }
            SIndex = (Index).ToString();
            if ((S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]))
            {
                PClass = PClass + Ansi.Units.Ansi.ANSI_2 + 'B';
            }
            else
            {
                PClass = PClass + Ansi.Units.Ansi.ANSI_11 + 'S';
            }
            if ((S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]))
            {
                PClass = PClass + Ansi.Units.Ansi.ANSI_2 + 'B';
            }
            else
            {
                PClass = PClass + Ansi.Units.Ansi.ANSI_11 + 'S';
            }
            if ((S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
            {
                PClass = PClass + Ansi.Units.Ansi.ANSI_2 + 'B';
            }
            else
            {
                PClass = PClass + Ansi.Units.Ansi.ANSI_11 + 'S';
            }
            POre = (S.SPort.ProductAmount[DataBase.TProductType.ptFuelOre]).ToString();
            POrg = (S.SPort.ProductAmount[DataBase.TProductType.ptOrganics]).ToString();
            PEquip = (S.SPort.ProductAmount[DataBase.TProductType.ptEquipment]).ToString();
            POreLen = (S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre]).ToString().Length + 10;
            POrgLen = (S.SPort.ProductPercent[DataBase.TProductType.ptOrganics]).ToString().Length + 10;
            PEquipLen = (S.SPort.ProductPercent[DataBase.TProductType.ptEquipment]).ToString().Length + 10;
            if ((S.SPort.ProductAmount[DataBase.TProductType.ptFuelOre] * (100 / (S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre] + 1)) >= 10000))
            {
                POreClr = Ansi.Units.Ansi.ANSI_10;
            }
            else
            {
                POreClr = Ansi.Units.Ansi.ANSI_2;
            }
            if ((S.SPort.ProductAmount[DataBase.TProductType.ptOrganics] * (100 / (S.SPort.ProductPercent[DataBase.TProductType.ptOrganics] + 1)) >= 10000))
            {
                POrgClr = Ansi.Units.Ansi.ANSI_10;
            }
            else
            {
                POrgClr = Ansi.Units.Ansi.ANSI_2;
            }
            if ((S.SPort.ProductAmount[DataBase.TProductType.ptEquipment] * (100 / (S.SPort.ProductPercent[DataBase.TProductType.ptEquipment] + 1)) >= 10000))
            {
                PEquipClr = Ansi.Units.Ansi.ANSI_10;
            }
            else
            {
                PEquipClr = Ansi.Units.Ansi.ANSI_2;
            }
            if ((S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre] < 100))
            {
                POre = POre + Utility.Units.Utility.GetSpace(6 - POre.Length) + Ansi.Units.Ansi.ANSI_2 + '(' + Ansi.Units.Ansi.ANSI_6 + (S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre]).ToString() + '%' + Ansi.Units.Ansi.ANSI_2 + ')';
            }
            else
            {
                POre = POre + Utility.Units.Utility.GetSpace(6 - POre.Length) + Ansi.Units.Ansi.ANSI_2 + '(' + Ansi.Units.Ansi.ANSI_14 + (S.SPort.ProductPercent[DataBase.TProductType.ptFuelOre]).ToString() + '%' + Ansi.Units.Ansi.ANSI_2 + ')';
            }
            if ((S.SPort.ProductPercent[DataBase.TProductType.ptOrganics] < 100))
            {
                POrg = POrg + Utility.Units.Utility.GetSpace(6 - POrg.Length) + Ansi.Units.Ansi.ANSI_2 + '(' + Ansi.Units.Ansi.ANSI_6 + (S.SPort.ProductPercent[DataBase.TProductType.ptOrganics]).ToString() + '%' + Ansi.Units.Ansi.ANSI_2 + ')';
            }
            else
            {
                POrg = POrg + Utility.Units.Utility.GetSpace(6 - POrg.Length) + Ansi.Units.Ansi.ANSI_2 + '(' + Ansi.Units.Ansi.ANSI_14 + (S.SPort.ProductPercent[DataBase.TProductType.ptOrganics]).ToString() + '%' + Ansi.Units.Ansi.ANSI_2 + ')';
            }
            if ((S.SPort.ProductPercent[DataBase.TProductType.ptEquipment] < 100))
            {
                PEquip = PEquip + Utility.Units.Utility.GetSpace(6 - PEquip.Length) + Ansi.Units.Ansi.ANSI_2 + '(' + Ansi.Units.Ansi.ANSI_6 + (S.SPort.ProductPercent[DataBase.TProductType.ptEquipment]).ToString() + '%' + Ansi.Units.Ansi.ANSI_3 + ')';
            }
            else
            {
                PEquip = PEquip + Utility.Units.Utility.GetSpace(6 - PEquip.Length) + Ansi.Units.Ansi.ANSI_2 + '(' + Ansi.Units.Ansi.ANSI_14 + (S.SPort.ProductPercent[DataBase.TProductType.ptEquipment]).ToString() + '%' + Ansi.Units.Ansi.ANSI_3 + ')';
            }
            if ((S.SPort.UpDate == 0))
            {
                Update = Ansi.Units.Ansi.ANSI_4 + "Not Updated";
            }
            else
            {
                Update = (S.SPort.UpDate).ToString() + ' ' + S.SPort.UpDate.ToString();
            }
            Global.Units.Global.TWXServer.Broadcast(SectColour + SIndex + Utility.Units.Utility.GetSpace(7 - SIndex.Length) + PClass + Utility.Units.Utility.GetSpace(3) + Ansi.Units.Ansi.ANSI_2 + POreClr + POre + Utility.Units.Utility.GetSpace(14 - POreLen) + POrgClr + POrg + Utility.Units.Utility.GetSpace(14 - POrgLen) + PEquipClr + PEquip + Utility.Units.Utility.GetSpace(14 - PEquipLen) + Update + Core.Units.Core.endl);
        }

        public static void DisplaySector(TSector S, int Index)
        {
            int I;
            bool PromptDisplayed;
            ArrayList SectItems;
            ArrayList Backdoors;
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_3 + "Last seen on " + Ansi.Units.Ansi.ANSI_11 + (S.UpDate).ToString() + Ansi.Units.Ansi.ANSI_3 + " at " + Ansi.Units.Ansi.ANSI_11 + S.UpDate.ToString() + Core.Units.Core.endl + Core.Units.Core.endl);
            if ((S.Constellation == "uncharted space."))
            {
                S.Constellation = Ansi.Units.Ansi.ANSI_1 + "uncharted space.";
            }
            else
            {
                S.Constellation = Ansi.Units.Ansi.ANSI_10 + S.Constellation;
            }
            Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_10 + "Sector  " + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_11 + (Index).ToString() + Ansi.Units.Ansi.ANSI_2 + " in " + S.Constellation + Core.Units.Core.endl);
            if ((S.Density >  -1))
            {
                if ((S.Anomaly))
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Density " + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_11 + Utility.Units.Utility.Segment(S.Density) + Ansi.Units.Ansi.ANSI_9 + " (Anomaly)" + Core.Units.Core.endl);
                }
                else
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Density " + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_11 + Utility.Units.Utility.Segment(S.Density) + Core.Units.Core.endl);
                }
            }
            if ((S.Beacon != ""))
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Beacon  " + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_4 + S.Beacon + Core.Units.Core.endl);
            }
            if ((S.SPort.Name != "") && (S.SPort.Dead == false))
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Ports   " + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_11 + S.SPort.Name + Ansi.Units.Ansi.ANSI_14 + ", " + Ansi.Units.Ansi.ANSI_5 + "Class " + Ansi.Units.Ansi.ANSI_11 + (S.SPort.ClassIndex).ToString() + Ansi.Units.Ansi.ANSI_5 + " (");
                if ((S.SPort.ClassIndex == 0) || (S.SPort.ClassIndex == 9))
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + "Special");
                }
                else
                {
                    if ((S.SPort.BuyProduct[DataBase.TProductType.ptFuelOre]))
                    {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_2 + 'B');
                    }
                    else
                    {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + 'S');
                    }
                    if ((S.SPort.BuyProduct[DataBase.TProductType.ptOrganics]))
                    {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_2 + 'B');
                    }
                    else
                    {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + 'S');
                    }
                    if ((S.SPort.BuyProduct[DataBase.TProductType.ptEquipment]))
                    {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_2 + 'B');
                    }
                    else
                    {
                        Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + 'S');
                    }
                }
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + ')' + Core.Units.Core.endl);
                if ((S.SPort.BuildTime > 0))
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_14 + "           (Under Construction - " + (S.SPort.BuildTime).ToString() + " days left" + Core.Units.Core.endl);
                }
            }
            // Search through the planet database for planets and display them
            PromptDisplayed = false;
            SectItems = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itPlanet, S);
            while ((SectItems.Count > 0))
            {
                if (PromptDisplayed)
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_14 + "          ");
                }
                else
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Planets " + Ansi.Units.Ansi.ANSI_14 + ": ");
                    PromptDisplayed = true;
                }
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_7 + ColourPlanet(((TPlanet)(SectItems[0])).Name) + Core.Units.Core.endl);
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(SectItems[0]);
                SectItems.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            SectItems.Free;
            // show traders
            PromptDisplayed = false;
            SectItems = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itTrader, S);
            while ((SectItems.Count > 0))
            {
                if (PromptDisplayed)
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_14 + "          ");
                }
                else
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Traders " + Ansi.Units.Ansi.ANSI_14 + ": ");
                    PromptDisplayed = true;
                }
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + ((TTrader)(SectItems[0])).Name + Ansi.Units.Ansi.ANSI_14 + ',' + Ansi.Units.Ansi.ANSI_2 + " w/ " + Ansi.Units.Ansi.ANSI_14 + Utility.Units.Utility.Segment(((TTrader)(SectItems[0])).Figs) + Ansi.Units.Ansi.ANSI_2 + " ftrs" + Ansi.Units.Ansi.ANSI_14 + ',' + Core.Units.Core.endl);
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_2 + "           in " + Ansi.Units.Ansi.ANSI_3 + ((TTrader)(SectItems[0])).ShipName + Ansi.Units.Ansi.ANSI_2 + " (" + Ansi.Units.Ansi.ANSI_7 + ((TTrader)(SectItems[0])).ShipType + Ansi.Units.Ansi.ANSI_2 + ')' + Core.Units.Core.endl);
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(SectItems[0]);
                SectItems.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            SectItems.Free;
            // show ships
            PromptDisplayed = false;
            SectItems = Global.Units.Global.TWXDatabase.GetSectorItems(DataBase.TSectorItem.itShip, S);
            while ((SectItems.Count > 0))
            {
                if (PromptDisplayed)
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_14 + "          ");
                }
                else
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Ships   " + Ansi.Units.Ansi.ANSI_14 + ": ");
                    PromptDisplayed = true;
                }
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + ((TShip)(SectItems[0])).Name + Ansi.Units.Ansi.ANSI_5 + " [" + Ansi.Units.Ansi.ANSI_4 + "Owned by" + Ansi.Units.Ansi.ANSI_5 + "] " + Ansi.Units.Ansi.ANSI_5 + ((TShip)(SectItems[0])).Owner + Ansi.Units.Ansi.ANSI_14 + ',' + Ansi.Units.Ansi.ANSI_2 + " w/ " + Ansi.Units.Ansi.ANSI_14 + Utility.Units.Utility.Segment(((TShip)(SectItems[0])).Figs) + Ansi.Units.Ansi.ANSI_2 + " ftrs" + Ansi.Units.Ansi.ANSI_14 + ',' + Core.Units.Core.endl);
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_2 + "           (" + Ansi.Units.Ansi.ANSI_7 + ((TShip)(SectItems[0])).ShipType + Ansi.Units.Ansi.ANSI_2 + ')' + Core.Units.Core.endl);
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(SectItems[0]);
                SectItems.RemoveAt(0);
            }
            //@ Unsupported property or method(C): 'Free'
            SectItems.Free;
            if ((S.Figs.Quantity > 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Fighters" + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_11 + Utility.Units.Utility.Segment(S.Figs.Quantity) + Ansi.Units.Ansi.ANSI_5 + " (" + S.Figs.Owner + ") " + Ansi.Units.Ansi.ANSI_6);
                if ((S.Figs.FigType == DataBase.TFighterType.ftToll))
                {
                    Global.Units.Global.TWXServer.Broadcast("[Toll]");
                }
                else if ((S.Figs.FigType == DataBase.TFighterType.ftDefensive))
                {
                    Global.Units.Global.TWXServer.Broadcast("[Defensive]");
                }
                else
                {
                    Global.Units.Global.TWXServer.Broadcast("[Offensive]");
                }
                Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl);
            }
            if ((S.NavHaz > 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "NavHaz  " + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_12 + (S.NavHaz).ToString() + Ansi.Units.Ansi.ANSI_5 + '%' + Ansi.Units.Ansi.ANSI_1 + " (" + Ansi.Units.Ansi.ANSI_3 + "Space Debris/Asteroids" + Ansi.Units.Ansi.ANSI_1 + ')' + Core.Units.Core.endl);
            }
            if ((S.Mines_Armid.Quantity > 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Mines   " + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_12 + (S.Mines_Armid.Quantity).ToString() + Ansi.Units.Ansi.ANSI_5 + " (" + Ansi.Units.Ansi.ANSI_2 + "Type " + Ansi.Units.Ansi.ANSI_14 + '1' + Ansi.Units.Ansi.ANSI_2 + " Armid" + Ansi.Units.Ansi.ANSI_5 + ") (" + S.Mines_Armid.Owner + ')' + Core.Units.Core.endl);
                if ((S.Mines_Limpet.Quantity > 0))
                {
                    Global.Units.Global.TWXServer.Broadcast("        " + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_12 + (S.Mines_Limpet.Quantity).ToString() + Ansi.Units.Ansi.ANSI_5 + " (" + Ansi.Units.Ansi.ANSI_2 + "Type " + Ansi.Units.Ansi.ANSI_14 + '2' + Ansi.Units.Ansi.ANSI_2 + " Limpet" + Ansi.Units.Ansi.ANSI_5 + ") (" + S.Mines_Limpet.Owner + ')' + Core.Units.Core.endl);
                }
            }
            else if ((S.Mines_Limpet.Quantity > 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_5 + "Mines   " + Ansi.Units.Ansi.ANSI_14 + ": " + Ansi.Units.Ansi.ANSI_12 + (S.Mines_Limpet.Quantity).ToString() + Ansi.Units.Ansi.ANSI_5 + " (" + Ansi.Units.Ansi.ANSI_2 + "Type " + Ansi.Units.Ansi.ANSI_14 + '2' + Ansi.Units.Ansi.ANSI_2 + " Limpet" + Ansi.Units.Ansi.ANSI_5 + ") (" + S.Mines_Limpet.Owner + ')' + Core.Units.Core.endl);
            }
            Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_10 + "Warps to Sector(s) " + Ansi.Units.Ansi.ANSI_14 + ":  ");
            if ((S.Warp[1] > 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_11 + (S.Warp[1]).ToString());
            }
            for (I = 2; I <= 6; I ++ )
            {
                if ((S.Warp[I] > 0))
                {
                    Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_2 + " - " + Ansi.Units.Ansi.ANSI_11 + (S.Warp[I]).ToString());
                }
                else
                {
                    break;
                }
            }
            Backdoors = Global.Units.Global.TWXDatabase.GetBackDoors(S, Index);
            if ((Backdoors.Count > 0))
            {
                Global.Units.Global.TWXServer.Broadcast(Ansi.Units.Ansi.ANSI_4 + "  (backdoors)" + Ansi.Units.Ansi.ANSI_7);
            }
            Utility.Units.Utility.FreeList(Backdoors, 2);
            Global.Units.Global.TWXServer.Broadcast(Core.Units.Core.endl + Core.Units.Core.endl + Core.Units.Core.endl);
        }

        public static int MenuSortFunc(object Item1, object Item2)
        {
            int result;
            if ((((Item1) as TTWXMenuItem).HotKey == ((Item2) as TTWXMenuItem).HotKey))
            {
                result = 0;
            }
            else if ((((byte)((Item1) as TTWXMenuItem).HotKey) < ((byte)((Item2) as TTWXMenuItem).HotKey)))
            {
                result =  -1;
            }
            else
            {
                result = 1;
            }
            return result;
        }

    } // end Menu

}

