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
using System.IO;

namespace TWXProxy.Core
{
    public static class Constants
    {
        public const string ProductName = "twxproxy";
        public const string DisplayVersion = "3.0 beta5";
        public const string ProductDisplayName = "twxproxy 3.0 beta5";
        public const string ProgramVersion = "3.0.0";
        public const int ReleaseNumber = 5;
        public const string ReleaseVersion = "beta5";
        public const string SetupFile = "TWX26.dat";
        public const string EndLine = "\r\n";
    }

    public enum HistoryType
    {
        Fighter,
        Computer,
        Msg
    }

    public delegate void NotificationEventHandler(object param);

    // IPersistenceController: Implemented on an object able to manage the persistence
    // of other objects.
    public interface IPersistenceController
    {
        void RegisterModule(TWXModule module);
        void UnregisterModule(TWXModule module);
    }

    // TWXModule: Superclass for all TWX Proxy modules
    public abstract class TWXModule : IDisposable
    {
        private IPersistenceController? _persistenceController;

        protected TWXModule(IPersistenceController? persistenceController = null)
        {
            _persistenceController = persistenceController;
            _persistenceController?.RegisterModule(this);
        }

        protected void WriteToStream(Stream stream, string value)
        {
            using (var writer = new StreamWriter(stream, System.Text.Encoding.UTF8, 1024, true))
            {
                writer.Write(value);
            }
        }

        protected string ReadFromStream(Stream stream)
        {
            using (var reader = new StreamReader(stream, System.Text.Encoding.UTF8, false, 1024, true))
            {
                return reader.ReadToEnd();
            }
        }

        public virtual void GetStateValues(Stream values)
        {
        }

        public virtual void SetStateValues(Stream values)
        {
        }

        public virtual void StateValuesLoaded()
        {
        }

        public virtual void Dispose()
        {
            _persistenceController?.UnregisterModule(this);
        }
    }

    public interface ITWXGlobals
    {
        string ProgramDir { get; set; }
    }

    public interface IMessageListener
    {
        void AcceptMessage(object param);
    }

    // These interface were originally intended to provide abstraction between
    // the major program modules.  Unfortunately this abstraction was never
    // completed.  Many of them stand unused.

    public interface IModDatabase
    {
        string DatabaseName { get; set; }
        bool UseCache { get; set; }
        bool Recording { get; set; }
    }

    public interface IModExtractor
    {
        char MenuKey { get; set; }
    }

    public interface IModGUI
    {
        void ShowWarning(string warningText);
        void SetSelectedGame(string value);
        string GetSelectedGame();
        void SetToProgramDir();
        string SelectedGame { get; set; }
    }

    public interface IModServer
    {
        bool AllowLerkers { get; set; }
        bool AcceptExternal { get; set; }
        string ExternalAddress { get; set; }
        bool BroadCastMsgs { get; set; }
        bool LocalEcho { get; set; }
    }

    public interface IModClient
    {
        bool Reconnect { get; set; }
    }

    public interface IModMenu
    {
    }

    public interface IModInterpreter
    {
    }

    public interface IModCompiler
    {
    }

    public interface IModLog
    {
        bool LogEnabled { get; set; }
        bool LogData { get; set; }
        bool LogANSI { get; set; }
        bool LogAnsiCompanion { get; set; }
        bool BinaryLogs { get; set; }
        bool NotifyPlayCuts { get; set; }
        int MaxPlayDelay { get; set; }
        bool PlayingLog { get; }
        object? ScriptLoggingScope { get; set; }
        void SetScriptLoggingEnabled(object source, bool enabled);
        void ClearScriptLoggingOverride(object source);
    }

    public interface IModAuth
    {
        bool Authenticate { get; set; }
        string UserName { get; set; }
        string UserReg { get; set; }
        bool UseAuthProxy { get; set; }
        string ProxyAddress { get; set; }
        ushort ProxyPort { get; set; }
    }

    public interface IModBubble
    {
        int MaxBubbleSize { get; set; }
    }

    public enum ExploreType
    {
        No = 0,
        Calc = 1,
        Density = 2,
        Yes = 3
    }

    /// <summary>
    /// Sector data structure
    /// </summary>
    public class Sector
    {
        public int[] Warp { get; set; } = new int[6];
        public ExploreType Explored { get; set; } = ExploreType.No;
        public string SectorName { get; set; } = string.Empty;
        public int Ports { get; set; }
        public int Planets { get; set; }
        public int Traders { get; set; }
        public int Ships { get; set; }
        public int Mines { get; set; }
        public int Fighters { get; set; }
        public int FigOwner { get; set; }
        public int NavHaz { get; set; }
        public bool Anomaly { get; set; }
        public int Constellation { get; set; }
        public int Beacon { get; set; }
        public int Density { get; set; }
    }

    /// <summary>
    /// Interface for game database operations
    /// </summary>
    public interface ITWXDatabase : IModDatabase
    {
        int SectorCount { get; }
        Sector? LoadSector(int sectorNumber);
        List<int> GetBackDoors(Sector sector, int sectorNumber);
        void ResetSectors();
    }

    /// <summary>
    /// Client type enumeration
    /// </summary>
    public enum ClientType
    {
        Standard = 0,
        Deaf = 1,
        Rejected = 2,
        Mute = 3,
        Stream = 4
    }

    /// <summary>
    /// Bot configuration - represents a persistent background script
    /// </summary>
    public class BotConfig
    {
        public string Alias { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ScriptFile { get; set; } = string.Empty;
        public List<string> ScriptFiles { get; set; } = new List<string>();
        public string Description { get; set; } = string.Empty;
        public bool AutoStart { get; set; } = true;
        public string NameVar { get; set; } = string.Empty;
        public string CommsVar { get; set; } = string.Empty;
        public string LoginScript { get; set; } = string.Empty;
        public string Theme { get; set; } = string.Empty;
        public Dictionary<string, string> Properties { get; set; } = new Dictionary<string, string>();
    }

    /// <summary>
    /// Interface for server operations
    /// </summary>
    public interface ITWXServer : IModServer
    {
        void Broadcast(string message);
        void Broadcast(string message, bool broadcastDeaf);
        void BroadcastLiteral(string message);
        void BroadcastLiteral(string message, bool broadcastDeaf);
        void ClientMessage(string message);
        void AddQuickText(string key, string value);
        void ClearQuickText(string? key = null);
        int ClientCount { get; }
        ClientType GetClientType(int index);
        void SetClientType(int index, ClientType type);

        // Bot management
        void RegisterBot(string botName, string scriptFile, string description = "");
        void UnregisterBot(string botName);
        List<string> GetBotList();
        BotConfig? GetBotConfig(string botName);
        string ActiveBotName { get; set; }
        object? GetActiveBot();
    }
}
