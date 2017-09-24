using System;
using System.ComponentModel;
using System.IO;
using System.Windows.Forms;
using Persistence;
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
namespace Core
{
    // TTWXModule: Superclass for all TWX Proxy modules
    public class TTWXModule: Component, 
    {
        private IPersistenceController PersistenceController = null;
        //Constructor  Create( AOwner,  APersistenceController)
        public TTWXModule(object AOwner, IPersistenceController APersistenceController) : base(AOwner)
        {
            if ((APersistenceController != null))
            {
                // register us with persistence controller
                PersistenceController = APersistenceController;
                PersistenceController.RegisterModule(this);
            }
        }
        public TTWXModule(object AOwner)
           : this(AOwner, null)
        {
        }

        //@ Destructor  Destroy()
        ~TTWXModule()
        {
            if ((PersistenceController != null))
            {
                // unregister us with persistence controller
                PersistenceController.UnregisterModule(this);
            }
            //@ Unsupported property or method(D): 'Destroy'
            base.Destroy;
        }
        protected void WriteToStream(Stream Stream, string Value)
        {
            int Len;
            Len = Value.Length;
            Stream.WriteByte(Len, 4);
            Stream.WriteByte((Value as string), Len);
        }

        protected string ReadFromStream(Stream Stream)
        {
            string result;
            int Len;
            string Buf;
            Stream.ReadByte(Len, 4);
            //@ Unsupported function or procedure: 'AllocMem'
            Buf = AllocMem(Len + 1);
            try {
                Stream.ReadByte(Buf, Len);
                //@ Unsupported function or procedure: 'SetString'
                SetString(result, Buf, Len);
            } finally {
                //@ Unsupported function or procedure: 'FreeMem'
                FreeMem(Buf);
            }
            return result;
        }

        public virtual void GetStateValues(Stream Values)
        {
            //@ Unsupported property or method(A): 'WriteComponent'
            Values.WriteComponent(this);
        }

        public virtual void SetStateValues(Stream Values)
        {
            //@ Unsupported property or method(A): 'ReadComponent'
            Values.ReadComponent(this);
        }

        public virtual void StateValuesLoaded()
        {
            // can be overridden in decending classes

        }

    } // end TTWXModule

    // IPersistenceController: Implemented on an object able to manage the persistence
    // of other objects.
    public interface IPersistenceController
    {
        void RegisterModule(TTWXModule Module);
        void UnregisterModule(TTWXModule Module);
    } // end IPersistenceController

    public interface ITWXGlobals
    {
        string ProgramDir {
          get;
          set;
        }
    } // end ITWXGlobals

    public interface IMessageListener
    {
        void AcceptMessage(object Param);
    } // end IMessageListener

    // These interface were originally intended to provide abstraction between
    // the major program modules.  Unfortunately this abstraction was never
    // completed.  Many of them stand unused.
    public interface IModDatabase
    {
        string DatabaseName {
          get;
          set;
        }
        bool UseCache {
          get;
          set;
        }
        bool Recording {
          get;
          set;
        }
    } // end IModDatabase

    public interface IModExtractor
    {
        char MenuKey {
          get;
          set;
        }
    } // end IModExtractor

    public interface IModGUI
    {
        string SelectedGame {
          get;
          set;
        }
        void ShowWarning(string WarningText);
        void SetToProgramDir();
    } // end IModGUI

    public interface IModServer
    {
        // procedure Activate; // EP - SetListenPort no longer activates the server
        bool LocalEcho {
          get;
          set;
        }
        // property ListenPort: Word read GetListenPort write SetListenPort;
        bool AcceptExternal {
          get;
          set;
        }
        bool BroadCastMsgs {
          get;
          set;
        }
    } // end IModServer

    public interface IModClient
    {
        bool Reconnect {
          get;
          set;
        }
    } // end IModClient

    public interface IModMenu
    {
    } // end IModMenu

    public interface IModInterpreter
    {
    } // end IModInterpreter

    public interface IModCompiler
    {
    } // end IModCompiler

    public interface IModLog
    {
        bool LogData {
          get;
          set;
        }
        bool LogANSI {
          get;
          set;
        }
    } // end IModLog

    public interface IModAuth
    {
        bool Authenticate {
          get;
          set;
        }
        string UserName {
          get;
          set;
        }
        string UserReg {
          get;
          set;
        }
        bool UseAuthProxy {
          get;
          set;
        }
        string ProxyAddress {
          get;
          set;
        }
        ushort ProxyPort {
          get;
          set;
        }
    } // end IModAuth

    public interface IModBubble
    {
        int MaxBubbleSize {
          get;
          set;
        }
    } // end IModBubble

    public enum THistoryType
    {
        htFighter,
        htComputer,
        htMsg
    } // end THistoryType

    public delegate void TNotificationEvent(object Param);
}

namespace Core.Units
{
    public class Core
    {
        // Used by all modules.
        public const string ProgramVersion = "2.05.73";
        public const string ReleaseVersion = "Beta Version";
        public const string SetupFile = "TWXSetup.dat";
        public const char endl = '\r' + '\n';
        public static void PostNotification(object __Event, object Param)
        {
            TNotificationEvent PEvent;
            PEvent = new TNotificationEvent();
            //@ Undeclared identifier(3): 'CopyMemory'
            CopyMemory(PEvent, __Event, sizeof(TNotificationEvent));
            //@ Unsupported property or method(C): 'Handle'
            //@ Undeclared identifier(3): 'WM_USER'
            //@ Unsupported function or procedure: 'PostMessage'
            PostMessage(Application.Handle, WM_USER, (int)PEvent, (int)Param);
        }

    } // end Core

}

