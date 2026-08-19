/*
Copyright (C) 2026  Matt Mosley

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
*/

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TWXProxy.Core
{
    /// <summary>
    /// Menu state for the client menu system
    /// </summary>
    public enum MenuState
    {
        None,
        Main,
        Data,
        Port,
        Script,
        Setup,
        Database,
        DataTransfer,
        Extensions
    }

    /// <summary>
    /// Input collection mode for multi-character input
    /// </summary>
    public enum InputMode
    {
        None,
        ScriptLoad,
        ScriptUnload,
        ScriptPause,
        ScriptResume,
        ScriptKill,
        ScriptDumpVars,
        BurstInput,
        BurstEdit,
        CommandHelp,
        DataResetConfirm,
        DataShowSector,
        DataShowDensityLow,
        DataShowDensityHigh,
        DataPlotCourseFrom,
        DataPlotCourseTo,
        DataHoloscan,
        DataShowBubbleGate,
        DataShowBubbleInterior,
        DataShowBackdoors,
        DataExportWarpsPath,
        DataImportWarpsPath,
        DataExportBubblesPath,
        DataExportDeadendsPath,
        DataExportTwxPath,
        DataImportTwxPath,
        DataImportTwxKeepRecent,
        PortShowPort,
        SetupListenPort,
        SetupBubbleSize,
        SetupMenuKey,
        DatabaseCreateName,
        DatabaseCreateSize,
        DatabaseEditName,
        DatabaseEditAddress,
        DatabaseEditPort,
        DatabaseEditUseLogin,
        DatabaseEditLoginScript,
        DatabaseEditLoginName,
        DatabaseEditLoginPassword,
        DatabaseEditGameLetter,
        DatabaseDeleteName,
        DatabaseSelectName,
        DatabaseViewName
    }

    /// <summary>
    /// Handles the client menu system (matches Pascal TWX Proxy behavior)
    /// </summary>
    public class MenuHandler
    {
        private readonly GameInstance _gameInstance;
        private readonly ModInterpreter? _interpreter;
        private readonly string _scriptDirectory;
        private readonly Func<int>? _currentClientIndexProvider;
        private MenuState _currentMenu = MenuState.None;
        private InputMode _inputMode = InputMode.None;
        private readonly StringBuilder _inputBuffer = new();
        private string _lastBurst = string.Empty;
        private string _lastScript = string.Empty;
        private bool _skipNextLineFeed;
        private int _pendingNumber;
        private int _dataTransferOperationRunning;
        private readonly List<string> _workflowArgs = new();
        private string _extensionMenuPath = string.Empty;

        public MenuHandler(GameInstance gameInstance, ModInterpreter? interpreter = null, string? scriptDirectory = null, Func<int>? currentClientIndexProvider = null)
        {
            _gameInstance = gameInstance;
            _interpreter = interpreter;
            _currentClientIndexProvider = currentClientIndexProvider;

            string baseDir = OperatingSystem.IsWindows()
                ? WindowsInstallInfo.GetInstalledProgramDirOrDefault()
                : AppContext.BaseDirectory;
            if (string.IsNullOrWhiteSpace(baseDir))
                baseDir = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);

            _scriptDirectory = scriptDirectory ?? Path.Combine(baseDir, "scripts");
        }

        private int CurrentClientIndex => Math.Max(0, _currentClientIndexProvider?.Invoke() ?? 0);

        public MenuState CurrentMenu => _currentMenu;
        public InputMode CurrentInputMode => _inputMode;
        public bool IsActive => _currentMenu != MenuState.None || _inputMode != InputMode.None;

        public async Task ExitMenuAsync()
        {
            using var _ = _gameInstance.PushClientContext(CurrentClientIndex);
            _currentMenu = MenuState.None;
            _inputMode = InputMode.None;
            _inputBuffer.Clear();
            _workflowArgs.Clear();
            _extensionMenuPath = string.Empty;
            _pendingNumber = 0;
            _skipNextLineFeed = false;

            string currentAnsiLine = _gameInstance.IsConnected ? ScriptRef.GetCurrentAnsiLine() : string.Empty;
            string exitText = "\r" + AnsiCodes.ANSI_CLEARLINE;

            if (!string.IsNullOrEmpty(currentAnsiLine))
                exitText += currentAnsiLine;

            await _gameInstance.SendMessageAsync(exitText);
            _interpreter?.ResumeAfterMenuInterrupt();
        }

        public async Task<bool> HandleMenuCommandAsync(char command)
        {
            using var _ = _gameInstance.PushClientContext(CurrentClientIndex);
            if (command < 32 && command != '\r')
                return true;

            if (_currentMenu == MenuState.None)
            {
                _interpreter?.PauseForMenuInterrupt();
                _currentMenu = MenuState.Main;
                await _gameInstance.SendMessageAsync("\r\n");
                await ShowMenuPromptAsync();
                return true;
            }

            switch (_currentMenu)
            {
                case MenuState.Main:
                    return await HandleMainMenuAsync(command);
                case MenuState.Data:
                    return await HandleDataMenuAsync(command);
                case MenuState.Port:
                    return await HandlePortMenuAsync(command);
                case MenuState.Script:
                    return await HandleScriptMenuAsync(command);
                case MenuState.Setup:
                    return await HandleSetupMenuAsync(command);
                case MenuState.Database:
                    return await HandleDatabaseMenuAsync(command);
                case MenuState.DataTransfer:
                    return await HandleDataTransferMenuAsync(command);
                case MenuState.Extensions:
                    return await HandleExtensionMenuAsync(command);
                default:
                    return false;
            }
        }

        private async Task<bool> HandleMainMenuAsync(char command)
        {
            switch (char.ToUpperInvariant(command))
            {
                case '?':
                    await ShowMainMenuHelpAsync();
                    return true;
                case '+':
                    await PromptForCommandHelpAsync();
                    return true;
                case 'Q':
                    await ExitMenuAsync();
                    return true;
                case '-':
                    await ShowAllClientsAsync();
                    return true;
                case '/':
                    {
                        int clientIndex = CurrentClientIndex;
                        _gameInstance.SetClientType(clientIndex, ClientType.Stream);
                        await _gameInstance.SendMessageAsync($"\r\nClient {clientIndex} is now in Streaming Mode.\r\n");
                        await ShowMenuPromptAsync();
                        return true;
                    }
                case '=':
                    {
                        int clientIndex = CurrentClientIndex;
                        ClientType nextType = _gameInstance.GetClientType(clientIndex) == ClientType.Standard
                            ? ClientType.Deaf
                            : ClientType.Standard;
                        _gameInstance.SetClientType(clientIndex, nextType);
                        await _gameInstance.SendMessageAsync($"\r\nClient {clientIndex} is {(nextType == ClientType.Deaf ? "now deaf" : "no longer deaf")}.\r\n");
                        await ShowMenuPromptAsync();
                        return true;
                    }
                case 'B':
                    await EnterInputModeAsync("\r\nEnter text to burst: ", InputMode.BurstInput);
                    return true;
                case 'C':
                    await ConnectDisconnectAsync();
                    return true;
                case 'D':
                    _currentMenu = MenuState.Data;
                    await ShowDataMenuAsync();
                    return true;
                case 'E':
                    await EditSendLastBurstAsync();
                    return true;
                case 'H':
                    await ToggleNativeHaggleAsync();
                    return true;
                case 'M':
                    if (_gameInstance.HasProxyMenuPath("M"))
                    {
                        _currentMenu = MenuState.Extensions;
                        _extensionMenuPath = "M";
                        await ShowExtensionMenuAsync();
                        return true;
                    }
                    break;
                case 'P':
                    _currentMenu = MenuState.Port;
                    await ShowPortMenuAsync();
                    return true;
                case 'R':
                    await RepeatLastBurstAsync();
                    return true;
                case 'S':
                    _currentMenu = MenuState.Script;
                    await ShowScriptMenuAsync();
                    return true;
                case 'T':
                    _currentMenu = MenuState.Setup;
                    await ShowSetupMenuAsync();
                    return true;
                case 'X':
                    await ExitProgramAsync();
                    return true;
                case 'Z':
                    await StopAllScriptsAsync();
                    return true;
            }

            await _gameInstance.SendMessageAsync($"\r\nUnknown command '{command}'. Press ? for help.\r\n");
            await ShowMenuPromptAsync();
            return true;
        }

        private async Task<bool> HandleExtensionMenuAsync(char command)
        {
            char key = char.ToUpperInvariant(command);

            switch (key)
            {
                case '?':
                    await ShowExtensionMenuHelpAsync();
                    return true;
                case 'Q':
                    if (_extensionMenuPath.Length <= 1)
                    {
                        _currentMenu = MenuState.Main;
                        _extensionMenuPath = string.Empty;
                        await ShowMenuPromptAsync();
                    }
                    else
                    {
                        _extensionMenuPath = _extensionMenuPath[..^1];
                        await ShowExtensionMenuPromptAsync();
                    }
                    return true;
            }

            string nextPath = _extensionMenuPath + key;
            if (!_gameInstance.HasProxyMenuPath(nextPath))
            {
                await _gameInstance.SendMessageAsync($"\r\nUnknown command '{command}'. Press ? for help.\r\n");
                await ShowExtensionMenuPromptAsync();
                return true;
            }

            _extensionMenuPath = nextPath;
            ProxyMenuCommandResult? result = await _gameInstance.ExecuteProxyMenuCommandAsync(nextPath);
            if (result == ProxyMenuCommandResult.ExitMenu)
            {
                await ExitMenuAsync();
                return true;
            }

            await ShowExtensionMenuPromptAsync();
            return true;
        }

        private async Task<bool> HandleDataMenuAsync(char command)
        {
            switch (char.ToUpperInvariant(command))
            {
                case '?':
                    await ShowDataMenuHelpAsync();
                    return true;
                case '+':
                    await PromptForCommandHelpAsync();
                    return true;
                case 'Q':
                    _currentMenu = MenuState.Main;
                    await ShowMenuPromptAsync();
                    return true;
                case 'D':
                    await EnterInputModeAsync("\r\nEnter sector number: ", InputMode.DataShowSector);
                    return true;
                case 'F':
                    await ShowSectorsWithForeignFightersAsync();
                    return true;
                case 'M':
                    await ShowSectorsWithMinesAsync();
                    return true;
                case 'S':
                    await EnterInputModeAsync("\r\nEnter the lowest density to display: ", InputMode.DataShowDensityLow);
                    return true;
                case 'A':
                    await ShowAnomalySectorsAsync();
                    return true;
                case 'R':
                    await ShowTraderSectorsAsync();
                    return true;
                case 'C':
                    await EnterInputModeAsync("\r\nFrom: ", InputMode.DataPlotCourseFrom);
                    return true;
                case 'H':
                    await EnterInputModeAsync("\r\nEnter sector number: ", InputMode.DataHoloscan);
                    return true;
                case 'T':
                    await ShowScannedTotalsAsync();
                    return true;
                case 'B':
                    await ShowBubblesAsync();
                    return true;
                case 'Z':
                    await EnterInputModeAsync("\r\nEnter bubble gateway sector: ", InputMode.DataShowBubbleGate);
                    return true;
                case '-':
                    await EnterInputModeAsync("\r\nEnter sector number: ", InputMode.DataShowBackdoors);
                    return true;
                case 'X':
                    _currentMenu = MenuState.DataTransfer;
                    await ShowDataTransferMenuAsync();
                    return true;
                default:
                    await _gameInstance.SendMessageAsync($"\r\nUnknown command '{command}'. Press ? for help.\r\n");
                    await ShowDataMenuPromptAsync();
                    return true;
            }
        }

        private async Task<bool> HandleDataTransferMenuAsync(char command)
        {
            switch (char.ToUpperInvariant(command))
            {
                case '?':
                    await ShowDataTransferMenuHelpAsync();
                    return true;
                case '+':
                    await PromptForCommandHelpAsync();
                    return true;
                case 'Q':
                    _currentMenu = MenuState.Data;
                    await ShowDataMenuPromptAsync();
                    return true;
                case 'E':
                    await EnterInputModeAsync(
                        $"\r\nExport warp data to [{DefaultWarpDataFileName()}]: ",
                        InputMode.DataExportWarpsPath);
                    return true;
                case 'I':
                    await EnterInputModeAsync(
                        $"\r\nImport warp data from [{DefaultWarpDataFileName()}]: ",
                        InputMode.DataImportWarpsPath);
                    return true;
                case 'B':
                    await EnterInputModeAsync(
                        $"\r\nExport bubble list to [{DefaultBubbleFileName()}]: ",
                        InputMode.DataExportBubblesPath);
                    return true;
                case 'D':
                    await EnterInputModeAsync(
                        $"\r\nExport deadend list to [{DefaultDeadendFileName()}]: ",
                        InputMode.DataExportDeadendsPath);
                    return true;
                case 'T':
                    await EnterInputModeAsync(
                        $"\r\nExport TWX file to [{DefaultTwxFileName()}]: ",
                        InputMode.DataExportTwxPath);
                    return true;
                case 'W':
                    await EnterInputModeAsync(
                        $"\r\nImport TWX file from [{DefaultTwxFileName()}]: ",
                        InputMode.DataImportTwxPath);
                    return true;
                default:
                    await _gameInstance.SendMessageAsync($"\r\nUnknown command '{command}'. Press ? for help.\r\n");
                    await ShowDataTransferMenuPromptAsync();
                    return true;
            }
        }

        private async Task<bool> HandlePortMenuAsync(char command)
        {
            switch (char.ToUpperInvariant(command))
            {
                case '?':
                    await ShowPortMenuHelpAsync();
                    return true;
                case '+':
                    await PromptForCommandHelpAsync();
                    return true;
                case 'Q':
                    _currentMenu = MenuState.Main;
                    await ShowMenuPromptAsync();
                    return true;
                case 'D':
                    await EnterInputModeAsync("\r\nEnter sector number: ", InputMode.PortShowPort);
                    return true;
                case '0':
                    await ShowSpecialPortsAsync();
                    return true;
                case 'L':
                    await ListPortsAsync(false);
                    return true;
                case 'U':
                    await ListPortsAsync(true);
                    return true;
                default:
                    await _gameInstance.SendMessageAsync($"\r\nUnknown command '{command}'. Press ? for help.\r\n");
                    await ShowPortMenuPromptAsync();
                    return true;
            }
        }

        private async Task<bool> HandleScriptMenuAsync(char command)
        {
            switch (char.ToUpperInvariant(command))
            {
                case '?':
                    await ShowScriptMenuHelpAsync();
                    return true;
                case '+':
                    await PromptForCommandHelpAsync();
                    return true;
                case 'Q':
                    _currentMenu = MenuState.Main;
                    await ShowMenuPromptAsync();
                    return true;
                case 'S':
                    await EnterInputModeAsync("\r\nEnter script name to load: ", InputMode.ScriptLoad);
                    return true;
                case 'L':
                    await ReloadLastScriptAsync();
                    return true;
                case 'U':
                    await EnterInputModeAsync("\r\nEnter script name to unload: ", InputMode.ScriptUnload);
                    return true;
                case 'P':
                    await EnterInputModeAsync("\r\nEnter script name to pause: ", InputMode.ScriptPause);
                    return true;
                case 'R':
                    await EnterInputModeAsync("\r\nEnter script name to resume: ", InputMode.ScriptResume);
                    return true;
                case 'V':
                    await EnterInputModeAsync(
                        "\r\nEnter a full or partial variable name to search for (or blank to list them all): ",
                        InputMode.ScriptDumpVars);
                    return true;
                case 'T':
                    await DumpTriggersAsync();
                    return true;
                case 'Z':
                    await StopAllScriptsAsync();
                    return true;
                case 'X':
                    await ExitCurrentScriptAsync();
                    return true;
                case 'I':
                    await ListScriptsAsync();
                    return true;
                case 'D':
                    await ListScriptDirectoryAsync();
                    return true;
                case 'K':
                    await EnterInputModeAsync("\r\nKill> ", InputMode.ScriptKill);
                    return true;
                default:
                    await _gameInstance.SendMessageAsync($"\r\nUnknown command '{command}'. Press ? for help.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return true;
            }
        }

        private async Task<bool> HandleSetupMenuAsync(char command)
        {
            switch (char.ToUpperInvariant(command))
            {
                case '?':
                    await ShowSetupMenuHelpAsync();
                    return true;
                case '+':
                    await PromptForCommandHelpAsync();
                    return true;
                case 'Q':
                    _currentMenu = MenuState.Main;
                    await ShowMenuPromptAsync();
                    return true;
                case 'D':
                    _currentMenu = MenuState.Database;
                    await ShowDatabaseMenuAsync();
                    return true;
                case 'P':
                    await EnterInputModeAsync("\r\nEnter new listen port: ", InputMode.SetupListenPort);
                    return true;
                case 'B':
                    await EnterInputModeAsync("\r\nEnter new max bubble size: ", InputMode.SetupBubbleSize);
                    return true;
                case 'R':
                    _gameInstance.AutoReconnect = !_gameInstance.AutoReconnect;
                    await _gameInstance.SendMessageAsync(
                        $"\r\nAuto reconnect is now {FormatOnOff(_gameInstance.AutoReconnect)}.\r\n");
                    await ShowSetupMenuPromptAsync();
                    return true;
                case 'L':
                    _gameInstance.LogDataEnabled = !_gameInstance.LogDataEnabled;
                    await _gameInstance.SendMessageAsync(
                        $"\r\nLogging of data is now {FormatOnOff(_gameInstance.LogDataEnabled)}.\r\n");
                    await ShowSetupMenuPromptAsync();
                    return true;
                case 'A':
                    _gameInstance.LogAnsiEnabled = !_gameInstance.LogAnsiEnabled;
                    await _gameInstance.SendMessageAsync(
                        $"\r\nLogging of ANSI data is now {FormatOnOff(_gameInstance.LogAnsiEnabled)}.\r\n");
                    await ShowSetupMenuPromptAsync();
                    return true;
                case 'X':
                    _gameInstance.AcceptExternal = !_gameInstance.AcceptExternal;
                    await _gameInstance.SendMessageAsync(
                        $"\r\nAccept external connections is now {FormatOnOff(_gameInstance.AcceptExternal)}.\r\n");
                    await ShowSetupMenuPromptAsync();
                    return true;
                case 'C':
                    {
                        ModDatabase? db = GetCurrentDatabase();
                        if (db == null)
                        {
                            await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                        }
                        else
                        {
                            db.UseCache = !db.UseCache;
                            await _gameInstance.SendMessageAsync(
                                $"\r\nDatabase cache is now {FormatOnOff(db.UseCache)}.\r\n");
                        }

                        await ShowSetupMenuPromptAsync();
                        return true;
                    }
                case 'E':
                    {
                        ModDatabase? db = GetCurrentDatabase();
                        if (db == null)
                        {
                            await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                        }
                        else
                        {
                            db.Recording = !db.Recording;
                            await _gameInstance.SendMessageAsync(
                                $"\r\nData recording is now {FormatOnOff(db.Recording)}.\r\n");
                        }

                        await ShowSetupMenuPromptAsync();
                        return true;
                    }
                case 'K':
                    await EnterInputModeAsync("\r\nEnter new terminal menu key: ", InputMode.SetupMenuKey);
                    return true;
                case 'H':
                    _gameInstance.LocalEcho = !_gameInstance.LocalEcho;
                    await _gameInstance.SendMessageAsync(
                        $"\r\nLocal echo is now {FormatOnOff(_gameInstance.LocalEcho)}.\r\n");
                    await ShowSetupMenuPromptAsync();
                    return true;
                default:
                    await _gameInstance.SendMessageAsync($"\r\nUnknown command '{command}'. Press ? for help.\r\n");
                    await ShowSetupMenuPromptAsync();
                    return true;
            }
        }

        private async Task<bool> HandleDatabaseMenuAsync(char command)
        {
            switch (char.ToUpperInvariant(command))
            {
                case '?':
                    await ShowDatabaseMenuHelpAsync();
                    return true;
                case '+':
                    await PromptForCommandHelpAsync();
                    return true;
                case 'Q':
                    _currentMenu = MenuState.Setup;
                    await ShowSetupMenuPromptAsync();
                    return true;
                case 'C':
                    _workflowArgs.Clear();
                    await EnterInputModeAsync("\r\nEnter new database name: ", InputMode.DatabaseCreateName);
                    return true;
                case 'E':
                    await ShowDatabasesAsync();
                    _workflowArgs.Clear();
                    await EnterInputModeAsync("\r\nEnter database name: ", InputMode.DatabaseEditName);
                    return true;
                case 'D':
                    await ShowDatabasesAsync();
                    await EnterInputModeAsync("\r\nEnter database name: ", InputMode.DatabaseDeleteName);
                    return true;
                case 'S':
                    await ShowDatabasesAsync();
                    await EnterInputModeAsync("\r\nEnter database name: ", InputMode.DatabaseSelectName);
                    return true;
                case 'L':
                    await ShowDatabasesAsync();
                    await ShowDatabaseMenuPromptAsync();
                    return true;
                case 'V':
                    await ShowDatabasesAsync();
                    await EnterInputModeAsync("\r\nEnter database name: ", InputMode.DatabaseViewName);
                    return true;
                default:
                    await _gameInstance.SendMessageAsync($"\r\nUnknown command '{command}'. Press ? for help.\r\n");
                    await ShowDatabaseMenuPromptAsync();
                    return true;
            }
        }

        private async Task ShowMenuPromptAsync() => await _gameInstance.SendMessageAsync("Main> ");
        private async Task ShowDataMenuPromptAsync() => await _gameInstance.SendMessageAsync("Data> ");
        private async Task ShowDataTransferMenuPromptAsync() => await _gameInstance.SendMessageAsync("Data Transfer> ");
        private async Task ShowPortMenuPromptAsync() => await _gameInstance.SendMessageAsync("Port> ");
        private async Task ShowScriptMenuPromptAsync() => await _gameInstance.SendMessageAsync("Script> ");
        private async Task ShowSetupMenuPromptAsync() => await _gameInstance.SendMessageAsync("Setup> ");
        private async Task ShowDatabaseMenuPromptAsync() => await _gameInstance.SendMessageAsync("Database> ");
        private async Task ShowExtensionMenuPromptAsync() => await _gameInstance.SendMessageAsync(GetExtensionMenuPrompt());

        private async Task ShowCurrentMenuPromptAsync()
        {
            switch (_currentMenu)
            {
                case MenuState.Main:
                    await ShowMenuPromptAsync();
                    break;
                case MenuState.Data:
                    await ShowDataMenuPromptAsync();
                    break;
                case MenuState.DataTransfer:
                    await ShowDataTransferMenuPromptAsync();
                    break;
                case MenuState.Port:
                    await ShowPortMenuPromptAsync();
                    break;
                case MenuState.Script:
                    await ShowScriptMenuPromptAsync();
                    break;
                case MenuState.Setup:
                    await ShowSetupMenuPromptAsync();
                    break;
                case MenuState.Database:
                    await ShowDatabaseMenuPromptAsync();
                    break;
                case MenuState.Extensions:
                    await ShowExtensionMenuPromptAsync();
                    break;
            }
        }

        private async Task ShowMainMenuHelpAsync()
        {
            var help = new StringBuilder();
            help.Append("\r\nMain menu:\r\n");
            help.Append("  ? - Command list\r\n");
            help.Append("  + - Help on command\r\n");
            help.Append("  Q - Exit menu\r\n");
            help.Append("  - - Show all clients\r\n");
            help.Append("  / - Toggle streaming mode\r\n");
            help.Append("  = - Toggle deaf client\r\n");
            help.Append("  B - Send burst\r\n");
            help.Append("  C - Connect/Disconnect from server\r\n");
            help.Append("  D - Data menu\r\n");
            help.Append("  E - Edit/Send last burst\r\n");
            help.Append("  H - Toggle native haggle\r\n");
            if (_gameInstance.HasProxyMenuPath("M"))
                help.Append("  M - Module commands\r\n");
            help.Append("  P - Port menu\r\n");
            help.Append("  R - Repeat last burst\r\n");
            help.Append("  S - Script menu\r\n");
            help.Append("  T - Setup menu\r\n");
            help.Append("  X - Exit Program\r\n");
            help.Append("  Z - Stop all scripts\r\n\r\n");
            await _gameInstance.SendMessageAsync(help.ToString());
            await ShowMenuPromptAsync();
        }

        private async Task ShowExtensionMenuAsync()
        {
            await _gameInstance.SendMessageAsync("\r\nModule commands - Press ? for help\r\n");
            await ShowExtensionMenuPromptAsync();
        }

        private async Task ShowExtensionMenuHelpAsync()
        {
            var help = new StringBuilder();
            help.Append($"\r\n{GetExtensionMenuTitle()}:\r\n");
            help.Append("  ? - Command list\r\n");
            help.Append("  Q - Return\r\n");

            foreach (ProxyMenuCommand command in _gameInstance.GetProxyMenuChildCommands(_extensionMenuPath))
            {
                char key = command.Path[^1];
                help.Append("  ");
                help.Append(key);
                help.Append(" - ");
                help.Append(command.Description);
                help.Append("\r\n");
            }

            help.Append("\r\n");
            await _gameInstance.SendMessageAsync(help.ToString());
            await ShowExtensionMenuPromptAsync();
        }

        private string GetExtensionMenuPrompt()
        {
            if (string.Equals(_extensionMenuPath, "M", StringComparison.OrdinalIgnoreCase))
                return "Modules> ";

            string description = _gameInstance.GetProxyMenuCommandDescription(_extensionMenuPath);
            return string.IsNullOrWhiteSpace(description) ? "Modules> " : $"{description}> ";
        }

        private string GetExtensionMenuTitle()
        {
            if (string.Equals(_extensionMenuPath, "M", StringComparison.OrdinalIgnoreCase))
                return "Module commands";

            string description = _gameInstance.GetProxyMenuCommandDescription(_extensionMenuPath);
            return string.IsNullOrWhiteSpace(description) ? "Module commands" : description;
        }

        private async Task ShowDataMenuHelpAsync()
        {
            var help = new StringBuilder();
            help.Append("\r\nData menu:\r\n");
            help.Append("  ? - Command list\r\n");
            help.Append("  + - Help on command\r\n");
            help.Append("  Q - Return to main menu\r\n");
            help.Append("  D - Display sector as last seen\r\n");
            help.Append("  F - Show sectors with foreign fighters\r\n");
            help.Append("  M - Show sectors with mines\r\n");
            help.Append("  S - Show sectors by density range\r\n");
            help.Append("  A - Show sectors with anomaly\r\n");
            help.Append("  R - Show sectors with traders\r\n");
            help.Append("  C - Plot warp course\r\n");
            help.Append("  H - Simulate holo scan\r\n");
            help.Append("  T - Show total sectors scanned\r\n");
            help.Append("  B - Show bubbles found\r\n");
            help.Append("  Z - Show bubble details\r\n");
            help.Append("  - - Show backdoors to a sector\r\n");
            help.Append("  X - Import/export data\r\n\r\n");
            await _gameInstance.SendMessageAsync(help.ToString());
            await ShowDataMenuPromptAsync();
        }

        private async Task ShowDataTransferMenuHelpAsync()
        {
            var help = new StringBuilder();
            help.Append("\r\nData transfer menu:\r\n");
            help.Append("  ? - Command list\r\n");
            help.Append("  + - Help on command\r\n");
            help.Append("  Q - Return to data menu\r\n");
            help.Append("  E - Export warp data\r\n");
            help.Append("  I - Import warp data\r\n");
            help.Append("  B - Export bubble list\r\n");
            help.Append("  D - Export deadend list\r\n");
            help.Append("  T - Export TWX file\r\n");
            help.Append("  W - Import TWX file\r\n\r\n");
            await _gameInstance.SendMessageAsync(help.ToString());
            await ShowDataTransferMenuPromptAsync();
        }

        private async Task ShowPortMenuHelpAsync()
        {
            var help = new StringBuilder();
            help.Append("\r\nPort menu:\r\n");
            help.Append("  ? - Command list\r\n");
            help.Append("  + - Help on command\r\n");
            help.Append("  Q - Return to main menu\r\n");
            help.Append("  D - Show port details as last seen\r\n");
            help.Append("  0 - Show all class 0/9 ports\r\n");
            help.Append("  L - List all ports\r\n");
            help.Append("  U - List heavily upgraded ports\r\n\r\n");
            await _gameInstance.SendMessageAsync(help.ToString());
            await ShowPortMenuPromptAsync();
        }

        private async Task ShowScriptMenuHelpAsync()
        {
            var help = new StringBuilder();
            help.Append("\r\nScript menu:\r\n");
            help.Append("  ? - Command list\r\n");
            help.Append("  + - Help on command\r\n");
            help.Append("  Q - Return to main menu\r\n");
            help.Append("  S - Load script\r\n");
            help.Append("  L - Reload last script\r\n");
            help.Append("  U - Unload script\r\n");
            help.Append("  P - Pause script\r\n");
            help.Append("  R - Resume script\r\n");
            help.Append("  V - Dump script variables\r\n");
            help.Append("  T - Dump active triggers\r\n");
            help.Append("  I - List active scripts\r\n");
            help.Append("  D - List script directory\r\n");
            help.Append("  K - Kill script by ID\r\n");
            help.Append("  X - Terminate the current script/mode and exit menu\r\n");
            help.Append("  Z - Stop all interruptible scripts\r\n\r\n");
            await _gameInstance.SendMessageAsync(help.ToString());
            await ShowScriptMenuPromptAsync();
        }

        private async Task ShowSetupMenuHelpAsync()
        {
            ModDatabase? db = GetCurrentDatabase();
            ModBubble bubble = GetBubbleModule();

            var help = new StringBuilder();
            help.Append("\r\nSetup menu:\r\n");
            help.Append("  ? - Command list\r\n");
            help.Append("  + - Help on command\r\n");
            help.Append("  Q - Return to main menu\r\n");
            help.Append("  D - Database submenu\r\n");
            help.Append($"  P - Listen port ({(db?.DBHeader.ListenPort ?? 0)})\r\n");
            help.Append($"  B - Max bubble size ({bubble.MaxBubbleSize})\r\n");
            help.Append($"  R - Auto reconnect ({FormatOnOff(_gameInstance.AutoReconnect)})\r\n");
            help.Append($"  L - Logging ({FormatOnOff(_gameInstance.LogDataEnabled)})\r\n");
            help.Append($"  A - Log ANSI ({FormatOnOff(_gameInstance.LogAnsiEnabled)})\r\n");
            help.Append($"  X - Accept external connects ({FormatOnOff(_gameInstance.AcceptExternal)})\r\n");
            help.Append($"  C - Database cache ({FormatOnOff(db?.UseCache ?? false)})\r\n");
            help.Append($"  E - Recording ({FormatOnOff(db?.Recording ?? false)})\r\n");
            help.Append($"  K - Terminal menu key ({_gameInstance.CommandChar})\r\n");
            help.Append($"  H - Local echo ({FormatOnOff(_gameInstance.LocalEcho)})\r\n\r\n");
            await _gameInstance.SendMessageAsync(help.ToString());
            await ShowSetupMenuPromptAsync();
        }

        private async Task ShowDatabaseMenuHelpAsync()
        {
            var help = new StringBuilder();
            help.Append("\r\nDatabase menu:\r\n");
            help.Append("  ? - Command list\r\n");
            help.Append("  + - Help on command\r\n");
            help.Append("  Q - Return to setup menu\r\n");
            help.Append("  C - Create database\r\n");
            help.Append("  E - Edit database\r\n");
            help.Append("  D - Delete database\r\n");
            help.Append("  S - Select active database\r\n");
            help.Append("  L - List databases\r\n");
            help.Append("  V - View database details\r\n\r\n");
            await _gameInstance.SendMessageAsync(help.ToString());
            await ShowDatabaseMenuPromptAsync();
        }

        private async Task ShowDataMenuAsync()
        {
            await _gameInstance.SendMessageAsync("\r\nData menu - Press ? for help\r\n");
            await ShowDataMenuPromptAsync();
        }

        private async Task ShowDataTransferMenuAsync()
        {
            await _gameInstance.SendMessageAsync("\r\nData transfer menu - Press ? for help\r\n");
            await ShowDataTransferMenuPromptAsync();
        }

        private async Task ShowPortMenuAsync()
        {
            await _gameInstance.SendMessageAsync("\r\nPort menu - Press ? for help\r\n");
            await ShowPortMenuPromptAsync();
        }

        private async Task ShowScriptMenuAsync()
        {
            await _gameInstance.SendMessageAsync("\r\nScript menu - Press ? for help\r\n");
            await ShowScriptMenuPromptAsync();
        }

        private async Task ShowSetupMenuAsync()
        {
            await _gameInstance.SendMessageAsync("\r\nSetup menu - Press ? for help\r\n");
            await ShowSetupMenuPromptAsync();
        }

        private async Task ShowDatabaseMenuAsync()
        {
            await _gameInstance.SendMessageAsync("\r\nDatabase menu - Press ? for help\r\n");
            await ShowDatabaseMenuPromptAsync();
        }

        private async Task ShowAllClientsAsync()
        {
            var output = new StringBuilder();
            output.Append("\r\n#   Address:        Type:\r\n\r\n");

            int currentClient = CurrentClientIndex;
            for (int i = 0; i < _gameInstance.ClientCount; i++)
            {
                string index = i.ToString();
                string address = _gameInstance.GetClientAddress(i);
                string type = _gameInstance.GetClientType(i) switch
                {
                    ClientType.Standard => "STANDARD",
                    ClientType.Mute => "VIEW ONLY",
                    ClientType.Deaf => "DEAF",
                    ClientType.Stream => "STREAMING",
                    ClientType.Rejected => "REJECTED",
                    _ => "UNKNOWN"
                };

                output.Append(index);
                output.Append(' ', Math.Max(0, 4 - index.Length));
                output.Append(address);
                output.Append(' ', Math.Max(0, 16 - address.Length));
                output.Append(type);
                if (i == currentClient)
                    output.Append("  <");
                output.Append("\r\n");
            }

            output.Append("\r\n");
            await _gameInstance.SendMessageAsync(output.ToString());
            await ShowMenuPromptAsync();
        }

        private async Task ConnectDisconnectAsync()
        {
            _currentMenu = MenuState.None;

            if (_gameInstance.IsConnected)
            {
                await _gameInstance.SendMessageAsync("\r\nDisconnecting from server...\r\n");
                await _gameInstance.DisconnectFromServerAsync();
            }
            else
            {
                await _gameInstance.SendMessageAsync($"\r\n{_gameInstance.ConnectingStatusText}\r\n");
                try
                {
                    await _gameInstance.ConnectToServerAsync();
                    await _gameInstance.SendMessageAsync("Connected!\r\n");
                }
                catch (Exception ex)
                {
                    await _gameInstance.SendMessageAsync($"Connection failed: {ex.Message}\r\n");
                }
            }
        }

        private async Task EditSendLastBurstAsync()
        {
            if (string.IsNullOrEmpty(_lastBurst))
            {
                await _gameInstance.SendMessageAsync("\r\nNo previous burst to edit.\r\n");
                await ShowMenuPromptAsync();
                return;
            }

            await _gameInstance.SendMessageAsync($"\r\nLast burst: {_lastBurst}\r\n");
            await EnterInputModeAsync("Enter new burst (or press Enter to send as-is): ", InputMode.BurstEdit, _lastBurst);
        }

        private async Task ToggleNativeHaggleAsync()
        {
            bool enabled = _gameInstance.ToggleNativeHaggle(NativeHaggleChangeSource.User);
            await _gameInstance.SendMessageAsync($"\r\nNative haggle {(enabled ? "enabled" : "disabled")}.\r\n");
            await ExitMenuAsync();
        }

        private async Task RepeatLastBurstAsync()
        {
            if (string.IsNullOrEmpty(_lastBurst))
            {
                await _gameInstance.SendMessageAsync("\r\nNo previous burst to repeat.\r\n");
            }
            else
            {
                await _gameInstance.SendMessageAsync($"\r\nRepeating burst: {_lastBurst}\r\n");
                byte[] data = Encoding.ASCII.GetBytes(TranslateBurstText(_lastBurst));
                await _gameInstance.SendToServerAsync(data);
            }

            await ShowMenuPromptAsync();
        }

        private async Task StopAllScriptsAsync()
        {
            try
            {
                if (_interpreter == null)
                {
                    await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                }
                else
                {
                    int count = Enumerable.Range(0, _interpreter.Count)
                        .Select(_interpreter.GetScript)
                        .Count(static script => script != null && (!script.System || script.IsBot));
                    await _gameInstance.SendMessageAsync($"\r\nStopping {count} script(s)...\r\n");
                    _interpreter.ForceStopInterruptible();
                    await _gameInstance.SendMessageAsync("All scripts stopped.\r\n");
                }
            }
            catch (Exception ex)
            {
                await _gameInstance.SendMessageAsync($"\r\nError stopping scripts: {ex.Message}\r\n");
            }

            await ShowMenuPromptAsync();
        }

        private async Task ExitProgramAsync()
        {
            GlobalModules.DebugLog("[Menu] ExitProgramAsync called — stopping proxy\n");
            GlobalModules.FlushDebugLog();
            await _gameInstance.SendMessageAsync("\r\nExiting TWX Proxy...\r\n");
            await _gameInstance.StopAsync();
        }

        public void SetLastBurst(string burst)
        {
            _lastBurst = burst;
        }

        public async Task<bool> HandleInputCharAsync(char c)
        {
            using var _ = _gameInstance.PushClientContext(CurrentClientIndex);
            int charCode = c;

            if (charCode == 0)
            {
                _skipNextLineFeed = false;
                return true;
            }

            if (c == '\n' && _skipNextLineFeed)
            {
                _skipNextLineFeed = false;
                return true;
            }

            if (_inputMode == InputMode.None)
                return false;

            if (c == '\r' || c == '\n')
            {
                string input = _inputBuffer.ToString().Trim();
                _inputBuffer.Clear();

                InputMode mode = _inputMode;
                _inputMode = InputMode.None;
                _skipNextLineFeed = c == '\r';

                await ProcessCollectedInputAsync(mode, input);
                return true;
            }

            if (c == '\b' || c == 127)
            {
                _skipNextLineFeed = false;
                if (_inputBuffer.Length > 0)
                {
                    _inputBuffer.Length--;
                    await _gameInstance.SendMessageAsync("\b \b");
                }

                return true;
            }

            _skipNextLineFeed = false;
            _inputBuffer.Append(c);
            await _gameInstance.SendMessageAsync(c.ToString());
            return true;
        }

        private async Task ProcessCollectedInputAsync(InputMode mode, string input)
        {
            switch (mode)
            {
                case InputMode.ScriptLoad:
                    await LoadScriptAsync(input);
                    break;
                case InputMode.ScriptUnload:
                    await UnloadScriptAsync(input);
                    break;
                case InputMode.ScriptPause:
                    await PauseScriptAsync(input);
                    break;
                case InputMode.ScriptResume:
                    await ResumeScriptAsync(input);
                    break;
                case InputMode.ScriptKill:
                    await KillScriptAsync(input);
                    break;
                case InputMode.ScriptDumpVars:
                    await DumpVarsAsync(input);
                    break;
                case InputMode.BurstInput:
                    await SendBurstAsync(input);
                    break;
                case InputMode.BurstEdit:
                    await SendBurstAsync(string.IsNullOrEmpty(input) ? _lastBurst : input);
                    break;
                case InputMode.CommandHelp:
                    await ShowCommandHelpAsync(input);
                    break;
                case InputMode.DataShowSector:
                    await ShowSectorAsync(input);
                    break;
                case InputMode.DataShowDensityLow:
                    _pendingNumber = ParseInt(input);
                    await EnterInputModeAsync("\r\nEnter the highest density to display: ", InputMode.DataShowDensityHigh);
                    break;
                case InputMode.DataShowDensityHigh:
                    await ShowDensityRangeAsync(_pendingNumber, ParseInt(input));
                    break;
                case InputMode.DataPlotCourseFrom:
                    _pendingNumber = ParseInt(input);
                    await EnterInputModeAsync("\r\nTo: ", InputMode.DataPlotCourseTo);
                    break;
                case InputMode.DataPlotCourseTo:
                    await PlotCourseAsync(_pendingNumber, ParseInt(input));
                    break;
                case InputMode.DataHoloscan:
                    await ShowHoloscanAsync(ParseInt(input));
                    break;
                case InputMode.DataShowBubbleGate:
                    _pendingNumber = ParseInt(input);
                    await EnterInputModeAsync("\r\nEnter a sector within the bubble: ", InputMode.DataShowBubbleInterior);
                    break;
                case InputMode.DataShowBubbleInterior:
                    await ShowBubbleAsync(_pendingNumber, ParseInt(input));
                    break;
                case InputMode.DataShowBackdoors:
                    await ShowBackdoorsAsync(ParseInt(input));
                    break;
                case InputMode.DataExportWarpsPath:
                    await ExportWarpDataAsync(input);
                    break;
                case InputMode.DataImportWarpsPath:
                    await ImportWarpDataAsync(input);
                    break;
                case InputMode.DataExportBubblesPath:
                    await ExportBubbleListAsync(input);
                    break;
                case InputMode.DataExportDeadendsPath:
                    await ExportDeadendListAsync(input);
                    break;
                case InputMode.DataExportTwxPath:
                    await ExportTwxFileAsync(input);
                    break;
                case InputMode.DataImportTwxPath:
                    _workflowArgs.Clear();
                    _workflowArgs.Add(input);
                    await EnterInputModeAsync(
                        "\r\nKeep existing newer data when importing over it? (Y/N): ",
                        InputMode.DataImportTwxKeepRecent);
                    break;
                case InputMode.DataImportTwxKeepRecent:
                    await ImportTwxFileAsync(_workflowArgs.FirstOrDefault() ?? string.Empty, input);
                    break;
                case InputMode.PortShowPort:
                    await ShowPortAsync(ParseInt(input));
                    break;
                case InputMode.SetupListenPort:
                    await SetListenPortAsync(ParseInt(input));
                    break;
                case InputMode.SetupBubbleSize:
                    await SetBubbleSizeAsync(ParseInt(input));
                    break;
                case InputMode.SetupMenuKey:
                    await SetMenuKeyAsync(input);
                    break;
                case InputMode.DatabaseCreateName:
                    _workflowArgs.Clear();
                    _workflowArgs.Add(input);
                    await EnterInputModeAsync("\r\nEnter new database size (in sectors): ", InputMode.DatabaseCreateSize);
                    break;
                case InputMode.DatabaseCreateSize:
                    await CreateDatabaseAsync(_workflowArgs.FirstOrDefault() ?? string.Empty, ParseInt(input));
                    break;
                case InputMode.DatabaseEditName:
                    await BeginDatabaseEditAsync(input);
                    break;
                case InputMode.DatabaseEditAddress:
                    StoreWorkflowValue(input);
                    await EnterInputModeAsync("\r\nEnter new server port (blank for no change): ", InputMode.DatabaseEditPort);
                    break;
                case InputMode.DatabaseEditPort:
                    StoreWorkflowValue(input);
                    await EnterInputModeAsync("\r\nUse login script? (Y/N): ", InputMode.DatabaseEditUseLogin);
                    break;
                case InputMode.DatabaseEditUseLogin:
                    StoreWorkflowValue(input);
                    if (input.Equals("Y", StringComparison.OrdinalIgnoreCase))
                    {
                        await EnterInputModeAsync("\r\nEnter login script name (blank for no change): ", InputMode.DatabaseEditLoginScript);
                    }
                    else
                    {
                        await ApplyDatabaseEditAsync(false);
                    }
                    break;
                case InputMode.DatabaseEditLoginScript:
                    StoreWorkflowValue(input);
                    await EnterInputModeAsync("\r\nEnter login name (blank for no change): ", InputMode.DatabaseEditLoginName);
                    break;
                case InputMode.DatabaseEditLoginName:
                    StoreWorkflowValue(input);
                    await EnterInputModeAsync("\r\nEnter login password (blank for no change): ", InputMode.DatabaseEditLoginPassword);
                    break;
                case InputMode.DatabaseEditLoginPassword:
                    StoreWorkflowValue(input);
                    await EnterInputModeAsync("\r\nEnter game letter (blank for no change): ", InputMode.DatabaseEditGameLetter);
                    break;
                case InputMode.DatabaseEditGameLetter:
                    StoreWorkflowValue(input);
                    await ApplyDatabaseEditAsync(true);
                    break;
                case InputMode.DatabaseDeleteName:
                    await DeleteDatabaseAsync(input);
                    break;
                case InputMode.DatabaseSelectName:
                    await SelectDatabaseAsync(input);
                    break;
                case InputMode.DatabaseViewName:
                    await ViewDatabaseAsync(input);
                    break;
                case InputMode.DataResetConfirm:
                    await ShowCurrentMenuPromptAsync();
                    break;
                default:
                    await ShowCurrentMenuPromptAsync();
                    break;
            }
        }

        private async Task LoadScriptAsync(string scriptName)
        {
            if (string.IsNullOrWhiteSpace(scriptName))
            {
                await _gameInstance.SendMessageAsync("\r\nScript name cannot be empty.\r\n");
                await ShowScriptMenuPromptAsync();
                return;
            }

            try
            {
                if (_interpreter == null)
                {
                    await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                string fullPath;
                if (Path.IsPathRooted(scriptName))
                {
                    fullPath = scriptName;
                }
                else
                {
                    fullPath = Path.Combine(_scriptDirectory, scriptName);
                }

                if (string.IsNullOrEmpty(Path.GetExtension(fullPath)))
                {
                    if (File.Exists(fullPath + ".cts"))
                        fullPath += ".cts";
                    else if (File.Exists(fullPath + ".ts"))
                        fullPath += ".ts";
                    else
                        fullPath += ".cts";
                }

                if (!File.Exists(fullPath))
                {
                    await _gameInstance.SendMessageAsync($"\r\nScript file not found: {fullPath}\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                await _gameInstance.SendMessageAsync($"\r\nLoading script: {Path.GetFileName(fullPath)}\r\n");

                // If the previous script left a custom TWX menu half-open, launching a new
                // script through the local loader can inherit that stale state and show only
                // the raw '>' prompt on rerun. Start each local load from a clean custom-menu
                // state so scripts like ram_Prober rebuild their menu fresh.
                if (GlobalModules.TWXMenu is MenuManager staleMenuMgr)
                {
                    staleMenuMgr.CloseMenu(true);
                    staleMenuMgr.ClearSuspendedMenu();
                }

                _interpreter.Load(fullPath, false);
                _lastScript = fullPath;

                _currentMenu = MenuState.None;

                bool customScriptMenuOpen = GlobalModules.TWXMenu is MenuManager menuMgr && menuMgr.IsMenuOpen();
                if (!customScriptMenuOpen)
                    await _gameInstance.SendMessageAsync("\r\n");
            }
            catch (Exception ex)
            {
                await _gameInstance.SendMessageAsync($"\r\nError loading script: {ex.Message}\r\n");
                await ShowScriptMenuPromptAsync();
            }
        }

        private async Task ReloadLastScriptAsync()
        {
            string lastScript = _interpreter?.LastScript ?? string.Empty;
            if (string.IsNullOrWhiteSpace(lastScript))
                lastScript = _lastScript;

            if (string.IsNullOrWhiteSpace(lastScript))
            {
                await _gameInstance.SendMessageAsync("\r\nNo script has been loaded yet.\r\n");
                await ShowScriptMenuPromptAsync();
                return;
            }

            await LoadScriptAsync(lastScript);
        }

        private async Task UnloadScriptAsync(string scriptName)
        {
            if (string.IsNullOrWhiteSpace(scriptName))
            {
                await _gameInstance.SendMessageAsync("\r\nScript name cannot be empty.\r\n");
                await ShowScriptMenuPromptAsync();
                return;
            }

            try
            {
                if (_interpreter == null)
                {
                    await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                await _gameInstance.SendMessageAsync($"\r\nUnloading script: {scriptName}\r\n");

                bool found = false;
                for (int i = _interpreter.Count - 1; i >= 0; i--)
                {
                    Script? script = _interpreter.GetScript(i);
                    if (script == null)
                        continue;

                    string scriptFile = Path.GetFileNameWithoutExtension(script.ScriptName ?? string.Empty);
                    string searchName = Path.GetFileNameWithoutExtension(scriptName);

                    if (!scriptFile.Equals(searchName, StringComparison.OrdinalIgnoreCase))
                        continue;

                    _interpreter.Stop(i);
                    found = true;
                    await _gameInstance.SendMessageAsync($"Script '{scriptName}' unloaded.\r\n");
                    break;
                }

                if (!found)
                    await _gameInstance.SendMessageAsync($"Script '{scriptName}' not found or not running.\r\n");
            }
            catch (Exception ex)
            {
                await _gameInstance.SendMessageAsync($"\r\nError unloading script: {ex.Message}\r\n");
            }

            await ShowScriptMenuPromptAsync();
        }

        private async Task PauseScriptAsync(string scriptName)
        {
            if (string.IsNullOrWhiteSpace(scriptName))
            {
                await _gameInstance.SendMessageAsync("\r\nScript name cannot be empty.\r\n");
                await ShowScriptMenuPromptAsync();
                return;
            }

            try
            {
                if (_interpreter == null)
                {
                    await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                await _gameInstance.SendMessageAsync($"\r\nPausing script: {scriptName}\r\n");

                bool found = false;
                for (int i = 0; i < _interpreter.Count; i++)
                {
                    Script? script = _interpreter.GetScript(i);
                    if (script == null)
                        continue;

                    string scriptFile = Path.GetFileNameWithoutExtension(script.ScriptName ?? string.Empty);
                    string searchName = Path.GetFileNameWithoutExtension(scriptName);

                    if (!scriptFile.Equals(searchName, StringComparison.OrdinalIgnoreCase))
                        continue;

                    script.Pause();
                    found = true;
                    await _gameInstance.SendMessageAsync($"Script '{scriptName}' paused.\r\n");
                    break;
                }

                if (!found)
                    await _gameInstance.SendMessageAsync($"Script '{scriptName}' not found or not running.\r\n");
            }
            catch (Exception ex)
            {
                await _gameInstance.SendMessageAsync($"\r\nError pausing script: {ex.Message}\r\n");
            }

            await ShowScriptMenuPromptAsync();
        }

        private async Task ResumeScriptAsync(string scriptName)
        {
            if (string.IsNullOrWhiteSpace(scriptName))
            {
                await _gameInstance.SendMessageAsync("\r\nScript name cannot be empty.\r\n");
                await ShowScriptMenuPromptAsync();
                return;
            }

            try
            {
                if (_interpreter == null)
                {
                    await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                await _gameInstance.SendMessageAsync($"\r\nResuming script: {scriptName}\r\n");

                bool found = false;
                for (int i = 0; i < _interpreter.Count; i++)
                {
                    Script? script = _interpreter.GetScript(i);
                    if (script == null)
                        continue;

                    string scriptFile = Path.GetFileNameWithoutExtension(script.ScriptName ?? string.Empty);
                    string searchName = Path.GetFileNameWithoutExtension(scriptName);

                    if (!scriptFile.Equals(searchName, StringComparison.OrdinalIgnoreCase))
                        continue;

                    script.Resume();
                    found = true;
                    await _gameInstance.SendMessageAsync($"Script '{scriptName}' resumed.\r\n");
                    break;
                }

                if (!found)
                    await _gameInstance.SendMessageAsync($"Script '{scriptName}' not found or not paused.\r\n");
            }
            catch (Exception ex)
            {
                await _gameInstance.SendMessageAsync($"\r\nError resuming script: {ex.Message}\r\n");
            }

            await ShowScriptMenuPromptAsync();
        }

        private async Task ExitCurrentScriptAsync()
        {
            GlobalModules.DebugLog("[Menu] ExitCurrentScriptAsync called\n");
            GlobalModules.FlushDebugLog();

            try
            {
                if (_interpreter == null)
                {
                    await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                Script? targetScript = null;
                int targetIndex = -1;

                for (int i = _interpreter.Count - 1; i >= 0; i--)
                {
                    Script? script = _interpreter.GetScript(i);
                    if (script != null && (!script.System || script.IsBot))
                    {
                        targetScript = script;
                        targetIndex = i;
                        break;
                    }
                }

                if (targetScript != null)
                {
                    string scriptFile = targetScript.Compiler?.ScriptFile ?? targetScript.ScriptName;
                    await _gameInstance.SendMessageAsync($"\r\nScript terminated: {scriptFile}\r\n");
                    _interpreter.Stop(targetIndex);
                }
                else
                {
                    await _gameInstance.SendMessageAsync("\r\nNo interruptible scripts running.\r\n");
                }
            }
            catch (Exception ex)
            {
                await _gameInstance.SendMessageAsync($"\r\nError exiting script: {ex.Message}\r\n");
            }

            _currentMenu = MenuState.None;
            await _gameInstance.SendMessageAsync("\r\n");
        }

        private async Task ListScriptsAsync()
        {
            try
            {
                if (_interpreter == null)
                {
                    await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                var output = new StringBuilder();
                output.Append("\r\n\r\nID\tFile\r\n\r\n");
                bool hasAny = false;

                BotConfig? activeBotConfig = !string.IsNullOrWhiteSpace(_gameInstance.ActiveBotName)
                    ? _gameInstance.GetBotConfig(_gameInstance.ActiveBotName)
                    : null;
                if (ProxyMenuCatalog.IsNativeBotConfig(activeBotConfig))
                {
                    string nativeReference = Utility.NormalizePathSeparators(activeBotConfig?.ScriptFile ?? "mombot/mombot.cts");
                    if (!nativeReference.StartsWith("scripts/", StringComparison.OrdinalIgnoreCase))
                        nativeReference = "scripts/" + nativeReference;

                    output.Append($"N\t{nativeReference} (native)\r\n");
                    hasAny = true;
                }

                if (_interpreter.Count == 0)
                {
                    if (!hasAny)
                        output.Append("No scripts are active.\r\n");
                }
                else
                {
                    for (int i = 0; i < _interpreter.Count; i++)
                    {
                        Script? script = _interpreter.GetScript(i);
                        if (script == null)
                            continue;

                        string scriptFile = script.Compiler?.ScriptFile ?? script.ScriptName;
                        output.Append($"{i}\t{scriptFile}\r\n");
                        hasAny = true;
                    }
                }

                output.Append("\r\n");
                await _gameInstance.SendMessageAsync(output.ToString());
            }
            catch (Exception ex)
            {
                await _gameInstance.SendMessageAsync($"\r\nError listing scripts: {ex.Message}\r\n");
            }

            await ShowScriptMenuPromptAsync();
        }

        private async Task ListScriptDirectoryAsync()
        {
            var output = new StringBuilder();
            output.Append("\r\n\r\nListing contents of script directory\r\n\r\n");

            if (!Directory.Exists(_scriptDirectory))
            {
                output.Append($"Script directory not found: {_scriptDirectory}\r\n\r\n");
                await _gameInstance.SendMessageAsync(output.ToString());
                await ShowScriptMenuPromptAsync();
                return;
            }

            IEnumerable<string> files = Directory.EnumerateFiles(_scriptDirectory, "*.*", SearchOption.AllDirectories)
                .Where(path =>
                {
                    string ext = Path.GetExtension(path);
                    return ext.Equals(".ts", StringComparison.OrdinalIgnoreCase)
                        || ext.Equals(".cts", StringComparison.OrdinalIgnoreCase);
                })
                .OrderBy(path => path, StringComparer.OrdinalIgnoreCase);

            foreach (string file in files)
            {
                output.Append(Path.GetRelativePath(_scriptDirectory, file).Replace('\\', '/'));
                output.Append("\r\n");
            }

            output.Append("\r\n");
            await _gameInstance.SendMessageAsync(output.ToString());
            await ShowScriptMenuPromptAsync();
        }

        private async Task KillScriptAsync(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                await _gameInstance.SendMessageAsync("\r\nScript ID cannot be empty.\r\n");
                await ShowScriptMenuPromptAsync();
                return;
            }

            try
            {
                if (_interpreter == null)
                {
                    await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                string trimmedInput = input.Trim();
                BotConfig? activeBotConfig = !string.IsNullOrWhiteSpace(_gameInstance.ActiveBotName)
                    ? _gameInstance.GetBotConfig(_gameInstance.ActiveBotName)
                    : null;
                if (trimmedInput.Equals("N", StringComparison.OrdinalIgnoreCase) &&
                    ProxyMenuCatalog.IsNativeBotConfig(activeBotConfig) &&
                    _gameInstance.NativeBotStopper != null &&
                    activeBotConfig != null)
                {
                    string nativeReference = Utility.NormalizePathSeparators(activeBotConfig.ScriptFile);
                    if (!nativeReference.StartsWith("scripts/", StringComparison.OrdinalIgnoreCase))
                        nativeReference = "scripts/" + nativeReference;

                    await _gameInstance.SendMessageAsync($"\r\nScript terminated: {nativeReference} (native)\r\n");
                    _gameInstance.NativeBotStopper(activeBotConfig.Name);
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                if (!int.TryParse(trimmedInput, out int scriptId))
                {
                    await _gameInstance.SendMessageAsync($"\r\nInvalid script ID: '{input}'. Please enter a number.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                if (scriptId < 0 || scriptId >= _interpreter.Count)
                {
                    await _gameInstance.SendMessageAsync($"\r\nScript ID {scriptId} out of range (0-{_interpreter.Count - 1}).\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                Script? script = _interpreter.GetScript(scriptId);
                if (script == null)
                {
                    await _gameInstance.SendMessageAsync($"\r\nScript ID {scriptId} not found.\r\n");
                    await ShowScriptMenuPromptAsync();
                    return;
                }

                string scriptFile = script.Compiler?.ScriptFile ?? script.ScriptName;
                await _gameInstance.SendMessageAsync($"\r\nScript terminated: {scriptFile}\r\n");
                _interpreter.Stop(scriptId);
            }
            catch (Exception ex)
            {
                await _gameInstance.SendMessageAsync($"\r\nError killing script: {ex.Message}\r\n");
            }

            await ShowScriptMenuPromptAsync();
        }

        private async Task DumpVarsAsync(string searchName)
        {
            if (_interpreter == null)
            {
                await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                await ShowScriptMenuPromptAsync();
                return;
            }

            _interpreter.DumpVars(searchName);
            await _gameInstance.SendMessageAsync("\r\n");
            await ShowScriptMenuPromptAsync();
        }

        private async Task DumpTriggersAsync()
        {
            if (_interpreter == null)
            {
                await _gameInstance.SendMessageAsync("\r\nScript interpreter not available.\r\n");
                await ShowScriptMenuPromptAsync();
                return;
            }

            _interpreter.DumpTriggers();
            await _gameInstance.SendMessageAsync("\r\n");
            await ShowScriptMenuPromptAsync();
        }

        private async Task SendBurstAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                await _gameInstance.SendMessageAsync("\r\nBurst text cannot be empty.\r\n");
                await ShowMenuPromptAsync();
                return;
            }

            _lastBurst = text;
            await _gameInstance.SendToServerAsync(Encoding.ASCII.GetBytes(TranslateBurstText(text)));
            await ExitMenuAsync();
        }

        private async Task ShowCommandHelpAsync(string command)
        {
            if (string.IsNullOrWhiteSpace(command))
            {
                await _gameInstance.SendMessageAsync("\r\nEnter a menu command to get help on.\r\n");
                await ShowCurrentMenuPromptAsync();
                return;
            }

            string? help = GetCommandHelpText(_currentMenu, command[0]);
            if (string.IsNullOrEmpty(help))
                await _gameInstance.SendMessageAsync($"\r\nNo help is available for command '{command[0]}'.\r\n");
            else
                await _gameInstance.SendMessageAsync($"\r\n{help}\r\n");

            await ShowCurrentMenuPromptAsync();
        }

        private async Task ShowSectorAsync(string input)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetValidSector(db, ParseInt(input), out SectorData? sector, out string error))
            {
                await _gameInstance.SendMessageAsync(error);
                await ShowDataMenuPromptAsync();
                return;
            }

            if (sector!.Explored == ExploreType.No)
            {
                await _gameInstance.SendMessageAsync("\r\nThat sector has not been recorded.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            await _gameInstance.SendMessageAsync("\r\n" + FormatSectorDisplay(sector) + "\r\n");
            await ShowDataMenuPromptAsync();
        }

        private async Task ShowSectorsWithForeignFightersAsync()
        {
            await ShowSectorQueryAsync(
                "Showing all sectors with foreign fighters in them...",
                sector => sector.Explored != ExploreType.No
                    && sector.Fighters.Quantity > 0
                    && !IsFriendlyOwner(sector.Fighters.Owner));
        }

        private async Task ShowSectorsWithMinesAsync()
        {
            await ShowSectorQueryAsync(
                "Showing all sectors with mines in them...",
                sector => sector.Explored != ExploreType.No
                    && (sector.MinesArmid.Quantity > 0 || sector.MinesLimpet.Quantity > 0));
        }

        private async Task ShowDensityRangeAsync(int low, int high)
        {
            if (low > high)
                (low, high) = (high, low);

            await ShowSectorQueryAsync(
                "Showing all sectors within the specified density range...",
                sector => sector.Explored != ExploreType.No && sector.Density >= low && sector.Density <= high);
        }

        private async Task ShowAnomalySectorsAsync()
        {
            await ShowSectorQueryAsync(
                "Showing all sectors with anomaly...",
                sector => sector.Explored != ExploreType.No && sector.Anomaly);
        }

        private async Task ShowTraderSectorsAsync()
        {
            await ShowSectorQueryAsync(
                "Showing sectors with traders...",
                sector => sector.Explored != ExploreType.No && sector.Traders.Count > 0);
        }

        private async Task PlotCourseAsync(int fromSector, int toSector)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (db == null || db.DBHeader.Sectors <= 0)
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            if (fromSector < 1 || fromSector > db.DBHeader.Sectors || toSector < 1 || toSector > db.DBHeader.Sectors)
            {
                await _gameInstance.SendMessageAsync("\r\nThat is not a valid sector.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            List<int> path = db.CalculateBidirectionalShortestPath(fromSector, toSector);
            if (path.Count == 0)
            {
                await _gameInstance.SendMessageAsync("\r\nInsufficient mapping data to plot warp course.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            string output = $"\r\nWarp lane from {fromSector} to {toSector} ({path.Count - 1} hops):\r\n\r\n"
                          + string.Join(" > ", path) + "\r\n\r\n";
            await _gameInstance.SendMessageAsync(output);
            await ShowDataMenuPromptAsync();
        }

        private async Task ShowHoloscanAsync(int sectorNumber)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetValidSector(db, sectorNumber, out SectorData? sector, out string error))
            {
                await _gameInstance.SendMessageAsync(error);
                await ShowDataMenuPromptAsync();
                return;
            }

            if (sector!.Explored == ExploreType.No)
            {
                await _gameInstance.SendMessageAsync("\r\nThat sector has not been recorded.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            var output = new StringBuilder();
            output.Append("\r\n");

            foreach (int warp in sector.Warp.Where(w => w > 0))
            {
                SectorData? adjacent = GetSectorData(db!, warp);
                if (adjacent != null && adjacent.Explored != ExploreType.No)
                    output.Append(FormatSectorDisplay(adjacent)).Append("\r\n");
            }

            if (output.Length == 2)
                output.Append("No recorded adjacent sectors.\r\n");

            await _gameInstance.SendMessageAsync(output.ToString());
            await ShowDataMenuPromptAsync();
        }

        private async Task ShowScannedTotalsAsync()
        {
            ModDatabase? db = GetCurrentDatabase();
            if (db == null || db.DBHeader.Sectors <= 0)
            {
                await _gameInstance.SendMessageAsync("\r\nNo sectors to compute.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            int visual = 0;
            int density = 0;
            int calc = 0;
            int scanned = 0;

            for (int i = 1; i <= db.DBHeader.Sectors; i++)
            {
                SectorData? sector = GetSectorData(db, i);
                if (sector == null)
                    continue;

                switch (sector.Explored)
                {
                    case ExploreType.Yes:
                        visual++;
                        scanned++;
                        break;
                    case ExploreType.Density:
                        density++;
                        scanned++;
                        break;
                    case ExploreType.Calc:
                        calc++;
                        break;
                }
            }

            int total = db.DBHeader.Sectors;
            int accounted = scanned + calc;

            string output =
                "\r\nScanned Sector Summary\r\n\r\n" +
                $"Visual/holo: {visual} ({Percent(visual, total)}%)\r\n" +
                $"Density: {density} ({Percent(density, total)}%)\r\n" +
                $"Calculation: {calc} ({Percent(calc, total)}%)\r\n" +
                $"Total scanned: {scanned} ({Percent(scanned, total)}%)\r\n" +
                $"Total accounted for: {accounted} ({Percent(accounted, total)}%)\r\n\r\n";

            await _gameInstance.SendMessageAsync(output);
            await ShowDataMenuPromptAsync();
        }

        private async Task ShowBubblesAsync()
        {
            await _gameInstance.SendMessageAsync("\r\nCalculating bubbles, please wait...\r\n");
            GetBubbleModule().DumpBubbles();
            await _gameInstance.SendMessageAsync("\r\n");
            await ShowDataMenuPromptAsync();
        }

        private async Task ShowBubbleAsync(int gateSector, int interiorSector)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (db == null || db.DBHeader.Sectors <= 0)
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            if (gateSector < 1 || gateSector > db.DBHeader.Sectors || interiorSector < 1 || interiorSector > db.DBHeader.Sectors)
            {
                await _gameInstance.SendMessageAsync("\r\nThat is not a valid sector.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            await _gameInstance.SendMessageAsync("\r\n");
            GetBubbleModule().ShowBubble((ushort)gateSector, (ushort)interiorSector);
            await ShowDataMenuPromptAsync();
        }

        private async Task ShowBackdoorsAsync(int sectorNumber)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetValidSector(db, sectorNumber, out SectorData? sector, out string error))
            {
                await _gameInstance.SendMessageAsync(error);
                await ShowDataMenuPromptAsync();
                return;
            }

            List<int> backdoors = db!.GetBackDoors(sector!, sectorNumber);
            if (backdoors.Count == 0)
            {
                await _gameInstance.SendMessageAsync($"\r\nNo backdoors recorded to sector {sectorNumber}.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            var output = new StringBuilder();
            output.Append($"\r\nDisplaying all backdoors to sector {sectorNumber}\r\n");
            foreach (int backdoor in backdoors.OrderBy(value => value))
            {
                SectorData? backdoorSector = GetSectorData(db, backdoor);
                if (backdoorSector != null)
                    output.Append(FormatSectorDisplay(backdoorSector)).Append("\r\n");
            }

            await _gameInstance.SendMessageAsync(output.ToString());
            await ShowDataMenuPromptAsync();
        }

        private async Task ExportWarpDataAsync(string input)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetOpenDatabase(db))
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowDataTransferMenuPromptAsync();
                return;
            }

            string path = ResolveTransferPath(input, DefaultWarpDataFileName(), ".txt");
            await StartDataTransferOperationAsync(
                $"Exporting warp data to {path}...",
                "Unable to export warp data",
                () =>
                {
                    ProxyGameOperations.ExportWarps(db!, path);
                    return $"\r\nWarp data successfully exported to {path}\r\n";
                });
        }

        private async Task ImportWarpDataAsync(string input)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetOpenDatabase(db))
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowDataTransferMenuPromptAsync();
                return;
            }

            string path = ResolveTransferPath(input, DefaultWarpDataFileName(), ".txt");
            await StartDataTransferOperationAsync(
                $"Importing warp data from {path}...",
                "Unable to import warp data",
                () =>
                {
                    int imported = ProxyGameOperations.ImportWarps(db!, path);
                    return $"\r\nWarp data successfully imported from {path} ({imported} sector records).\r\n";
                });
        }

        private async Task ExportBubbleListAsync(string input)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetOpenDatabase(db))
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowDataTransferMenuPromptAsync();
                return;
            }

            string path = ResolveTransferPath(input, DefaultBubbleFileName(), ".txt");
            await StartDataTransferOperationAsync(
                $"Exporting bubble list to {path}...",
                "Unable to export bubble list",
                () =>
                {
                    ProxyGameOperations.ExportBubbles(db!, path, GetBubbleModule().MaxBubbleSize);
                    return $"\r\nBubble list successfully exported to {path}\r\n";
                });
        }

        private async Task ExportDeadendListAsync(string input)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetOpenDatabase(db))
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowDataTransferMenuPromptAsync();
                return;
            }

            string path = ResolveTransferPath(input, DefaultDeadendFileName(), ".txt");
            await StartDataTransferOperationAsync(
                $"Exporting deadend list to {path}...",
                "Unable to export deadend list",
                () =>
                {
                    ProxyGameOperations.ExportDeadends(db!, path);
                    return $"\r\nDeadend list successfully exported to {path}\r\n";
                });
        }

        private async Task ExportTwxFileAsync(string input)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetOpenDatabase(db))
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowDataTransferMenuPromptAsync();
                return;
            }

            string path = ResolveTransferPath(input, DefaultTwxFileName(), ".twx");
            await StartDataTransferOperationAsync(
                $"Exporting TWX file to {path}...",
                "Unable to export TWX file",
                () =>
                {
                    ProxyGameOperations.ExportTwx(db!, path);
                    return $"\r\nDatabase export successful: {path}\r\n";
                });
        }

        private async Task ImportTwxFileAsync(string pathInput, string keepRecentInput)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetOpenDatabase(db))
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowDataTransferMenuPromptAsync();
                return;
            }

            string path = ResolveTransferPath(pathInput, DefaultTwxFileName(), ".twx");
            bool keepRecent = keepRecentInput.Trim().StartsWith("Y", StringComparison.OrdinalIgnoreCase);
            _workflowArgs.Clear();
            await StartDataTransferOperationAsync(
                $"Importing TWX file from {path}...",
                "Unable to import TWX file",
                () =>
                {
                    TwxImportResult result = ProxyGameOperations.ImportTwx(db!, path, keepRecent);
                    var output = new StringBuilder();
                    output.Append($"\r\nDatabase import successful: {path}\r\n");
                    output.Append($"Imported {result.ImportedSectorRecords} of {result.ExpectedSectorRecords} sector records.\r\n");
                    if (result.WasTruncated)
                        output.Append("Warning: source file was truncated.\r\n");
                    if (result.SkippedInvalidWarps > 0)
                        output.Append($"Skipped {result.SkippedInvalidWarps} invalid warp references.\r\n");
                    return output.ToString();
                });
        }

        private async Task StartDataTransferOperationAsync(string statusMessage, string failurePrefix, Func<string> operation)
        {
            if (Interlocked.Exchange(ref _dataTransferOperationRunning, 1) != 0)
            {
                await _gameInstance.SendMessageAsync("\r\nA data transfer is already running.\r\n");
                await ShowDataTransferMenuPromptAsync();
                return;
            }

            int clientIndex = CurrentClientIndex;
            await _gameInstance.SendMessageAsync($"\r\n{statusMessage}\r\n");

            _ = Task.Run(async () =>
            {
                string output;
                try
                {
                    output = operation();
                }
                catch (Exception ex)
                {
                    output = $"\r\n{failurePrefix}: {ex.Message}\r\n";
                }
                finally
                {
                    Interlocked.Exchange(ref _dataTransferOperationRunning, 0);
                }

                try
                {
                    using var _ = _gameInstance.PushClientContext(clientIndex);
                    await _gameInstance.SendMessageAsync(output);
                    if (_currentMenu == MenuState.DataTransfer && _inputMode == InputMode.None)
                        await ShowDataTransferMenuPromptAsync();
                }
                catch (Exception ex)
                {
                    GlobalModules.DebugLog($"[Menu.DataTransfer] Failed to write transfer result: {ex}\n");
                    GlobalModules.FlushDebugLog();
                }
            });
        }

        private async Task ShowPortAsync(int sectorNumber)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (!TryGetValidSector(db, sectorNumber, out SectorData? sector, out string error))
            {
                await _gameInstance.SendMessageAsync(error);
                await ShowPortMenuPromptAsync();
                return;
            }

            if (sector!.SectorPort == null || string.IsNullOrWhiteSpace(sector.SectorPort.Name))
            {
                await _gameInstance.SendMessageAsync("\r\nThat port has not been recorded or does not exist.\r\n");
                await ShowPortMenuPromptAsync();
                return;
            }

            if (sector.SectorPort.Update == default)
            {
                await _gameInstance.SendMessageAsync("\r\nThat port has not been recorded.\r\n");
                await ShowPortMenuPromptAsync();
                return;
            }

            await _gameInstance.SendMessageAsync("\r\n" + FormatPortDisplay(sector) + "\r\n");
            await ShowPortMenuPromptAsync();
        }

        private async Task ShowSpecialPortsAsync()
        {
            ModDatabase? db = GetCurrentDatabase();
            if (db == null || db.DBHeader.Sectors <= 0)
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowPortMenuPromptAsync();
                return;
            }

            var output = new StringBuilder();
            output.Append("\r\nShowing all sectors with class 0 or 9 ports...\r\n");

            for (int i = 1; i <= db.DBHeader.Sectors; i++)
            {
                SectorData? sector = GetSectorData(db, i);
                if (sector?.SectorPort == null)
                    continue;

                if (sector.SectorPort.ClassIndex == 0 || sector.SectorPort.ClassIndex == 9)
                    output.Append(FormatSectorDisplay(sector)).Append("\r\n");
            }

            output.Append("Completed.\r\n");
            await _gameInstance.SendMessageAsync(output.ToString());
            await ShowPortMenuPromptAsync();
        }

        private async Task ListPortsAsync(bool upgradedOnly)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (db == null || db.DBHeader.Sectors <= 0)
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowPortMenuPromptAsync();
                return;
            }

            var output = new StringBuilder();
            output.Append("\r\nSector  Class Fuel Ore        Organics        Equipment       Updated\r\n");
            output.Append("---------------------------------------------------------------------\r\n\r\n");

            for (int i = 1; i <= db.DBHeader.Sectors; i++)
            {
                SectorData? sector = GetSectorData(db, i);
                if (sector?.SectorPort == null)
                    continue;

                Port port = sector.SectorPort;
                if (string.IsNullOrWhiteSpace(port.Name) || port.ClassIndex <= 0 || port.ClassIndex >= 9)
                    continue;

                if (upgradedOnly && !IsUpgradedPort(port))
                    continue;

                output.Append(FormatPortSummary(sector)).Append("\r\n");
            }

            if (db.DBHeader.LastPortCIM == default)
            {
                output.Append("\r\nNo port CIM check has taken place.\r\n");
                output.Append("You can do port/warp CIM checks by pressing ^ inside the game.\r\n\r\n");
            }
            else
            {
                output.Append($"\r\nLast port CIM check took place on {db.DBHeader.LastPortCIM:ddd M/d/yyyy 'at' h:mm:ss tt}\r\n");
                output.Append("Ports shown in red were not updated in the last CIM check.\r\n\r\n");
            }

            await _gameInstance.SendMessageAsync(output.ToString());
            await ShowPortMenuPromptAsync();
        }

        private async Task SetListenPortAsync(int port)
        {
            if (port <= 0 || port > 65535)
            {
                await _gameInstance.SendMessageAsync("\r\nInvalid listen port.\r\n");
                await ShowSetupMenuPromptAsync();
                return;
            }

            bool saved = await UpdateActiveDatabaseHeaderAsync(header => header.ListenPort = (ushort)port);
            if (saved)
            {
                await _gameInstance.SendMessageAsync(
                    $"\r\nListen port saved as {port}. Restart the proxy to apply the new listen port.\r\n");
            }
            else
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
            }

            await ShowSetupMenuPromptAsync();
        }

        private async Task SetBubbleSizeAsync(int size)
        {
            if (size <= 0)
            {
                await _gameInstance.SendMessageAsync("\r\nBubble size must be greater than zero.\r\n");
                await ShowSetupMenuPromptAsync();
                return;
            }

            GetBubbleModule().MaxBubbleSize = size;
            await _gameInstance.SendMessageAsync($"\r\nMax bubble size set to {size}.\r\n");
            await ShowSetupMenuPromptAsync();
        }

        private async Task SetMenuKeyAsync(string input)
        {
            if (string.IsNullOrEmpty(input))
            {
                await _gameInstance.SendMessageAsync("\r\nMenu key unchanged.\r\n");
                await ShowSetupMenuPromptAsync();
                return;
            }

            char key = input[0];
            _gameInstance.SetCommandChar(key);
            await UpdateActiveDatabaseHeaderAsync(header => header.CommandChar = key);
            await _gameInstance.SendMessageAsync($"\r\nTerminal menu key set to '{key}'.\r\n");
            await ShowSetupMenuPromptAsync();
        }

        private async Task ShowDatabasesAsync()
        {
            string directory = GetDatabaseDirectory();
            if (!Directory.Exists(directory))
            {
                await _gameInstance.SendMessageAsync($"\r\nDatabase directory not found: {directory}\r\n\r\n");
                return;
            }

            string? activePath = GetCurrentDatabase()?.DatabasePath;
            var output = new StringBuilder();
            output.Append("\r\nName                 Sectors  Server\r\n\r\n");

            foreach (string file in Directory.EnumerateFiles(directory, "*.xdb").OrderBy(Path.GetFileName, StringComparer.OrdinalIgnoreCase))
            {
                if (!ModDatabase.TryReadHeader(file, out DataHeader header))
                    continue;

                string name = Path.GetFileNameWithoutExtension(file);
                string marker = activePath != null && PathsEqual(activePath, file) ? "*" : " ";
                output.Append($"{marker}{name.PadRight(20)} {header.Sectors.ToString().PadRight(8)} {header.Address}\r\n");
            }

            output.Append("\r\n");
            await _gameInstance.SendMessageAsync(output.ToString());
        }

        private async Task CreateDatabaseAsync(string nameInput, int sectorCount)
        {
            string? path = ResolveDatabasePath(nameInput);
            if (path == null)
            {
                await _gameInstance.SendMessageAsync("\r\nDatabase name cannot be empty.\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            Directory.CreateDirectory(Path.GetDirectoryName(path)!);

            if (File.Exists(path))
            {
                await _gameInstance.SendMessageAsync($"\r\nDatabase already exists: {Path.GetFileName(path)}\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            DataHeader template = GetCurrentDatabase()?.DBHeader ?? new DataHeader();
            template.Sectors = sectorCount > 0 ? sectorCount : 5000;
            template.Address ??= string.Empty;
            if (template.ServerPort == 0)
                template.ServerPort = 2002;
            if (template.ListenPort == 0)
                template.ListenPort = 2300;
            if (template.CommandChar == '\0')
                template.CommandChar = _gameInstance.CommandChar;

            var tempDb = new ModDatabase { ProgramDir = GlobalModules.ProgramDir };
            tempDb.CreateDatabase(path, template);
            tempDb.CloseDatabase();

            await _gameInstance.SendMessageAsync($"\r\nCreated database: {Path.GetFileName(path)}\r\n");
            await ShowDatabaseMenuPromptAsync();
        }

        private async Task BeginDatabaseEditAsync(string input)
        {
            string? path = ResolveDatabasePath(input);
            if (path == null || !File.Exists(path))
            {
                await _gameInstance.SendMessageAsync("\r\nUnable to find that database.\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            _workflowArgs.Clear();
            _workflowArgs.Add(path);
            await EnterInputModeAsync("\r\nEnter new server address (blank for no change): ", InputMode.DatabaseEditAddress);
        }

        private async Task ApplyDatabaseEditAsync(bool includeLoginDetails)
        {
            if (_workflowArgs.Count == 0)
            {
                await _gameInstance.SendMessageAsync("\r\nDatabase edit state was lost.\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            string path = _workflowArgs[0];
            if (!File.Exists(path))
            {
                await _gameInstance.SendMessageAsync("\r\nUnable to find that database.\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            DataHeader header;
            using (var db = new ModDatabase { ProgramDir = GlobalModules.ProgramDir })
            {
                db.OpenDatabase(path);
                header = db.DBHeader;

                if (_workflowArgs.Count > 1 && !string.IsNullOrWhiteSpace(_workflowArgs[1]))
                    header.Address = _workflowArgs[1];

                if (_workflowArgs.Count > 2 && ushort.TryParse(_workflowArgs[2], out ushort serverPort) && serverPort > 0)
                    header.ServerPort = serverPort;

                bool useLogin = _workflowArgs.Count > 3 && _workflowArgs[3].Equals("Y", StringComparison.OrdinalIgnoreCase);
                header.UseLogin = useLogin;

                if (includeLoginDetails)
                {
                    if (_workflowArgs.Count > 4 && !string.IsNullOrWhiteSpace(_workflowArgs[4]))
                        header.LoginScript = _workflowArgs[4];
                    if (_workflowArgs.Count > 5 && !string.IsNullOrWhiteSpace(_workflowArgs[5]))
                        header.LoginName = _workflowArgs[5];
                    if (_workflowArgs.Count > 6 && !string.IsNullOrWhiteSpace(_workflowArgs[6]))
                        header.Password = _workflowArgs[6];
                    if (_workflowArgs.Count > 7 && !string.IsNullOrWhiteSpace(_workflowArgs[7]))
                        header.Game = _workflowArgs[7][0];
                }

                db.ReplaceHeader(header);
                db.SaveDatabase();
                db.CloseDatabase();
            }

            if (GetCurrentDatabase() is ModDatabase activeDb && PathsEqual(activeDb.DatabasePath, path))
            {
                activeDb.CloseDatabase();
                activeDb.OpenDatabase(path);
            }

            _workflowArgs.Clear();
            await _gameInstance.SendMessageAsync($"\r\nChanges saved to database: {Path.GetFileName(path)}\r\n");
            await ShowDatabaseMenuPromptAsync();
        }

        private async Task DeleteDatabaseAsync(string input)
        {
            string? path = ResolveDatabasePath(input);
            if (path == null || !File.Exists(path))
            {
                await _gameInstance.SendMessageAsync("\r\nUnable to find that database.\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            ModDatabase? activeDb = GetCurrentDatabase();
            if (activeDb != null && activeDb.IsOpen && PathsEqual(activeDb.DatabasePath, path))
                activeDb.CloseDatabase();

            File.Delete(path);
            string cfgPath = Path.ChangeExtension(path, ".cfg");
            if (File.Exists(cfgPath))
                File.Delete(cfgPath);

            await _gameInstance.SendMessageAsync($"\r\nDeleting database: {Path.GetFileName(path)}\r\n");
            await ShowDatabaseMenuPromptAsync();
        }

        private async Task SelectDatabaseAsync(string input)
        {
            string? path = ResolveDatabasePath(input);
            if (path == null || !File.Exists(path))
            {
                await _gameInstance.SendMessageAsync("\r\nUnable to find that database.\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            ModDatabase? db = GetCurrentDatabase();
            if (db == null)
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database module is available.\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            db.CloseDatabase();
            db.OpenDatabase(path);
            await ExitMenuAsync();
        }

        private async Task ViewDatabaseAsync(string input)
        {
            string? path = ResolveDatabasePath(input);
            if (path == null || !File.Exists(path))
            {
                await _gameInstance.SendMessageAsync("\r\nUnable to open this database.\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            if (!ModDatabase.TryReadHeader(path, out DataHeader header))
            {
                await _gameInstance.SendMessageAsync("\r\nUnable to open this database.\r\n");
                await ShowDatabaseMenuPromptAsync();
                return;
            }

            string useLogin = header.UseLogin ? "YES" : "NO";
            var output = new StringBuilder();
            output.Append($"\r\nDetails for TWX Proxy database '{Path.GetFileName(path)}':\r\n\r\n");
            output.Append($"Size: {header.Sectors}\r\n");
            output.Append($"Server: {header.Address}\r\n");
            output.Append($"Port: {header.ServerPort}\r\n");
            output.Append($"Listen Port: {header.ListenPort}\r\n");
            output.Append($"Use login script: {useLogin}\r\n");
            if (header.UseLogin)
            {
                output.Append($"Login script: {header.LoginScript}\r\n");
                output.Append($"Login name: {header.LoginName}\r\n");
                output.Append($"Login password: {header.Password}\r\n");
                output.Append($"Game letter: {header.Game}\r\n");
            }

            output.Append($"Menu key: {header.CommandChar}\r\n\r\n");
            await _gameInstance.SendMessageAsync(output.ToString());
            await ShowDatabaseMenuPromptAsync();
        }

        private async Task ShowSectorQueryAsync(string heading, Func<SectorData, bool> predicate)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (db == null || db.DBHeader.Sectors <= 0)
            {
                await _gameInstance.SendMessageAsync("\r\nNo active database is open.\r\n");
                await ShowDataMenuPromptAsync();
                return;
            }

            var output = new StringBuilder();
            output.Append("\r\n").Append(heading).Append("\r\n\r\n");

            for (int i = 1; i <= db.DBHeader.Sectors; i++)
            {
                SectorData? sector = GetSectorData(db, i);
                if (sector != null && predicate(sector))
                    output.Append(FormatSectorDisplay(sector)).Append("\r\n");
            }

            output.Append("Completed.\r\n\r\n");
            await _gameInstance.SendMessageAsync(output.ToString());
            await ShowDataMenuPromptAsync();
        }

        private static string TranslateBurstText(string text) => text.Replace("*", "\r", StringComparison.Ordinal);

        private async Task PromptForCommandHelpAsync()
        {
            await EnterInputModeAsync("\r\nEnter command for help: ", InputMode.CommandHelp);
        }

        private async Task EnterInputModeAsync(string prompt, InputMode mode, string? seed = null)
        {
            _inputMode = mode;
            _inputBuffer.Clear();
            if (!string.IsNullOrEmpty(seed))
                _inputBuffer.Append(seed);

            await _gameInstance.SendMessageAsync(prompt);
            if (!string.IsNullOrEmpty(seed))
                await _gameInstance.SendMessageAsync(seed);
        }

        private static int ParseInt(string input)
        {
            return int.TryParse(input, out int value) ? value : 0;
        }

        private static int Percent(int part, int whole)
        {
            return whole > 0 ? (part * 100) / whole : 0;
        }

        private static bool IsFriendlyOwner(string? owner)
        {
            if (string.IsNullOrWhiteSpace(owner))
                return false;

            string value = owner.Trim();
            return value.Equals("belong to your Corp", StringComparison.OrdinalIgnoreCase)
                || value.Equals("yours", StringComparison.OrdinalIgnoreCase);
        }

        private static string FormatOnOff(bool value) => value ? "ON" : "OFF";

        private static string Spaces(int count) => count > 0 ? new string(' ', count) : string.Empty;

        private static string FormatProductType(ProductType type)
        {
            return type switch
            {
                ProductType.FuelOre => "Fuel Ore",
                ProductType.Organics => "Organics",
                ProductType.Equipment => "Equipment",
                _ => type.ToString()
            };
        }

        private static bool IsUpgradedPort(Port port)
        {
            foreach (ProductType product in Enum.GetValues<ProductType>())
            {
                int percent = port.ProductPercent[product] + 1;
                if (percent <= 0)
                    continue;

                double max = port.ProductAmount[product] * (100.0 / percent);
                if (max >= 10000)
                    return true;
            }

            return false;
        }

        private static string FormatPortClass(Port port)
        {
            if (port.ClassIndex == 0 || port.ClassIndex == 9)
                return "Special";

            var sb = new StringBuilder();
            sb.Append(port.BuyProduct[ProductType.FuelOre] ? 'B' : 'S');
            sb.Append(port.BuyProduct[ProductType.Organics] ? 'B' : 'S');
            sb.Append(port.BuyProduct[ProductType.Equipment] ? 'B' : 'S');
            return sb.ToString();
        }

        private static string FormatSectorDisplay(SectorData sector)
        {
            var output = new StringBuilder();
            string lastSeen = sector.Update == default
                ? "Unknown"
                : $"{sector.Update:M/d/yyyy} at {sector.Update:h:mm:ss tt}";

            output.Append($"Last seen on {lastSeen}\r\n\r\n");
            output.Append($"Sector      : {sector.Number} in {FormatString(sector.Constellation, "uncharted space.")}\r\n");

            if (sector.Density >= 0)
            {
                output.Append($"Density     : {sector.Density}");
                if (sector.Anomaly)
                    output.Append(" (Anomaly)");
                output.Append("\r\n");
            }

            if (!string.IsNullOrWhiteSpace(sector.Beacon))
                output.Append($"Beacon      : {sector.Beacon}\r\n");

            if (sector.SectorPort != null && !sector.SectorPort.Dead && !string.IsNullOrWhiteSpace(sector.SectorPort.Name))
            {
                output.Append($"Port        : {sector.SectorPort.Name}, Class {sector.SectorPort.ClassIndex} ({FormatPortClass(sector.SectorPort)})\r\n");
                if (sector.SectorPort.BuildTime > 0)
                    output.Append($"              Under Construction - {sector.SectorPort.BuildTime} days left\r\n");
            }

            if (sector.PlanetNames.Count > 0)
                output.Append($"Planets     : {string.Join(", ", sector.PlanetNames)}\r\n");

            if (sector.Traders.Count > 0)
                output.Append($"Traders     : {string.Join(", ", sector.Traders.Select(trader => $"{trader.Name} ({trader.Fighters} figs)"))}\r\n");

            if (sector.Ships.Count > 0)
                output.Append($"Ships       : {string.Join(", ", sector.Ships.Select(ship => $"{ship.Name} ({ship.Owner})"))}\r\n");

            if (sector.Fighters.Quantity > 0)
                output.Append($"Fighters    : {sector.Fighters.Quantity} ({sector.Fighters.Owner}) [{sector.Fighters.FigType}]\r\n");

            if (sector.MinesArmid.Quantity > 0)
                output.Append($"Armid Mines : {sector.MinesArmid.Quantity} ({sector.MinesArmid.Owner})\r\n");

            if (sector.MinesLimpet.Quantity > 0)
                output.Append($"Limpet Mines: {sector.MinesLimpet.Quantity} ({sector.MinesLimpet.Owner})\r\n");

            output.Append($"Warps       : {string.Join(" ", sector.Warp.Where(w => w > 0))}\r\n");

            if (sector.WarpsIn.Count > 0)
                output.Append($"Warps In    : {string.Join(" ", sector.WarpsIn.OrderBy(value => value))}\r\n");

            return output.ToString();
        }

        private static string FormatPortDisplay(SectorData sector)
        {
            Port port = sector.SectorPort!;
            string updated = port.Update == default
                ? "Unknown"
                : $"{port.Update:h:mm:ss tt} {port.Update:M/d/yyyy}";

            var output = new StringBuilder();
            output.Append($"Commerce report for {port.Name} (sector {sector.Number}): {updated}\r\n\r\n");
            output.Append("Items       Status   Trading  % of max\r\n");
            output.Append("-----       ------   -------  --------\r\n");

            foreach (ProductType product in Enum.GetValues<ProductType>())
            {
                string status = port.BuyProduct[product] ? "Buying" : "Selling";
                string name = FormatProductType(product).PadRight(11);
                output.Append($"{name} {status.PadRight(8)} {port.ProductAmount[product].ToString().PadLeft(7)} {port.ProductPercent[product].ToString().PadLeft(8)}%\r\n");
            }

            return output.ToString();
        }

        private static string FormatPortSummary(SectorData sector)
        {
            Port port = sector.SectorPort!;
            string portClass = FormatPortClass(port);
            string fuel = FormatPortSummaryProduct(port, ProductType.FuelOre);
            string organics = FormatPortSummaryProduct(port, ProductType.Organics);
            string equipment = FormatPortSummaryProduct(port, ProductType.Equipment);
            string updated = port.Update == default ? "Not Updated" : port.Update.ToString("M/d/yyyy h:mm:ss tt");

            return $"{sector.Number.ToString().PadRight(7)} {portClass.PadRight(5)} {fuel.PadRight(15)} {organics.PadRight(15)} {equipment.PadRight(15)} {updated}";
        }

        private static string FormatPortSummaryProduct(Port port, ProductType product)
        {
            return $"{port.ProductAmount[product]} ({port.ProductPercent[product]}%)";
        }

        private static string FormatString(string? value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        private ModDatabase? GetCurrentDatabase() => GlobalModules.Database as ModDatabase;

        private static bool TryGetOpenDatabase(ModDatabase? db)
            => db != null && db.IsOpen && db.DBHeader.Sectors > 0;

        private string DefaultWarpDataFileName() => "warpspec.txt";

        private string DefaultBubbleFileName() => "bubbles.txt";

        private string DefaultDeadendFileName() => "deadends.txt";

        private string DefaultTwxFileName()
        {
            string name = GetCurrentDatabase()?.DatabaseName ?? string.Empty;
            return (string.IsNullOrWhiteSpace(name) ? "database" : name) + ".twx";
        }

        private string GetTransferDirectory()
        {
            if (!string.IsNullOrWhiteSpace(GlobalModules.ProgramDir))
                return GlobalModules.ProgramDir;

            ModDatabase? db = GetCurrentDatabase();
            if (db != null && !string.IsNullOrWhiteSpace(db.DatabasePath))
            {
                string? directory = Path.GetDirectoryName(db.DatabasePath);
                if (!string.IsNullOrWhiteSpace(directory))
                    return directory;
            }

            return Environment.CurrentDirectory;
        }

        private string ResolveTransferPath(string input, string defaultFileName, string extension)
        {
            string fileName = string.IsNullOrWhiteSpace(input) ? defaultFileName : input.Trim();

            if (!string.IsNullOrEmpty(extension) &&
                !fileName.EndsWith(extension, StringComparison.OrdinalIgnoreCase))
            {
                fileName += extension;
            }

            if (Path.IsPathRooted(fileName))
                return Path.GetFullPath(fileName);

            return Path.GetFullPath(Path.Combine(GetTransferDirectory(), fileName));
        }

        private ModBubble GetBubbleModule()
        {
            if (GlobalModules.TWXBubble is ModBubble bubble)
                return bubble;

            bubble = new ModBubble();
            GlobalModules.TWXBubble = bubble;
            return bubble;
        }

        private SectorData? GetSectorData(ModDatabase db, int sectorNumber)
        {
            Sector? sector = db.LoadSector(sectorNumber);
            if (sector is SectorData data)
                return data;

            if (sector == null)
                return null;

            return new SectorData
            {
                Number = sectorNumber,
                Warp = sector.Warp,
                Explored = sector.Explored,
                SectorName = sector.SectorName,
                Ports = sector.Ports,
                Planets = sector.Planets,
                Traders = new List<Trader>(),
                Ships = new List<Ship>(),
                Density = sector.Density,
                Beacon = sector.Beacon.ToString(),
                Anomaly = sector.Anomaly,
                Constellation = sector.Constellation.ToString()
            };
        }

        private bool TryGetValidSector(ModDatabase? db, int sectorNumber, out SectorData? sector, out string error)
        {
            sector = null;
            error = "\r\nNo active database is open.\r\n";

            if (db == null || db.DBHeader.Sectors <= 0)
                return false;

            if (sectorNumber < 1 || sectorNumber > db.DBHeader.Sectors)
            {
                error = "\r\nThat is not a valid sector.\r\n";
                return false;
            }

            sector = GetSectorData(db, sectorNumber);
            if (sector == null)
            {
                error = "\r\nThat sector has not been recorded.\r\n";
                return false;
            }

            return true;
        }

        private string GetDatabaseDirectory()
        {
            ModDatabase? db = GetCurrentDatabase();
            if (db != null && !string.IsNullOrWhiteSpace(db.DatabasePath))
            {
                string? directory = Path.GetDirectoryName(db.DatabasePath);
                if (!string.IsNullOrWhiteSpace(directory))
                    return directory;
            }

            return Path.Combine(GlobalModules.ProgramDir, "data");
        }

        private string? ResolveDatabasePath(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return null;

            string fileName = input.Trim();
            if (!fileName.EndsWith(".xdb", StringComparison.OrdinalIgnoreCase))
                fileName += ".xdb";

            if (Path.IsPathRooted(fileName))
                return fileName;

            return Path.Combine(GetDatabaseDirectory(), fileName);
        }

        private static bool PathsEqual(string left, string right)
        {
            return string.Equals(Path.GetFullPath(left), Path.GetFullPath(right), StringComparison.OrdinalIgnoreCase);
        }

        private async Task<bool> UpdateActiveDatabaseHeaderAsync(Action<DataHeader> updater)
        {
            ModDatabase? db = GetCurrentDatabase();
            if (db == null || !db.IsOpen)
                return false;

            DataHeader header = db.DBHeader;
            updater(header);
            db.ReplaceHeader(header);
            db.SaveDatabase();
            await Task.CompletedTask;
            return true;
        }

        private void StoreWorkflowValue(string value)
        {
            _workflowArgs.Add(value);
        }

        private static string? GetCommandHelpText(MenuState menu, char command)
        {
            char key = char.ToUpperInvariant(command);
            return menu switch
            {
                MenuState.Main => key switch
                {
                    'B' => "Send burst: sends a block of text straight to the remote server. Use * anywhere you want an ENTER in the burst.",
                    'R' => "Repeat last burst: resends the last burst exactly as entered.",
                    'E' => "Edit/Send last burst: loads the previous burst so you can adjust it before sending.",
                    'C' => "Connect/Disconnect from server: immediately opens or closes the remote server connection.",
                    'D' => "Data menu: database queries including sectors, density, traders, bubbles, and path plotting.",
                    'P' => "Port menu: shows recorded port details and summaries.",
                    'S' => "Script menu: load, inspect, and control proxy scripts.",
                    'T' => "Setup menu: proxy runtime options and database management.",
                    'Z' => "Stop all scripts: immediately terminates all active interruptible scripts and modes.",
                    'H' => "Toggle native haggle: enables or disables the built-in C# haggle engine.",
                    '-' => "Show all clients: lists the terminals attached to this proxy.",
                    '/' => "Streaming mode: toggles a reduced-output client mode for safer screen sharing.",
                    '=' => "Toggle deaf client: turns the current client into a no-output client.",
                    'X' => "Exit Program: shuts down the proxy and disconnects from the server.",
                    _ => null
                },
                MenuState.Data => key switch
                {
                    'D' => "Display sector as last seen: shows the recorded sector display for a specific sector.",
                    'F' => "Show all sectors with foreign fighters: scans the database for sectors with non-friendly fighters.",
                    'M' => "Show all sectors with mines: scans the database for sectors with recorded mines.",
                    'S' => "Show all sectors by density comparison: lists sectors whose recorded density falls within a range.",
                    'A' => "Show all sectors with Anomaly: lists sectors where density scans recorded an anomaly.",
                    'R' => "Show all sectors with traders: lists sectors containing traders the proxy has seen.",
                    'C' => "Plot warp course: calculates the shortest known warp course between two sectors.",
                    'H' => "Simulate holo scan: shows the recorded adjacent sectors around a given sector.",
                    'T' => "Show total sectors scanned: summarizes visual, density, and calculated mapping coverage.",
                    'B' => "Show bubbles found: calculates and lists known bubbles from the current database.",
                    'Z' => "Show bubble details: shows the contents of a specific bubble when given a gate and interior sector.",
                    '-' => "Show backdoors to specific sector: lists sectors that warp into the target without being a direct outbound warp.",
                    'X' => "Import/export data: opens transfer commands for warp text files, bubble/deadend lists, and TWX binary files.",
                    _ => null
                },
                MenuState.DataTransfer => key switch
                {
                    'E' => "Export warp data: writes classic warpspec text data, defaulting to warpspec.txt.",
                    'I' => "Import warp data: reads classic warpspec text data and merges outbound warps into the active database.",
                    'B' => "Export bubble list: writes the TWX bubble list format, defaulting to bubbles.txt.",
                    'D' => "Export deadend list: writes one deadend sector number per line, defaulting to deadends.txt.",
                    'T' => "Export TWX file: writes the classic TWEX binary interchange format from the active database.",
                    'W' => "Import TWX file: reads the classic TWEX binary interchange format into the active database.",
                    _ => null
                },
                MenuState.Port => key switch
                {
                    'D' => "Show port details as last seen: displays the last recorded commerce report for a sector.",
                    '0' => "Show all class 0/9 ports: lists special ports such as Stardock and class 0 ports.",
                    'L' => "List all ports: shows a summary of every recorded standard port.",
                    'U' => "List all heavily upgraded ports: shows ports with a projected max of 10,000 or more in a product line.",
                    _ => null
                },
                MenuState.Script => key switch
                {
                    'S' => "Load script: loads and begins execution of a TWX script or compiled CTS file.",
                    'L' => "Load last script: reloads the last script loaded in this session.",
                    'V' => "Dump script variables: displays variables and their current values for running scripts.",
                    'T' => "Dump active triggers: lists all currently active triggers for running scripts.",
                    'I' => "List active scripts: lists running scripts and their IDs.",
                    'D' => "List script directory: shows the scripts available in the scripts folder.",
                    'K' => "Kill script by ID: terminates the script with the specified numeric ID.",
                    'X' => "Terminate current script and exit menu: stops the most recent interruptible script or mode.",
                    'Z' => "Stop all scripts: immediately terminates all interruptible scripts and modes.",
                    _ => null
                },
                MenuState.Setup => key switch
                {
                    'D' => "Database submenu: create, edit, select, list, and inspect databases.",
                    'P' => "Listen port: saves the proxy listen port in the active database. Restart the proxy to apply it.",
                    'B' => "Max bubble size: changes the largest bubble size the bubble calculator will search.",
                    'R' => "Auto reconnect: when enabled, the proxy will automatically reconnect after disconnects.",
                    'L' => "Logging: toggles capture of server data to the session log file.",
                    'A' => "Log ANSI: toggles inclusion of ANSI color/control codes in the session log file.",
                    'X' => "Accept external connects: allows clients outside the local machine/network to connect.",
                    'C' => "Database cache: toggles in-memory caching for faster database lookups.",
                    'E' => "Recording: toggles whether incoming game data is written back into the active database.",
                    'K' => "Terminal menu key: changes the key that opens the proxy menu.",
                    'H' => "Local echo: echoes typed keys locally before the remote host sends them back.",
                    _ => null
                },
                MenuState.Database => key switch
                {
                    'C' => "Create database: creates a new database file in the current database directory.",
                    'E' => "Edit database: updates server/login details for an existing database.",
                    'D' => "Delete database: permanently removes a database file and its companion CFG file.",
                    'S' => "Select active database: closes the current database and opens the selected one.",
                    'L' => "List databases: lists known databases in the current database directory.",
                    'V' => "View database details: shows header information for a database.",
                    _ => null
                },
                _ => null
            };
        }
    }
}
