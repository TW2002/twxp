using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;

namespace TWXP
{
    public static partial class cmd
    {
        internal static List<Command> Commands {get; private set;}
        //private static Proxy proxy;

        internal static void Load()
        {
            if (Commands != null) return;

            Commands = new List<Command>();

            #region Command List
            Commands.Add(new Command("Add", Add));
            Commands.Add(new Command("AddMenu"));  //TODO:
            Commands.Add(new Command("And", And));
            Commands.Add(new Command("Branch", Branch)); 
            Commands.Add(new Command("ClientMessage"));  //TODO:
            Commands.Add(new Command("CloseMenu"));  //TODO:
            Commands.Add(new Command("Connect", Connect, 0, 0, 0));
            Commands.Add(new Command("CutText", CutText, 1, 4, 4));
            Commands.Add(new Command("Delete")); //TODO:
            Commands.Add(new Command("Disconnect", Disconnect, 0, 0, 0)); //In-Progress
            Commands.Add(new Command("Divide", Divide));
            Commands.Add(new Command("Echo", Echo)); //In-Progress
            Commands.Add(new Command("FileExists")); //TODO: --- through rest of list, except operators ---
            Commands.Add(new Command("GetCharCode"));
            Commands.Add(new Command("GetConsoleInput"));
            Commands.Add(new Command("GetCourse"));
            Commands.Add(new Command("GetDate"));
            Commands.Add(new Command("GetDistance"));
            Commands.Add(new Command("GetInput"));
            Commands.Add(new Command("GetLength", GetLength, 1));
            Commands.Add(new Command("GetMenuValue"));
            Commands.Add(new Command("GetGetOutText"));
            Commands.Add(new Command("GetRnd"));
            Commands.Add(new Command("GetSector"));
            Commands.Add(new Command("GetSectorParameter"));
            Commands.Add(new Command("GetText", CutText, 1, 4, 4));
            Commands.Add(new Command("GetTime"));
            Commands.Add(new Command("Gosub", Gosub, 0, 1, 1));
            Commands.Add(new Command("Goto", Goto, 0, 1, 1));
            Commands.Add(new Command("GetWord", GetWord, 1));
            Commands.Add(new Command("GetWordPos", GetWordPos));
            Commands.Add(new Command("Halt", Halt, 0, 0, 0));
            Commands.Add(new Command("IsEquil", IsEquil));
            Commands.Add(new Command("IsGreater", IsGreater));
            Commands.Add(new Command("IsGreaterEquil", IsGreaterEquil));
            Commands.Add(new Command("IsLesser", IsLesser));
            Commands.Add(new Command("IsLesserEquil", IsLesserEquil));
            Commands.Add(new Command("IsNotEquil", IsNotEquil));
            Commands.Add(new Command("IsNumber"));
            Commands.Add(new Command("KillWindow"));
            Commands.Add(new Command("KillAllTriggers"));
            Commands.Add(new Command("KillTriggers"));
            Commands.Add(new Command("Load"));
            Commands.Add(new Command("LoadVar"));
            Commands.Add(new Command("Logging"));
            Commands.Add(new Command("LowerCase", LowerCase));
            Commands.Add(new Command("MergeText", MergeText, 2));
            Commands.Add(new Command("Multiply", Multiply));
            Commands.Add(new Command("OpenMenu"));
            Commands.Add(new Command("Or", Or));
            Commands.Add(new Command("Pause", Pause, 0 ,0 ,0));
            Commands.Add(new Command("ProcessIn"));
            Commands.Add(new Command("ProcessOut"));
            Commands.Add(new Command("Read"));
            Commands.Add(new Command("Rename"));
            Commands.Add(new Command("ReplaceText"));
            Commands.Add(new Command("ReqRecording"));
            Commands.Add(new Command("Return", Return, 0, 0, 0));
            Commands.Add(new Command("Round"));
            Commands.Add(new Command("SaveVar"));
            Commands.Add(new Command("Send"));
            Commands.Add(new Command("SetArray"));
            Commands.Add(new Command("SetDelayTrigger"));
            Commands.Add(new Command("SetEventTrigger", SetEventTrigger));
            Commands.Add(new Command("SetMenuHelp"));
            Commands.Add(new Command("SetMenuValue"));
            Commands.Add(new Command("SetMenuOptions"));
            Commands.Add(new Command("SetPrecision"));
            Commands.Add(new Command("SetProgVar"));
            Commands.Add(new Command("SetSectorParameter"));
            Commands.Add(new Command("SetTextLineTrigger"));
            Commands.Add(new Command("SetTextOutTrigger"));
            Commands.Add(new Command("SetTextTrigger"));
            Commands.Add(new Command("SetVar", SetVar));
            Commands.Add(new Command("SetWindowContents"));
            Commands.Add(new Command("Sound"));
            Commands.Add(new Command("Stop"));
            Commands.Add(new Command("StripText", StripText));
            Commands.Add(new Command("Subtract", Subtract));
            Commands.Add(new Command("SYS_CHECK"));
            Commands.Add(new Command("SYS_FAIL"));
            Commands.Add(new Command("SYS_KILL"));
            Commands.Add(new Command("SYS_NOAUTH"));
            Commands.Add(new Command("SYS_NOP"));
            Commands.Add(new Command("SYS_SHOWMSG"));
            Commands.Add(new Command("SystemScript"));
            Commands.Add(new Command("UpperCase", UpperCase));
            Commands.Add(new Command("Xor", Xor));
            Commands.Add(new Command("Window"));
            Commands.Add(new Command("Write"));

            // Commands added for 2.04beta
            Commands.Add(new Command("GetTimer"));
            Commands.Add(new Command("ReadToArray"));

            // Commands added for 2.04final
            Commands.Add(new Command("ClearAllAvoids"));
            Commands.Add(new Command("ClearAvoid"));
            Commands.Add(new Command("GetAllCoarses"));
            Commands.Add(new Command("GetFileList"));
            Commands.Add(new Command("GetNearestWarps"));
            Commands.Add(new Command("GeScriptVersion"));
            Commands.Add(new Command("ListActiveScripts"));
            Commands.Add(new Command("ListAvoids"));
            Commands.Add(new Command("ListSectorParameters"));
            Commands.Add(new Command("SetAvoid"));

            // Commands added for 2.05beta
            Commands.Add(new Command("CutLengths"));
            Commands.Add(new Command("Format"));
            Commands.Add(new Command("GetDirList"));
            Commands.Add(new Command("GetWordCount", GetWordCount, 1));
            Commands.Add(new Command("MakeDir"));
            Commands.Add(new Command("PadLeft", PadLeft));
            Commands.Add(new Command("PadRight", PadRight));
            Commands.Add(new Command("RemoveDir"));
            Commands.Add(new Command("SetMenuKey"));
            Commands.Add(new Command("SplitText")); // TODO: Returns an array
            Commands.Add(new Command("Trim", Trim));
            Commands.Add(new Command("Truncate"));




            Commands.Add(new Command("Not", Not));

        }

        #endregion
        #region Flow Control commands  


        /// <summary>
        /// Brances to the specified label if condition is false, otherwise 
        /// operation will continue with the next line.
        /// </summary>
        /// <param name="condition">The condition to be tested.</param>
        /// <param name="label">The label to jump to if the condition is false.</param>
        internal static void Branch(TWS script, params Param[] param)
        {
            if (!param[0]) script.Goto(param[1]);
        }

        /// <summary>
        /// Goto unconditinally jumps to the specified label.
        /// </summary>
        /// <param name="label">The label to jump to if the condition is false.</param>
        internal static void Goto(TWS script, params Param[] param)
        {
            script.Goto(param[0]);
        }

        /// <summary>
        /// Temporarily jumps to a subroutine with the ability to return to where it came from.
        /// </summary>
        /// <param name="label">The label to jump to.</param>
        internal static void Gosub(TWS script, params Param[] param)
        {
            script.Gosub(param[0]);
        }

        /// <summary>
        /// Return from a subroutine to the next line after the gosub that called it.
        /// </summary>
        internal static void Return(TWS script, params Param[] param)
        {
            script.Return();
        }


        /// <summary>
        /// Pauses the current script until a trigger is hit, or timeout occurs.
        /// Operation will continue with the next line if a timeout occurs.
        /// </summary>
        /// <param name="timeout">Optionally specifies the time in milliseconds to wait before timing out.</param>
        internal static void Pause(TWS script, params Param[] param)
        {
            script.Pause();
        }

        /// <summary>
        /// Immediately and unconditionally terminates the currently running script.
        /// </summary>
        internal static void Halt(TWS script, params Param[] param)
        {
            script.Halt();
        }


        #endregion
        #region Assignment operator commands  


        /// <summary>
        /// Assignment Operator - Asigns a value to a parameter.
        /// </summary>
        /// <param name="a">The paramater to be asigned to.</param>
        /// <param name="b">The value to be asigned to the paramater.</param>
        internal static void SetVar(Param a, Param b)
        {
            a.Update((string)b);
        }


#endregion
#region Mathmatical operator commands    

        /// <summary>
        /// Mathmatical operator cmd.Multiply - Performs mathematical multiplication on a variable.
        /// </summary>
        /// <param name="a">The variable to be multiplied.</param>
        /// <param name="b">The amount to multiply the variable by.</param>
        internal static void Multiply(Param a, Param b)
        {
            a.Update((double)a * b);
        }

        /// <summary>
        /// Mathmatical Operator cmd.Divide - Performs mathematical division  on a variable.
        /// </summary>
        /// <param name="a">The variable to be divided.</param>
        /// <param name="b">The amount to divide the variable by.</param>
        internal static void Divide(Param a, Param b)
        {
            a.Update((double)a / b);
        }

        /// <summary>
        /// Mathmatical Operator cmd.Add - Adds a value to a variable.
        /// </summary>
        /// <param name="a">The variable that will have its value added to.</param>
        /// <param name="b">The amount the variable will be increased by.</param>
        internal static void Add(Param a, Param b)
        {
            a.Update((Double)a + b);
            //param[0].Update((double)param[0] + (double)param[1]);
        }


        /// <summary>
        /// Mathmatical Operator cmd.Subtract - Subtracts a value from a variable.
        /// </summary>
        /// <param name="a">The variable that will be subtracted from.</param>
        /// <param name="b">The amount the variable will be subtracted by</param>
        internal static void Subtract(Param a, Param b)
        {
            a.Update((double)a - b);
        }
#endregion
#region Logincal operator commands    

        /// <summary>
        /// Logincal Operator cmd.And - Performs a logical 'AND' on a variable.
        /// </summary>
        /// <param name="a">The variable to be operated on. The value in this variable must be either TRUE (1) or FALSE (0).</param>
        /// <param name="b">The value to be operated by. This value must be either TRUE (1) or FALSE (0).</param>
        internal static void And(Param a, Param b)
        {
            a.Update((bool)a && b);
        }

        /// <summary>
        /// Logincal Operator cmd.Or - Performs a logical 'OR' on a variable.
        /// </summary>
        /// <param name="a">The variable to be operated. The value in this variable must be either TRUE (1) or FALSE (0).</param>
        /// <param name="b">The value to be operated by. This value must be either TRUE (1) or FALSE (0).</param>
        internal static void Or(Param a, Param b)
        {
            a.Update((bool)a || b);
        }

        /// <summary>
        /// Logincal Operator cmd.Xor - Performs a logical 'XOR' on a variable.
        /// </summary>
        /// <param name="a">The variable to be operated. The value in this variable must be either TRUE (1) or FALSE (0).</param>
        /// <param name="b">The value to be operated by. This value must be either TRUE (1) or FALSE (0).</param>
        internal static void Xor(Param a, Param b)
        {
            a.Update((bool)a ^ b);
        }

        /// <summary>
        /// Logincal Operator cmd.Not - Performs a logical 'Not' on a variable.
        /// </summary>
        /// <param name="a">The variable to be operated. The boolean oposite of this varable will be returned</param>
        internal static void Not(Param a)
        {
            a.Update(!(bool)a);
        }
#endregion
#region Relational operator commands    

        /// <summary>
        /// Relational Operators cmd.IsEquil - True if they are equal.
        /// </summary>
        /// <param name="a">A variable to hold the result of the comparison.</param>
        /// <param name="b">"Left" hand operator to be compared.</param>
        /// <param name="c">"Right" hand operator to be compared.</param>
        internal static void IsEquil(Param a, Param b, Param c)
        {
            a.Update((double)b == (double)c);
        }

        /// <summary>
        /// Relational Operators cmd.IsNotEquil - True if they are not equal.
        /// </summary>
        /// <param name="a">A variable to hold the result of the comparison.</param>
        /// <param name="b">"Left" hand operator to be compared.</param>
        /// <param name="c">"Right" hand operator to be compared.</param>
        internal static void IsNotEquil(Param a, Param b, Param c)
        {
            a.Update((double)b != (double)c);
        }

        /// <summary>
        /// Relational Operators cmd.IsGreater - True if the first is greator than the second.
        /// </summary>
        /// <param name="a">A variable to hold the result of the comparison.</param>
        /// <param name="b">"Left" hand operator to be compared.</param>
        /// <param name="c">"Right" hand operator to be compared.</param>
        internal static void IsGreater(Param a, Param b, Param c)
        {
            a.Update((double)b > (double)c);
        }

        /// <summary>
        /// Relational Operators cmd.IsGeaterEquil - True if the first is greater than or equal to the second.
        /// </summary>
        /// <param name="a">A variable to hold the result of the comparison.</param>
        /// <param name="b">"Left" hand operator to be compared.</param>
        /// <param name="c">"Right" hand operator to be compared.</param>
        internal static void IsGreaterEquil(Param a, Param b, Param c)
        {
            a.Update((double)b >= (double)c);
        }

        /// <summary>
        /// Relational Operators cmd.IsLesser - True if the first is less than the second.
        /// </summary>
        /// <param name="a">A variable to hold the result of the comparison.</param>
        /// <param name="b">"Left" hand operator to be compared.</param>
        /// <param name="c">"Right" hand operator to be compared.</param>
        internal static void IsLesser(Param a, Param b, Param c)
        {
            a.Update((double)b < (double)c);
        }

        /// <summary>
        /// Relational Operators cmd.IsLesserEquil - True if the first is less than or equal to the second.
        /// </summary>
        /// <param name="a">A variable to hold the result of the comparison.</param>
        /// <param name="b">"Left" hand operator to be compared.</param>
        /// <param name="c">"Right" hand operator to be compared.</param>
        internal static void IsLesserEquil(Param a, Param b, Param c)
        {
            a.Update((double)b <= (double)c);
        }
#endregion
#region Terminal commands

        /// <summary>
        /// Command cmd.Connect - Connects TWX Proxy to a remote server.
        /// </summary>
        internal static void Connect(TWS script, params Param[] param)
        {
            script.Proxy.Connect();
        }

        /// <summary>
        /// Command cmd.Disconnect - Disconnects TWX Proxy from the remote server.
        /// </summary>
        internal static void Disconnect(TWS script, params Param[] param)
        {
            script.Proxy.Disconnect();
        }

    
        /// <summary>
        /// Command cmd.ClientMessage - Broadcasts a formatted string, to all connected client
        /// sessions. String is sent in Bright White and the prompt is re-displayed afterwards.
        /// </summary>
        /// <param name="String">String to be broadcast.</param>
        internal static void ClientMessage(string s)
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.Echo - Echos all parameters, as strings, to all connected client sessions.
        /// </summary>
        /// <param name="param">Parameters to be concatenated and echoed</param>
        public static void Echo(TWS script, params Param[] param)
        {
            StringBuilder output = new StringBuilder();
            //string output = "";
            foreach (Param p in param)
            {
                output.Append((string)p);
            }

            script.Proxy.Echo(output.ToString());
            Debug.Write($"Echo: {output}\n");
        }

        
        /// <summary>
        /// Command cmd.Send - Sends text to the remote server.
        /// </summary>
        /// <param name="param">Parameters to be concatenated and sent.</param>
        internal static void Send(params Param[] param)
        {
            //TODO:
        }

        
        /// <summary>
        /// Command cmd.GetInput - Gets a line of text from the user.
        /// </summary>
        /// <param name="var">The paramater to hold the line of text entered by the user.</param>
        /// <param name="prompt">The text to display above the input prompt.</param>
        internal static void GetInput(Param var, Param prompt)
        {
            var.Update(GetInput(prompt));
        }

        internal static string GetInput(string prompt)
        {
            //TODO:
            return "";
        }

        
        /// <summary>
        /// Command cmd.GetConsoleInput - Get input from a connected terminal without sending it.
        /// </summary>
        /// <param name="var">The paramater to hold the line of text entered by the user.</param>
        /// <param name="prompt">The text to display above the input prompt.</param>
        /// <param name="singleKey">.</param>
        /// For backwards compatability, any value for the singleKey parameter will be interperted as true.
        internal static void GetConsoleInput(Param var, string prompt, bool singleKey = false)
        {
            var.Update(GetConsoleInput(prompt, singleKey));
        }

        internal static string GetConsoleInput(string prompt, bool singleKey = false)
        {
            //TODO:
            return "";
        }

        /// <summary>
        /// Command cmd.GetOuttext - Retrieve any outgoing text from TWX Proxy's outgoing buffer.
        /// </summary>
        /// <param name="var">The paramater to hold the outgoing text.</param>
        internal static void GetOuttext(Param var)
        {
            var.Update(GetOuttext());
        }

        internal static string GetOuttext()
        {
            //TODO:
            return "";
        }

        
        /// <summary>
        /// Command cmd.ProcessIn  - Emulates incoming text from the remote server, activating TextLine triggers.
        /// </summary>
        /// <param name="AllScripts">True will activate all matching triggers in ALL scripts, while false will onlly process triggers from the current script.</param>
        /// <param name="text">The text to be processed as inbound.</param>
        internal static void ProcessIn(bool AllScripts, string text)
        {
            //TODO:
        }

        
        /// <summary>
        /// Command cmd.ProcessOut  - Resumes processing out outgoing data that was trapped by a TextOutTrigger.
        /// </summary>
        /// <param name="text">The text to be processed as outbound.</param>
        internal static void ProcessOut()
        {
            //TODO:
        }

        
        
        /// <summary>
        /// Command cmd.GetDeafClients  - Retreives the status of any deaf clients.
        /// </summary>
        /// <param name="var">The paramater that will contain TRUE if any dead clients are found.</param>
        internal static void GetDeafClients(Param var)
        {
            var.Update(GetDeafClients());
        }
                       
        internal static bool GetDeafClients()
        {
            //TODO:
            return false;
        }

        /// <summary>
        /// Command cmd.SetDeafClients - Sets the deaf status on all clients.
        /// </summary>
        /// <param name="var">An optional variable that will wake clients if set to FALSE. By default the command will deafen all clients.</param>
        internal static void SetDeafClients(bool deafen = true)
        {
            //TODO:
        }

        
        
        
#endregion
#region Delay and Trigger commands
     
        /// <summary>
        /// Command cmd.setDelayTrigger - Creates a trigger that will activate after a specified time period.
        /// </summary>
        /// <param name="Name">The name of the trigger to create. This name is used for later references to the trigger.</param>
        /// <param name="Label">A label within the script to jump to when the trigger is activated.</param>
        /// <param name="Ticks">The number of milliseconds to wait before the delay trigger automatically activates itself.</param>
        internal static void SetDelayTrigger(string name, string label, int tics)
        {
            //TODO:
        }
        
        /// <summary>
        /// Command cmd.SetEventTrigger - Creates a trigger that will activate on a certain program event.
        /// </summary>
        /// <param name="Name">The name of the trigger to create. This name is used for later references to the trigger.</param>
        /// <param name="Label">A label within the script to jump to when the trigger is activated.</param>
        /// <param name="Event">The name of the program event to attach the trigger to.</param>
        /// <param name="Parameter">(optional) parameter for specific events.</param>
        internal static void SetEventTrigger(TWS script, params Param[] param)
            //string name, string label, string fireon, string parameter)
        {
            switch (param.Length)
            {
                case 3:
                    Extractor.AddEventTrigger(script, param[0], param[1], param[2]);
                    break;
                case 4:
                    // TODO: Stript start/stop and time hit events
                    break;
            }
        }
                       
//SCRIPT LOADED : Activates when a script is loaded. Parameter = Script Name.
//SCRIPT STOPPED : Activates when a script is terminated. Parameter = Script Name.
//CONNECTION ACCEPTED : Server connection accepted. (no parameters).
//CONNECTION LOST : Server connection lost. (no parameters).
//CLIENT CONNECTED : Telnet client connected. (no parameters).
//CLIENT DISCONNECTED : Telnet client disconnected. (no parameters).
//TIME HIT : Activates when specified time is hit. Parameter = specified time.                       
        
        /// <summary>
        /// Command cmd.SetTextLineTrigger - Creates a trigger activated when specific text is received from Server.
        /// </summary>
        /// <param name="Name">The name of the trigger to create. This name is used for later references to the trigger.</param>
        /// <param name="Label">A label within the script to jump to when the trigger is activated.</param>
        /// <param name="Value">A value that is required to be in the block of incoming text for the trigger to activate. If this parameter is not specified, the trigger will activate on any line - even if it is blank.</param>
        internal static void SetTextLineTrigger(string name, string label, string Value)
        {
            //TODO:
        }
        
        /// <summary>
        /// Command cmd.SetTextTrigger - Creates a text trigger activated when specific text is received.
        /// </summary>
        /// <param name="Name">The name of the trigger to create. This name is used for later references to the trigger.</param>
        /// <param name="Label">A label within the script to jump to when the trigger is activated.</param>
        /// <param name="Value">A value that is required to be in the block of incoming text for the trigger to activate. If this parameter is not specified, the trigger will activate on any line - even if it is blank.</param>
        internal static void SetTextTrigger(string name, string label, string Value)
        {
            //TODO:
        }
        
        /// <summary>
        /// Command cmd.SetTextOutTrigger - Creates a trigger activated when specific text is received from Client.
        /// </summary>
        /// <param name="Name">The name of the trigger to create. This name is used for later references to the trigger.</param>
        /// <param name="Label">A label within the script to jump to when the trigger is activated.</param>
        /// <param name="Value">A value that is required to be in the block of incoming text for the trigger to activate. If this parameter is not specified, the trigger will activate on any line - even if it is blank.</param>
        internal static void SetTextOutTrigger(string name, string label, string Value)
        {
            //TODO:
        }
        
        /// <summary>
        /// Command cmd.KillAllTriggers - Terminates all triggers in the script and its included subroutines.
        /// </summary>
        internal static void KillAllTriggers()
        {
            //TODO:
        }
        
        /// <summary>
        /// Command cmd.KillTrigger - Terminates the specified trigger.
        /// </summary>
        /// <param name="Name">The name of the trigger to kill. This name was specified hen the trigger was created.</param>
        internal static void KillTrigger(string name)
        {
            //TODO:
        }
        
        /// <summary>
        /// Command cmd.Pause - Pauses the script's execution, allowing it to wait for its triggers to activate.
        /// </summary>
        internal static void Pause()
        {
            //TODO:
        }
        
        /// <summary>
        /// Command cmd.Sleep (NEW) - Pauses the script's execution, but will continue after delay expires.
        /// </summary>
        /// <param name="Ticks">The number of milliseconds to wait before the delay trigger automatically activates itself.</param>
        internal static void Sleep(int ticks)
        {
            //TODO:
        }
        
        
        /// <summary>
        /// Command cmd.WaitFor - Pauses script execution, waiting for specified text from server connection.
        /// </summary>
        /// <param name="Value">A value that is required to be in the block of incoming text for the trigger to activate. If this parameter is not specified, the trigger will activate on any line - even if it is blank.</param>
        internal static void WaitFor(string value)
        {
            //TODO:
        }
        
        
        /// <summary>
        /// Command cmd.WaitOn - create a temporary TextTrigger using a macro.
        /// </summary>
        /// <param name="Value">A value that is required to be in the block of incoming text for the trigger to activate. If this parameter is not specified, the trigger will activate on any line - even if it is blank.</param>
        internal static void WaitOn(string value)
        {
            //TODO:
        }

#endregion
#region Menu System commands

        /// <summary>
        /// Command cmd.SetMenuKey - Sets the menu key used to activate TWX.
        /// </summary>
        /// <param name="Key">A string containing the character to be used to activate the TWX main menu.</param>
        internal static void SetMenuKey(string key)
        {
            SetMenuKey(key[0]);
        }
        internal static void SetMenuKey(char key)
        {
            //TODO:
        }

        /// <summary>
        /// Command cmd.AddMenu - Adds a new TWX menu.
        /// </summary>
        /// <param name="parent">The name of the 'parent' menu this menu will be added to. If left blank, the menu will not be shown in the option list of any other menu in existance.</param>
        /// <param name="name">The name of the new menu being created.</param>
        /// <param name="description">The description of the menu being created. This description will be shown in the option list of the parent menu, and as a title for the new menu option list.</param>
        /// <param name="hotkey">The hotkey used to access this menu from it's parent menu.</param>
        /// <param name="reference">The script label reference to jump to when the new menu is activated.</param>
        /// <param name="prompt">The text to display inside the new menu prompt.</param>
        /// <param name="closeMenu">If TRUE, this menu will automatically close itself when it is activated. For sub-menus that contain their own list of options, this should always be set to FALSE. Default value is FLASE</param>
        internal static void AddMenu(string parent, string name, string description, string hotkey, string reference, string prompt, bool closeMenu = false)
        {
            //TODO:
        }
        /// <summary>

        /// <summary>
        /// Command cmd.OpenMenu - Activates an existing script menu or TWX Terminal Menu option.
        /// </summary>
        /// <param name="name">The name of an existing menu to activate.</param>
        /// <param name="Pause">(Optional)A value of false causes the menu to display but not pause. Default valuse is true.</param>
        internal static void OpenMenu(string name, bool pause = true)
        {
            //TODO:
        }

        /// Command cmd.CloseMenu - Closes the open TWX menu.
        /// </summary>
        internal static void CloseMenu()
        {
            //TODO:
        }
                       
        /// <summary>
        /// Command cmd.GetMenuValue -Retrieve the display value of an existing menu.
        /// </summary>
        /// <param name="name">The name of an existing menu to activate.</param>
        /// <param name="Value">A paramater to hold the value associated with the menu.</param>
        internal static void GetMenuValue(string name, Param value)
        {
            value.Update(GetMenuValue(name));
        }
                       
        internal static string GetMenuValue(string name)
        {
            //TODO:
            return "";
        }

        /// <summary>
        /// Command cmd.SetMenuValue - Sets the display value of an existing menu.
        /// </summary>
        /// <param name="name">The name of an existing menu to have its value set.</param>
        /// <param name="Value">A paramater to hold the new value that will be associated with the menu.</param>
        internal static void SetMenuValue(string name, Param value)
        {
            //TODO:
        }
                       
        /// <summary>
        /// Command cmd.SetMenuHelp - Sets the help display of an existing menu.
        /// </summary>
        /// <param name="name">The name of an existing menu to have its value set.</param>
        /// <param name="text">The new help text for the menu.</param>
        internal static void SetMenuHelp(string name, string text)
        {
            //TODO:
        }
                       
        /// <summary>
        /// Command cmd.SetMenuOptions - Configures standard options accessible from a menu.
        /// </summary>
        /// <param name="name">The name of an existing menu to have its value set.</param>
        /// <param name="quit">{Q} Defines if the "Quit Menu" function will be accessible from within the specified menu. </param>
        /// <param name="list">{?} Defines if the "Command List" function will be accessible from within the specified menu.</param>
        /// <param name="help">{+} Defines if the "Help on Command" function will be accessible from within the specified menu.</param>
        internal static void SetMenuOptions(string name, bool quit = true, bool list = true, bool help = true)
        {
            //TODO:
        }


#endregion
#region Window commands
        
        /// <summary>
        /// Command cmd.Window - Creates a script window to display information while the script is running.
        /// </summary>
        /// <param name="windowName">The name of the script window to create. The window will be referenced by this name.</param>
        /// <param name="sizeX">The width (in pixels) of the new window.</param>
        /// <param name="sizeY">The height (in pixels) of the new window.</param>
        /// <param name="title">The title to display at the top of the window.</param>
        /// <param name="ontop">If specified, the window will be set to appear on top of all other windows on the desktop.</param>
        internal static void Window(string windowName, int sizeX, int sizeY, string title, bool ontop = false)
        {
            //TODO:
        }

        /// <summary>
        /// Command cmd.SetWindowContents - Sets the display content of a script window.
        /// </summary>
        /// <param name="windowName">The name of the script window to modify.</param>
        /// <param name="text">The text content to place inside the script window.</param>
        internal static void SetWindowContents(string windowName, string text)
        {
            //TODO:
        }

        /// <summary>
        /// Command cmd.KillWindow - Unloads a script window.
        /// </summary>
        /// <param name="windowName">The name of the script window to close.</param>
        internal static void KillWindow(string windowName)
        {
            //TODO:
        }

#endregion
#region load/save ini file commands

        /// <summary>
        /// Command cmd.LoadVar - Loads a variable from the config file associated with the current Database.
        /// </summary>
        /// <param name="var">The paramater to load from file.</param>
        internal static void LoadVar(Param var)
        {
            //TODO:
        }

        /// <summary>
        /// Command SaveVar - Saves a variable to a file associated with the currently selected Database.
        /// </summary>
        /// <param name="var">The paramater to save to file.</param>
        internal static void SaveVar(Param var)
        {
            //TODO:
        }

#endregion
#region Global Var commands

        /// <summary>
        /// Command cmd.LoadGlobal - Loads a variable from a global array without all that mucking around in INI files.
        /// </summary>
        /// <param name="var">The paramater to load from global memory.</param>        
        internal static void LoadGlobal(Param var)
        {
            //TODO:
        }

        /// <summary>
        /// Command cmd.SaveGlobal - Saves a variable to a global array without all that mucking around in INI files.
        /// </summary>
        /// <param name="var">The paramater to save to global memory.</param>
        internal static void SaveGlobal(Param var)
        {
            //TODO:
        }

        /// <summary>
        /// Command cmd.ClearGlobals - Clears all global variables from memory.
        /// </summary>
        internal static void ClearGlobals()
        {
            //TODO:
        }

#endregion
#region String Manipulation commands

        /// <summary>
        /// Command cmd.CutLengths - Cuts the lengths of an array of strings.
        /// </summary>
        /// ????  array <lengths1,length2,...>
        internal static void CutLengths()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.CutText - Cuts a value out of a piece of text.
        /// </summary>
        /// <param name="text">The line of text to copy a value from.</param>
        /// <param name="var">The paramater to hold the value</param>
        /// <param name="start">The position of the first character to be copied.</param>
        /// <param name="length">The length of the last text to be copied.</param>
        internal static void CutText(TWS script, params Param[] param)
        {
            param[1].Update(((string)param[0]).Substring((int)param[2], (int)param[3]));
        }
    
        /// <summary>
        /// Command cmd.Format - Formats a string for display.
        /// </summary>
        /// Format = (CURRENCY, NUMBER, DATETIMETOSTR, STRTODATETIME)
        /// <param name="text">The text to be formatted.</param>
        /// <param name="var">The paramater to hold the formatted string.</param>
        /// <param name="format">The format to be applied (CURRENCY, NUMBER, DATETIMETOSTR, STRTODATETIME).</param>
        internal static void Format(Param text, Param var, Param format)
        {
            var.Update(Format(text, format));
        }

        internal static string Format(string text, string format)
        {
            //TODO:
            return "";
        }
                       
        /// <summary>
        /// Command cmd.GetCharCode - Retrieves an ASCII character code from a single-character value.
        /// </summary>
        /// <param name="c">The charto get a code from. This must be a single character, it cannot be a block of text.</param>
        /// <param name="var">The paramater to hold the character code.</param>
        internal static void GetCharCode(char c, Param var)
        {
            var.Update(GetCharCode(c));
        }
                       
        internal static string GetCharCode(char c)
        {
            //TODO:
            return "";
        }
    
        /// <summary>
        /// Command cmd.GetLength - Retrieves the length of a block of text.
        /// </summary>
        /// <param name="text">The text to be tested for its length.</param>
        /// <param name="var">The paramater to hold the character code.</param>
        internal static void GetLength(Param text, Param var)
        {
            var.Update(((string)text).Length);
        }
    
        /// <summary>
        /// Command cmd.GetText - Copies a value out of a line of text by using sub strings.
        /// </summary>
        /// <param name="text">The line of text to copy a value from.</param>
        /// <param name="var">The paramater to hold the value</param>
        /// <param name="start">The position of the first character to be copied.</param>
        /// <param name="end">The position of the last character to be copied.</param>
        internal static void GetText(Param text, Param var, Param start, Param end)
        {
            var.Update(((string)text).Substring((int)start, (int)end-(int)start));
        }
    
        /// <summary>
        /// Command cmd.GetWord - Copies a specific word out of a line of text.
        /// </summary>
        /// <param name="text">The line of text to copy a value from.</param>
        /// <param name="var">The paramater to hold the value</param>
        /// <param name="index">The index of the word to be copied.</param>
        /// <param name="default">The default value id no waor is found.</param>
        internal static void GetWord(TWS script, params Param[] param)
        {
            param[0].Update(GetWord(param[1], param[2], param[3]));
        }
    
        public static string GetWord(Param text, Param index, Param defaulttext = null)
        {
            string[] s = ((string)text).Split(' ');
            if ((int)index > s.Length) return default;
            else return s[(int)index];
        }
    
        /// <summary>
        /// Command cmd.GetWordCount - Counts the words in a string.
        /// </summary>
        /// <param name="text">The line of text to count words in.</param>
        /// <param name="var">The paramater to hold the number of words in the string</param>
        internal static void GetWordCount(Param text, Param var)
        {
            var.Update(GetWordCount(text));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="text"></param>
        /// <param name="text">The line of text to count words in.</param>
        /// <returns>The number of words in the string.</returns>
        public static int GetWordCount(string text)
        {
            return text.Split(' ').Length;
        }
    
        /// <summary>
        /// Command cmd.GetWordPos - Finds the location of a value within a block of text.
        /// </summary>
        /// <param name="text">The line of text to copy a value from.</param>
        /// <param name="var">The paramater to hold the position.</param>
        /// <param name="value">The value to search for.</param>
        internal static void GetWordPos(Param text, Param var, Param value)
        {
            var.Update(((string)text).IndexOf(value));
        }
    
        /// <summary>
        /// Command cmd.LowerCase - Converts all text within a variable to lower case.
        /// </summary>
        /// <param name="var">The paramater to be converted to lowercase.</param>
        internal static void LowerCase(Param var)
        {
            var.Update(((string)var).ToLower());
        }
    
        /// <summary>
        /// Command cmd.MergeText - Concatenates two text values together to form one.
        /// </summary>
        /// <param name="text1">The value to form the first part of the merged value.</param>
        /// <param name="text2">The value to form the second part of the merged value.</param>
        /// <param name="var">The paramater to hold the merged strings.</param>
        internal static void MergeText(Param text1, Param text2, Param var)
        {
            var.Update((string)text1 + text2);
        }

        /// <summary>
        /// Command cmd.PadLeft - Add spaces to the left of a variable.
        /// </summary>
        /// <param name="var">The paramater to be padded.</param>
        /// <param name="length">The desired length of the result.</param>
        internal static void PadLeft(Param var, Param length)
        {
            var.Update(((string)var).PadLeft((int)length));
        }

        /// <summary>
        /// Command cmd.PadRight - Add spaces to the right of a variable.
        /// </summary>
        /// <param name="var">The paramater to be padded.</param>
        /// <param name="length">The desired length of the result.</param>
        internal static void PadRight(Param var, Param length)
        {
            var.Update(((string)var).PadRight((int)length));
        }
    
        /// <summary>
        /// Command cmd.SplitText - Splits a string into an array of words.
        /// </summary>
        /// <param name="text">A variable containing the text to be split.</param>
        /// <param name="var[]">An array to contain the split strings.</param>
        /// <param name="delims">Delimiters used to split string. Space and Tab will be used if omitted.</param>
        internal static void SplitText(string text, Param[] vars, string delims = null)
        {
            //TODO:
            if (delims == null) delims = " \t";
            //vars = (Param[])text.Split(delims.ToCharArray());
        }
    
        /// <summary>
        /// Command cmd.StripText - Removes a character or sub-string from a variable.
        /// </summary>
        /// <param name="var">A paramater containing a text value to have certain characters or sub-strings to be removed.</param>
        /// <param name="text">The character or sub-string to strip from "var".</param>
        internal static void StripText(Param var, Param text)
        {
            var.Update(((string)var).Replace(text,""));
        }
    
        /// <summary>
        /// Command cmd.Trim - Removes leading and trailing spaces from a string.
        /// </summary>
        /// <param name="var">A paramater containing a text to be trimmed.</param>
        internal static void Trim(Param var)
        {
            var.Update(((string)var).Trim());
        }
    
        /// <summary>
        /// Command cmd.UpperCase - Converts all text within a variable to upper case.
        /// </summary>
        /// <param name="var">The paramater to be converted to upercase.</param>
        internal static void UpperCase(Param var)
        {
            var.Update(((string)var).ToUpper());
        }
    
        
#endregion
#region File and Direcctory commands

    
        /// <summary>
        /// Command cmd.Delete - Deletes a file.
        /// </summary>
        internal static void Delete()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.FileExists - Checks to see if a file exists.
        /// </summary>
        internal static void FileExists()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GetDirList - Gets a list of files from a directory.
        /// </summary>
        internal static void GetDirList()
        {
            //TODO:
        }
      
        /// <summary>
        /// Command cmd.GetFileList - Populates a specified array with any files that match a specified Mask (like *.ts).
        /// </summary>
        internal static void GetFileList()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.MakeDir - Creates a directory.
        /// </summary>
        internal static void MakeDir()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.Read - Reads a line of a text from a text file.
        /// </summary>
        internal static void Read()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.Write - Appends a line of text to a text file.
        /// </summary>
        internal static void Write()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.RemoveDir - Removes a directory.
        /// </summary>
        internal static void RemoveDir()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.Rename - Renames a file.
        /// </summary>
        internal static void Rename()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.ReplaceText - Replaces a value, or set of values within a variable.
        /// </summary>
        internal static void ReplaceText()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.SetArray - Declares a static array.
        /// </summary>
        internal static void SetArray()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.ReadToArray - Reads a text file directly into a TWX array.
        /// </summary>
        internal static void ReadToArray()
        {
            //TODO:
        }
    

#endregion
#region database commands

        /// <summary>
        /// Command cmd.SetAvoid - Adds an Avoid to TWX's internal Avoid list.
        /// </summary>
        internal static void SetAvoid()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.ListAvoids - Populates a user-specified array with the list of internal Avoided sectors.
        /// </summary>
        internal static void ListAvoids()
        {
            //TODO:
        }
    
   
        /// <summary>
        /// Command cmd.ClearAllAvoids - Removes all sectors from TWX's internal Avoid list.
        /// </summary>
        internal static void ClearAllAvoids()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.ClearAvoid - Removes a single sector from TWX's internal Avoid list.
        /// </summary>
        internal static void ClearAvoid()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GetAllCourses - Populates an array with coarse plots from a specified sector.
        /// </summary>
        internal static void GetAllCourses()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GetCourse - Internally calculates a warp course using warp data in the TWX Proxy database.
        /// </summary>
        internal static void GetCourse()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GetDistance - Internally calculates the distance between two sectors.
        /// </summary>
        internal static void GetDistance()
        {
            //TODO:
        }
    
   
        /// <summary>
        /// Command cmd.GetNearestWarps - Populates a specified array with surrounding sectors, sorted by distance.
        /// </summary>
        internal static void GetNearestWarps()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GetSector - Retrieve the details of a specific sector from the TWX Proxy Database.
        /// </summary>
        internal static void GetSector()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.SetSectorParameter - Sets a permanent variable, assigning it to a sector.
        /// </summary>
        internal static void SetSectorParameter()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GetSectorParameter - Retrieves a permanent user specified variable assigned to a sector.
        /// </summary>
        internal static void GetSectorParameter()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.ListSectorParameters - Populates an array with the list of Sector Parameters for a sector.
        /// </summary>
        internal static void ListSectorParameters()
        {
            //TODO:
        }
    
    
    
    
#endregion
#region Misc commands
     
        /// <summary>
        /// Command cmd.GetDate - Retrieves the date and stores it in a variable.
        /// </summary>
        internal static void GetDate()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GetTime - Retrieves the current system time, or a formatted date/time value.
        /// </summary>
        internal static void GetTime()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GetTimer - Retrieves the number of CPU ticks since power on.
        /// </summary>
        internal static void GetTimer()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GetRnd - Generate a random number within a specified range.
        /// </summary>
        internal static void GetRnd()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.GeScriptVersion - Reports the version of the compiler used for a compiled script. (*.cts)
        /// </summary>
        internal static void GeScriptVersion()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.Logging - Disables or enables TWX Proxy's logging feature while the script is running.
        /// </summary>
        internal static void Logging()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.SystemScript - Sets the script as a "systemScript", allowing it to run in the background .
        /// </summary>
        internal static void SystemScript()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.ReqRecording - Ensures that data recording is turned ON.
        /// </summary>
        internal static void ReqRecording()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.Truncate - Calculates the integral part of a specified decimal number.
        /// </summary>
        internal static void Truncate()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.Round - Rounds a variable to the specified precision.
        /// </summary>
        internal static void Round()
        {
            //TODO:
        }
    
        /// <summary>
        /// Command cmd.SetPrecision - Sets the maximum precision for decimal calculations.
        /// </summary>
        internal static void SetPrecision()
        {
            //TODO:
        }
    
    
        
#endregion    
    }

    internal class Command
    {
        // Defines the reference types available.
        internal enum RefType { None, CmdRef, CmdRef1, CmdRef2, CmdRef3 }

        // This is the deligate definition, which defines the 
        // parameters and return value of TWX commands.
        internal delegate void CmdRef(TWS script, params Param[] param);
        internal delegate void CmdRef1(Param a);
        internal delegate void CmdRef2(Param a, Param b);
        internal delegate void CmdRef3(Param a, Param b, Param c);

        // A private instance of our deligate stores the reference to the real command.
        private Delegate reference;
        private RefType reftype;

        // internal properties for use by the compiler.
        internal string Name {get; private set;}
        internal int MinArgs { get; private set; }
        internal int MaxArgs { get; private set; }
        internal int Var { get; private set; }

        /// <summary>
        /// Command constructor class, initializes the class with the required properties.
        /// </summary>
        /// <param name="name">The name of the command used by the compiler.</param>
        /// <param name="reference">A deligate reference to the command.</param>
        /// <param name="minArgs">The minimum number of arguments allowed.</param>
        /// <param name="maxArgs">The Maximum number of arguments allowed.</param>
        internal Command(string name, CmdRef reference = null, int minArgs = 0, int maxArgs = -1, int var = 0)
        {
            // Store the command refererence.
            this.reference = reference;
            if (reference == null) reftype = RefType.None;
            else reftype = RefType.CmdRef;

            // Store the properties.
            Name = name;
            MinArgs = minArgs;
            MaxArgs = maxArgs;
            Var = var;
        }

        /// <summary>
        /// Command constructor class, initializes the class with the required properties.
        /// </summary>
        /// <param name="name">The name of the command used by the compiler.</param>
        /// <param name="reference">A deligate reference to the command.</param>
        /// <param name="minArgs">The minimum number of arguments allowed.</param>
        /// <param name="maxArgs">The Maximum number of arguments allowed.</param>
        internal Command(string name, CmdRef1 reference, int var = 0, int minArgs = 1, int maxArgs = 1)
        {
            // Store the command refererence.
            this.reference = reference;
            reftype = RefType.CmdRef1;

            // Store the properties.
            Name = name;
            MinArgs = minArgs;
            MaxArgs = maxArgs;
            Var = var;
        }

        /// <summary>
        /// Command constructor class, initializes the class with the required properties.
        /// </summary>
        /// <param name="name">The name of the command used by the compiler.</param>
        /// <param name="reference">A deligate reference to the command.</param>
        /// <param name="minArgs">The minimum number of arguments allowed.</param>
        /// <param name="maxArgs">The Maximum number of arguments allowed.</param>
        internal Command(string name, CmdRef2 reference, int var = 0, int minArgs = 2, int maxArgs = 2)
        {
            // Store the command refererence.
            this.reference = reference;
            reftype = RefType.CmdRef2;

            // Store the properties.
            Name = name;
            MinArgs = minArgs;
            MaxArgs = maxArgs;
            Var = var;
        }

        /// <summary>
        /// Command constructor class, initializes the class with the required properties.
        /// </summary>
        /// <param name="name">The name of the command used by the compiler.</param>
        /// <param name="reference">A deligate reference to the command.</param>
        /// <param name="minArgs">The minimum number of arguments allowed.</param>
        /// <param name="maxArgs">The Maximum number of arguments allowed.</param>
        internal Command(string name, CmdRef3 reference, int var = 0, int minArgs = 3, int maxArgs = 3)
        {
            // Store the command refererence.
            this.reference = reference;
            reftype = RefType.CmdRef3;

            // Store the properties.
            Name = name;
            MinArgs = minArgs;
            MaxArgs = maxArgs;
            Var = var;
        }

        /// <summary>
        /// Invoke the command referance if it has been defined.
        /// </summary>
        /// <param name="script">The parent script for use by the command.</param>
        /// <param name="param">An array of paramaters for use by the command.</param>
        internal void Invoke(TWS script, params Param[] param)
        {
            // Invoke the command referance based on the RefType.
            switch (reftype)
            {
                case RefType.CmdRef:
                    ((CmdRef)reference).Invoke(script, param);
                    break;

                case RefType.CmdRef1:
                    ((CmdRef1)reference).Invoke(param[0]);
                    break;

                case RefType.CmdRef2:
                    ((CmdRef2)reference).Invoke(param[0], param[1]);
                    break;

                case RefType.CmdRef3:
                    ((CmdRef3)reference).Invoke(param[0], param[1], param[2]);
                    break;

                default:
                    // If the reference is null, the command has not been implimented.
                    Debug.Write($"Error: Command \"{Name}\" not implimented.\n");
                    throw new System.Exception("Error: Command \"{Name}\" not implimented.");
            }
        }
    }
}
