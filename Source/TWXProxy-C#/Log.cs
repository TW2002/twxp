using System;
using System.IO;
using System.Windows.Forms;
using Core;
using Global;
using Ansi;
using Utility;
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
 // This unit is responsible for logging data recieved from the server.
namespace Log
{
    public struct TLogEntry
    {
        public uint Timestamp;
        public ushort EntrySize;
        public byte Entry;
    } // end TLogEntry

    public class TModLog: TTWXModule, IModLog, ITWXGlobals
    {
        protected Timer LogTimer
        {
          get {
            return GetLogTimer();
          }
        }
        public string LogFilename
        {
          get {
            return FLogFilename;
          }
        }
        public bool LogFileOpen
        {
          get {
            return FLogFileOpen;
          }
        }
        public bool PlayingLog
        {
          get {
            return FPlayingLog;
          }
        }
        public bool BinaryLogs
        {
          get {
            return GetBinaryLogs();
          }
          set {
            SetBinaryLogs(value);
          }
        }
        public bool LogANSI
        {
          get {
            return GetLogANSI();
          }
          set {
            SetLogANSI(value);
          }
        }
        public bool LogData
        {
          get {
            return GetLogData();
          }
          set {
            SetLogData(value);
          }
        }
        public uint MaxPlayDelay
        {
          get {
            return FMaxPlayDelay;
          }
          set {
            FMaxPlayDelay = value;
          }
        }
        public bool NotifyPlayCuts
        {
          get {
            return FNotifyPlayCuts;
          }
          set {
            FNotifyPlayCuts = value;
          }
        }
        private string FProgramDir = String.Empty;
        private string FLogFilename = String.Empty;
        private bool FLogFileOpen = false;
        private System.IO.File FLogFile = null;
        private System.IO.File FPlayLogFile = null;
        private DateTime FLastLog;
        private bool FLogData = false;
        private bool FLogANSI = false;
        private bool FBinaryLogs = false;
        private bool FPlayingLog = false;
        private Timer FLogTimer = null;
        private TLogEntry FNextLogEntry = null;
        // pointer to next log entry to be played
        private uint FLastPlayTime = 0;
        private uint FMaxPlayDelay = 0;
        private bool FNotifyPlayCuts = false;
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner, APersistenceController)
        {
        }
        public override void AfterConstruction()
        {
            base.AfterConstruction();
            // set defaults
            FNotifyPlayCuts = true;
            FMaxPlayDelay = 10000;
        }

        public override void BeforeDestruction()
        {
            // ensure log file is closed
            CloseLog();
            //@ Unsupported property or method(C): 'Free'
            FLogTimer.Free;
            if ((FNextLogEntry != null))
            {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(FNextLogEntry);
            }
            base.BeforeDestruction();
        }

        private void LogTimerTimer(Object Sender)
        {
            string Text;
            // show the cached entry, then cache the next one
            //@ Unsupported function or procedure: 'SetString'
            SetString(Text, ((FNextLogEntry.Entry) as string), FNextLogEntry.EntrySize);
            Global.Units.Global.TWXServer.Broadcast(Text);
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(FNextLogEntry);
            FNextLogEntry = GetNextLogEntry();
        }

        private TLogEntry GetNextLogEntry()
        {
            TLogEntry result;
            object Buf;
            uint X;
            if ((FPlayLogFile.BaseStream.Position + sizeof(TLogEntry) >= FPlayLogFile.BaseStream.Length))
            {
                // At end of log file
                EndPlayLog();
                result = null;
            }
            else
            {
                // Read the entry header
                //@ Unsupported function or procedure: 'AllocMem'
                result = AllocMem(sizeof(TLogEntry));
                //@ Unsupported function or procedure: 'BlockRead'
                BlockRead(FPlayLogFile, result, sizeof(TLogEntry) - 1);
                // Read the rest of the entry now that we know its size
                if ((result.EntrySize == 0))
                {
                    // This is a dud frame.  Skip straight to the next record
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(result);
                    result = result;
                    LogTimer.Interval = 1;
                }
                else
                {
                    //@ Unsupported function or procedure: 'ReAllocMem'
                    ReAllocMem(result, sizeof(TLogEntry) + result.EntrySize - 1);
                    Buf = (result + sizeof(TLogEntry) - 1 as object);
                    //@ Unsupported function or procedure: 'BlockRead'
                    BlockRead(FPlayLogFile, Buf, result.EntrySize);
                    // Set the timer to play it
                    if ((FLastPlayTime == 0))
                    {
                        LogTimer.Interval = 1;
                    }
                    else
                    {
                        if ((FLastPlayTime == result.Timestamp))
                        {
                            X = 1;
                        }
                        else if ((FLastPlayTime > result.Timestamp))
                        {
                            //@ Unsupported function: 'High'
                            X = result.Timestamp + (High(X) - FLastPlayTime);
                        }
                        else
                        {
                            X = result.Timestamp - FLastPlayTime;
                        }
                        if ((X > MaxPlayDelay))
                        {
                            LogTimer.Interval = 5000;
                            if (NotifyPlayCuts)
                            {
                                Global.Units.Global.TWXServer.ClientMessage("PLAYBACK: Long delay of " + (X / 1000).ToString() + "s cut to 5s");
                            }
                        }
                        else
                        {
                            LogTimer.Interval = X;
                        }
                    }
                    FLastPlayTime = result.Timestamp;
                }
                LogTimer.Enabled = true;
            }
            return result;
        }

        public void BeginPlayLog(string Filename)
        {
            if (PlayingLog)
            {
                return;
            }
            Environment.CurrentDirectory = FProgramDir;
            FPlayLogFile = new FileInfo(Filename);
            StreamReader _R_2 = FPlayLogFile.OpenText();
            //@ Unsupported function or procedure: 'IOResult'
            if ((IOResult != 0))
            {
                Global.Units.Global.TWXServer.ClientMessage("Unable to open capture file \'" + LogFilename + "\' for play.");
            }
            else
            {
                Global.Units.Global.TWXServer.ClientMessage("Beginning playback of capture file: " + Ansi.Units.Ansi.ANSI_7 + Filename + Core.Units.Core.endl + Ansi.Units.Ansi.ANSI_15 + "Press any key to terminate.");
                FPlayingLog = true;
                if ((FNextLogEntry != null))
                {
                    //@ Unsupported function or procedure: 'FreeMem'
                    FreeMem(FNextLogEntry);
                }
                FNextLogEntry = GetNextLogEntry();
            // starts log timer
            }
        }

        public void EndPlayLog()
        {
            if (FPlayingLog)
            {
                FPlayingLog = false;
                FLastPlayTime = 0;
                LogTimer.Enabled = false;
                _R_2.Close();
                Global.Units.Global.TWXServer.ClientMessage("Playback of capture file completed.");
            }
        }

        private string GetLogName()
        {
            string result;
            result = "logs\\" + (DateTime.Today).ToString() + ' ' + Utility.Units.Utility.StripFileExtension(Utility.Units.Utility.ShortFilename(Global.Units.Global.TWXDatabase.DatabaseName));
            Utility.Units.Utility.Replace(ref result, '/', '-');
            Utility.Units.Utility.Replace(ref result, ':', '-');
            if (FBinaryLogs)
            {
                result = result + ".cap";
            }
            else
            {
                result = result + ".log";
            }
            return result;
        }

        private Timer GetLogTimer()
        {
            Timer result;
            if (!(FLogTimer != null))
            {
                FLogTimer = new Timer(this);
                FLogTimer.Tick = LogTimerTimer;
                FLogTimer.Interval = 1;
                FLogTimer.Enabled = false;
            }
            result = FLogTimer;
            return result;
        }

        private void OpenLog(string Filename)
        {
            if (LogFileOpen || !(Global.Units.Global.TWXDatabase.DataBaseOpen))
            {
                return;
            }
            Environment.CurrentDirectory = FProgramDir;
            FLogFilename = Filename;
            FLogFile = new FileInfo(LogFilename);
            StreamReader _R_3 = FLogFile.OpenText();
            //@ Unsupported function or procedure: 'IOResult'
            if ((IOResult != 0))
            {
                StreamWriter _W_1 = FLogFile.CreateText();
            }
            //@ Unsupported function or procedure: 'IOResult'
            if ((IOResult != 0))
            {
                MessageBox.Show("Unable to open log file - logging has been disabled." + Core.Units.Core.endl + "File: " + LogFilename);
                LogData = false;
            }
            else
            {
                FLogFileOpen = true;
                FLastLog = DateTime.Now;
            }
        }

        private void CloseLog()
        {
            if (!LogFileOpen)
            {
                return;
            }
            _W_1.Close();
            FLogFileOpen = false;
        }

        private void LogBinary(string Data)
        {
            TLogEntry LogEntry;
            int Size;
            // log timestamp along with packet
            Size = sizeof(TLogEntry) + Data.Length - 1;
            //@ Unsupported function or procedure: 'AllocMem'
            LogEntry = AllocMem(Size);
            //@ Unsupported function or procedure: 'GetTickCount'
            LogEntry.Timestamp = GetTickCount;
            LogEntry.EntrySize = Data.Length;
            //@ Undeclared identifier(3): 'CopyMemory'
            CopyMemory((LogEntry.Entry), (Data as object), Data.Length);
            //@ Unsupported function or procedure: 'BlockWrite'
            BlockWrite(FLogFile, LogEntry, Size);
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(LogEntry);
        }

        public void DoLogData(string Data, string ANSIData)
        {
            int I;
            if (LogData && LogFileOpen)
            {
                if (!(Global.Units.Global.TWXInterpreter.LogData))
                {
                    return;
                }
                if ((Convert.ToInt64(DateTime.Now) != Convert.ToInt64(FLastLog)))
                {
                    // next day - open the next log
                    CloseLog();
                    OpenLog(GetLogName());
                }
                _R_3.BaseStream.Seek(_W_1.BaseStream.Length, SeekOrigin.Begin);
                if (FBinaryLogs)
                {
                    if (LogANSI)
                    {
                        LogBinary(ANSIData);
                    }
                    else
                    {
                        LogBinary(Data);
                    }
                }
                else
                {
                    if (LogANSI)
                    {
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(FLogFile, (ANSIData as string), ANSIData.Length, I);
                    }
                    else
                    {
                        //@ Unsupported function or procedure: 'BlockWrite'
                        BlockWrite(FLogFile, (Data as string), Data.Length, I);
                    }
                }
                //@ Unsupported function or procedure: 'IOResult'
                if ((IOResult != 0))
                {
                    MessageBox.Show("TWX Proxy has encountered an error logging data sent from the server.  " + Core.Units.Core.endl + "This could be due to insufficient disk space or the log file is in use.  Logging has been disabled.");
                    LogData = false;
                }
            }
        }

        public void DatabaseChanged()
        {
            string Filename;
            if (LogData)
            {
                Filename = GetLogName();
                if ((Filename != FLogFilename))
                {
                    CloseLog();
                    OpenLog(Filename);
                }
            }
        }

        // IModLog
        protected bool GetLogData()
        {
            bool result;
            result = FLogData;
            return result;
        }

        protected void SetLogData(bool Value)
        {
            if ((FLogData != Value))
            {
                FLogData = Value;
                if (Value)
                {
                    OpenLog(GetLogName());
                }
                else
                {
                    CloseLog();
                }
            }
        }

        protected bool GetLogANSI()
        {
            bool result;
            result = FLogANSI;
            return result;
        }

        protected void SetLogANSI(bool Value)
        {
            FLogANSI = Value;
        }

        protected bool GetBinaryLogs()
        {
            bool result;
            result = FBinaryLogs;
            return result;
        }

        protected void SetBinaryLogs(bool Value)
        {
            FBinaryLogs = Value;
        }

        // ITWXGlobals
        protected void SetProgramDir(string Value)
        {
            FProgramDir = Value;
        }

        protected string GetProgramDir()
        {
            string result;
            result = FProgramDir;
            return result;
        }

    } // end TModLog

}

