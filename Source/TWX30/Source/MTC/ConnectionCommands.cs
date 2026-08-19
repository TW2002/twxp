using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Avalonia;
using Avalonia.Platform;
using Avalonia.Platform.Storage;
using SkiaSharp;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Controls.Primitives;
using Avalonia.Input;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Core = TWXProxy.Core;

namespace MTC;

public partial class MainWindow
{
    /// <summary>File > Edit Connection: update the shared game config in-place.</summary>
    private async Task OnEditConnectionAsync()
    {
        string previousGameName = DeriveGameName();
        string previousConfigPath = _currentProfilePath ?? GameConfigPathForMode(previousGameName, _state.EmbeddedProxy);
        string previousDatabasePath = _embeddedGameConfig?.DatabasePath ?? string.Empty;
        string previousHost = _embeddedGameConfig?.Host ?? _state.Host;
        int previousPort = _embeddedGameConfig?.Port > 0 ? _embeddedGameConfig.Port : _state.Port;
        bool previousListenForConnections = _embeddedGameConfig?.Mtc?.ListenForConnections ?? _state.ListenForConnections;
        int previousListenPort = _embeddedGameConfig?.ListenPort > 0
            ? _embeddedGameConfig.ListenPort
            : _state.ListenPort;
        if (string.IsNullOrWhiteSpace(previousDatabasePath))
            previousDatabasePath = DatabasePathForMode(previousGameName, _state.EmbeddedProxy);

        var dlg = new NewConnectionDialog(BuildProfileFromState(), proxyServers: _appPrefs.ProxyServers);
        if (!await dlg.ShowDialog<bool>(this) || dlg.Result == null) return;

        ConnectionProfile? uniqueEditedProfile = await EnsureUniqueProfileAsync(
            dlg.Result,
            currentConfigPath: previousConfigPath,
            currentDatabasePath: previousDatabasePath);
        if (uniqueEditedProfile == null)
            return;

        ConnectionProfile editedProfile = uniqueEditedProfile;
        string resolvedGameName = editedProfile.Name;

        string targetDatabasePath = previousDatabasePath;
        string oldDefaultDatabasePath = DatabasePathForMode(previousGameName, _state.EmbeddedProxy);
        if (!string.Equals(previousGameName, resolvedGameName, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(previousDatabasePath, oldDefaultDatabasePath, StringComparison.OrdinalIgnoreCase))
        {
            targetDatabasePath = DatabasePathForMode(resolvedGameName, editedProfile.EmbeddedProxy);
            try
            {
                if (File.Exists(previousDatabasePath) && !File.Exists(targetDatabasePath))
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(targetDatabasePath)!);
                    File.Move(previousDatabasePath, targetDatabasePath);
                }
            }
            catch
            {
                targetDatabasePath = previousDatabasePath;
            }
        }

        EmbeddedGameConfig config = BuildEmbeddedGameConfigFromProfile(
            editedProfile,
            string.IsNullOrWhiteSpace(targetDatabasePath) ? DatabasePathForMode(resolvedGameName, editedProfile.EmbeddedProxy) : targetDatabasePath,
            _embeddedGameConfig);
        await SaveEmbeddedGameConfigAsync(resolvedGameName, config);
        TwEditCatalogService.ApplyEditDefaults(resolvedGameName, editedProfile.EditId);

        string newConfigPath = GameConfigPathForMode(resolvedGameName, editedProfile.EmbeddedProxy);
        if (!string.IsNullOrWhiteSpace(previousConfigPath) &&
            !string.Equals(previousConfigPath, newConfigPath, StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                if (File.Exists(previousConfigPath))
                    File.Delete(previousConfigPath);
            }
            catch { }
        }

        _currentProfilePath = newConfigPath;
        _embeddedGameConfig = config;
        _embeddedGameName = resolvedGameName;
        ApplyProfile(BuildProfileFromConfig(config));
        UpdateOpenStandaloneDatabaseHeader(config);
        ApplyDebugLoggingPreferences();
        AddToRecentAndSave(newConfigPath);
        await SyncEmbeddedProxySettingsAsync(
            previousHost,
            previousPort,
            previousListenForConnections,
            previousListenPort);

        _parser.Feed($"\x1b[1;36m[Connection settings updated]\x1b[0m\r\n");
        _buffer.Dirty = true;
    }

    private void UpdateOpenStandaloneDatabaseHeader(EmbeddedGameConfig config)
    {
        if (_state.EmbeddedProxy || _sessionDb == null)
            return;

        try
        {
            Core.DataHeader header = _sessionDb.DBHeader;
            bool headerDirty = false;
            int sectors = config.Sectors > 0 ? config.Sectors : _state.Sectors;
            if (sectors > 0)
            {
                headerDirty |= header.Sectors != sectors;
                header.Sectors = sectors;
            }

            headerDirty |= header.Address != _state.Host;
            header.Address = _state.Host;
            headerDirty |= header.ServerPort != (ushort)_state.Port;
            header.ServerPort = (ushort)_state.Port;

            if (headerDirty)
            {
                _sessionDb.ReplaceHeader(header);
                _sessionDb.SaveDatabase();
            }
        }
        catch (Exception ex)
        {
            Core.GlobalModules.DebugLog($"[MTC.EditConnection] failed to update standalone database header: {ex}\n");
        }
    }

    private async Task SyncEmbeddedProxySettingsAsync(
        string? previousHostOverride = null,
        int? previousPortOverride = null,
        bool? previousListenForConnectionsOverride = null,
        int? previousListenPortOverride = null)
    {
        if (!_state.EmbeddedProxy)
        {
            if (_gameInstance != null)
                await StopEmbeddedAsync();
            return;
        }

        string gameName = GetEmbeddedGameName();
        if (!CanCurrentMtcTabAdoptGameIdentity(gameName, "sync-embedded-proxy"))
            return;

        var gameConfig = _embeddedGameConfig ?? await LoadOrCreateEmbeddedGameConfigAsync(gameName);
        gameConfig.Mtc ??= new EmbeddedMtcConfig();
        string? originalNativeHaggleMode = gameConfig.NativeHaggleMode;
        gameConfig.NativeHaggleMode = null;
        string previousHost = previousHostOverride ?? gameConfig.Host;
        int previousPort = previousPortOverride ?? gameConfig.Port;
        bool previousListenForConnections =
            previousListenForConnectionsOverride ?? gameConfig.Mtc.ListenForConnections;
        int previousListenPort = previousListenPortOverride ?? gameConfig.ListenPort;

        bool configChanged =
            !string.Equals(originalNativeHaggleMode ?? string.Empty, gameConfig.NativeHaggleMode ?? string.Empty, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(gameConfig.Name, gameName, StringComparison.Ordinal) ||
            gameConfig.Host != _state.Host ||
            gameConfig.Port != _state.Port ||
            gameConfig.Sectors != _state.Sectors ||
            gameConfig.ListenPort != _state.ListenPort ||
            gameConfig.Mtc.ListenForConnections != _state.ListenForConnections;

        gameConfig.Name = gameName;
        gameConfig.Host = _state.Host;
        gameConfig.Port = _state.Port;
        gameConfig.Sectors = _state.Sectors;
        gameConfig.ListenPort = NormalizeListenPort(_state.ListenPort);
        gameConfig.Mtc.ListenForConnections = _state.ListenForConnections;

        if (configChanged)
            await SaveEmbeddedGameConfigAsync(gameName, gameConfig);

        _embeddedGameConfig = gameConfig;
        _embeddedGameName = gameName;

        if (_sessionDb != null)
        {
            var header = _sessionDb.DBHeader;
            bool headerDirty = false;
            if (gameConfig.Sectors > 0)
            {
                headerDirty |= header.Sectors != gameConfig.Sectors;
                header.Sectors = gameConfig.Sectors;
            }
            headerDirty |= header.Address != _state.Host;
            header.Address = _state.Host;
            headerDirty |= header.ServerPort != (ushort)_state.Port;
            header.ServerPort = (ushort)_state.Port;
            headerDirty |= header.ListenPort != (ushort)gameConfig.ListenPort;
            header.ListenPort = (ushort)gameConfig.ListenPort;
            headerDirty |= header.CommandChar != (gameConfig.CommandChar == '\0' ? '$' : gameConfig.CommandChar);
            header.CommandChar = gameConfig.CommandChar == '\0' ? '$' : gameConfig.CommandChar;
            string configLoginScript = string.IsNullOrWhiteSpace(gameConfig.LoginScript) ? "0_Login.cts" : gameConfig.LoginScript;
            string configLoginName = gameConfig.LoginName ?? string.Empty;
            string configPassword = gameConfig.Password ?? string.Empty;
            char configGameChar = string.IsNullOrWhiteSpace(gameConfig.GameLetter) ? '\0' : char.ToUpperInvariant(gameConfig.GameLetter[0]);
            headerDirty |= header.UseLogin != gameConfig.UseLogin;
            header.UseLogin = gameConfig.UseLogin;
            headerDirty |= header.UseRLogin != gameConfig.UseRLogin;
            header.UseRLogin = gameConfig.UseRLogin;
            headerDirty |= header.LoginScript != configLoginScript;
            header.LoginScript = configLoginScript;
            headerDirty |= header.LoginName != configLoginName;
            header.LoginName = configLoginName;
            headerDirty |= header.Password != configPassword;
            header.Password = configPassword;
            headerDirty |= header.Game != configGameChar;
            header.Game = configGameChar;
            _sessionDb.ReplaceHeader(header);
            if (headerDirty)
                _sessionDb.SaveDatabase();
            Core.ScriptRef.SetActiveDatabase(ResolveCurrentMtcTabContext()?.RuntimeContext ?? ActiveMtcRuntimeContext, _sessionDb);
        }

        if (_gameInstance == null)
            return;

        ApplySessionLogSettings(gameConfig);
        _gameInstance.AutoReconnect = _state.AutoReconnect;
        _gameInstance.ReconnectDelayMs = Math.Max(1, gameConfig.ReconnectDelaySeconds) * 1000;
        _gameInstance.LocalEcho = gameConfig.LocalEcho;
        _gameInstance.AcceptExternal = gameConfig.AcceptExternal;
        _gameInstance.AllowLerkers = gameConfig.AllowLerkers;
        _gameInstance.ExternalAddress = gameConfig.ExternalAddress ?? string.Empty;
        _gameInstance.BroadCastMsgs = gameConfig.BroadcastMessages;
        _gameInstance.Logger.LogEnabled = false;
        _gameInstance.Logger.LogData = false;
        _gameInstance.Logger.LogAnsiCompanion = gameConfig.LogAnsiCompanion;
        _gameInstance.Logger.LogANSI = gameConfig.LogAnsiCompanion ? false : gameConfig.LogAnsi;
        _gameInstance.Logger.BinaryLogs = gameConfig.LogBinary;
        _gameInstance.Logger.NotifyPlayCuts = gameConfig.NotifyPlayCuts;
        _gameInstance.Logger.MaxPlayDelay = gameConfig.MaxPlayDelay;
        _gameInstance.SetNativeHaggleEnabled(gameConfig.NativeHaggleEnabled, Core.NativeHaggleChangeSource.Config);
        Core.GlobalModules.DebugLog(
            $"[MTC] Embedded haggle sync prefsPortMode={ResolveGlobalPortHaggleMode()} prefsPlanetMode={ResolveGlobalPlanetHaggleMode()} legacyGameMode={gameConfig.NativeHaggleMode ?? "-"}\n");
        _gameInstance.SetNativeHaggleModes(ResolveGlobalPortHaggleMode(), ResolveGlobalPlanetHaggleMode());

        bool endpointChanged = !string.Equals(previousHost, _state.Host, StringComparison.Ordinal) || previousPort != _state.Port;
        bool listenerChanged = previousListenForConnections != gameConfig.Mtc.ListenForConnections ||
                               NormalizeListenPort(previousListenPort) != gameConfig.ListenPort;
        if (listenerChanged)
        {
            try
            {
                await _gameInstance.ConfigureLocalListenerAsync(
                    gameConfig.Mtc.ListenForConnections,
                    gameConfig.ListenPort);
            }
            catch (Exception ex)
            {
                _parser.Feed($"\x1b[1;31m[Listen failed: {ex.Message}]\x1b[0m\r\n");
                Core.GlobalModules.DebugLog($"[MTC.EditConnection] failed to configure listener: {ex}\n");
            }
        }

        if (!_gameInstance.IsConnected && endpointChanged)
        {
            await StopEmbeddedAsync();
            await DoConnectEmbeddedAsync();
        }
    }

    private async Task OnNewConnectionAsync()
    {
        var dlg = new NewConnectionDialog(proxyServers: _appPrefs.ProxyServers);
        if (!await dlg.ShowDialog<bool>(this) || dlg.Result == null) return;

        ConnectionProfile? uniqueNewProfile = await EnsureUniqueProfileAsync(dlg.Result);
        if (uniqueNewProfile == null)
            return;

        ConnectionProfile newProfile = uniqueNewProfile;
        string gameName = newProfile.Name;
        string path = GameConfigPathForMode(gameName, newProfile.EmbeddedProxy);
        EmbeddedGameConfig config = BuildEmbeddedGameConfigFromProfile(
            newProfile,
            DatabasePathForMode(gameName, newProfile.EmbeddedProxy));
        await SaveEmbeddedGameConfigAsync(gameName, config);
        TwEditCatalogService.ApplyEditDefaults(gameName, newProfile.EditId);
        await ApplyLoadedGameConfigAsync(config, path, addToRecent: true);
        if (dlg.AutoSetupRequested)
            await ConfigureAndStartNativeMombotForAutoSetupAsync(newProfile);
    }

    /// <summary>File > Open: open or import a shared game JSON or a TWX database.</summary>
    private async Task OnOpenConnectionAsync()
    {
        var storage = TopLevel.GetTopLevel(this)?.StorageProvider;
        if (storage == null) return;

        AppPaths.EnsureTwxproxyGamesDir();
        var games = await storage.TryGetFolderFromPathAsync(AppPaths.TwxproxyGamesDir)
            ?? await GetHomeFolderAsync(storage);
        var files = await storage.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            Title                  = "Open Game",
            SuggestedStartLocation = games,
            AllowMultiple          = false,
            FileTypeFilter         =
            [
                new FilePickerFileType("TWX Game Config") { Patterns = ["*.json"] },
                new FilePickerFileType("TWX Database") { Patterns = ["*.xdb"] },
                new FilePickerFileType("Legacy MTC Connection") { Patterns = ["*.mtc"] },
                new FilePickerFileType("All Files")      { Patterns = ["*"]     },
            ],
        });
        if (files.Count == 0) return;

        string path = files[0].Path.LocalPath;
        await OpenPathAsync(path, addToRecent: true);
    }

    /// <summary>File > Save / Save As: persist the current shared game JSON.</summary>
    private async Task OnSaveConnectionAsync(bool saveAs = false)
    {
        if (!saveAs)
        {
            await SaveCurrentGameConfigAsync();
            if (_currentProfilePath != null)
                AddToRecentAndSave(_currentProfilePath);
            return;
        }

        var dlg = new NewConnectionDialog(BuildProfileFromState(), proxyServers: _appPrefs.ProxyServers);
        if (!await dlg.ShowDialog<bool>(this) || dlg.Result == null)
            return;

        ConnectionProfile? uniqueSaveAsProfile = await EnsureUniqueProfileAsync(
            dlg.Result,
            currentConfigPath: null,
            currentDatabasePath: null);
        if (uniqueSaveAsProfile == null)
            return;

        ConnectionProfile saveAsProfile = uniqueSaveAsProfile;
        string gameName = saveAsProfile.Name;
        string path = GameConfigPathForMode(gameName, saveAsProfile.EmbeddedProxy);
        string targetDatabasePath = DatabasePathForMode(gameName, saveAsProfile.EmbeddedProxy);
        string currentDatabasePath = _embeddedGameConfig?.DatabasePath ?? DatabasePathForMode(DeriveGameName(), _state.EmbeddedProxy);
        if (!string.IsNullOrWhiteSpace(currentDatabasePath) &&
            File.Exists(currentDatabasePath) &&
            !string.Equals(currentDatabasePath, targetDatabasePath, StringComparison.OrdinalIgnoreCase) &&
            !File.Exists(targetDatabasePath))
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(targetDatabasePath)!);
                File.Copy(currentDatabasePath, targetDatabasePath, overwrite: false);
            }
            catch { }
        }
        EmbeddedGameConfig config = BuildEmbeddedGameConfigFromProfile(
            saveAsProfile,
            targetDatabasePath,
            _embeddedGameConfig);
        await SaveEmbeddedGameConfigAsync(gameName, config);
        TwEditCatalogService.ApplyEditDefaults(gameName, saveAsProfile.EditId);
        await ApplyLoadedGameConfigAsync(config, path, addToRecent: true);
    }

    private async Task<string?> PickProxySavePathAsync(
        string title,
        string suggestedName,
        string extension,
        string typeName,
        params string[] patterns)
    {
        var storage = TopLevel.GetTopLevel(this)?.StorageProvider;
        if (storage == null) return null;

        var home = await GetHomeFolderAsync(storage);
        var file = await storage.SaveFilePickerAsync(new FilePickerSaveOptions
        {
            Title = title,
            SuggestedStartLocation = home,
            SuggestedFileName = suggestedName,
            DefaultExtension = extension,
            FileTypeChoices =
            [
                new FilePickerFileType(typeName) { Patterns = patterns },
            ],
        });
        return file?.Path.LocalPath;
    }

    private async Task<string?> PickProxyOpenPathAsync(
        string title,
        string typeName,
        params string[] patterns)
    {
        var storage = TopLevel.GetTopLevel(this)?.StorageProvider;
        if (storage == null) return null;

        var home = await GetHomeFolderAsync(storage);
        var files = await storage.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            Title = title,
            SuggestedStartLocation = home,
            AllowMultiple = false,
            FileTypeFilter =
            [
                new FilePickerFileType(typeName) { Patterns = patterns },
                new FilePickerFileType("All Files") { Patterns = ["*"] },
            ],
        });
        return files.Count > 0 ? files[0].Path.LocalPath : null;
    }

    private static async Task<IStorageFolder?> GetHomeFolderAsync(IStorageProvider storage)
    {
        var homePath = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        return await storage.TryGetFolderFromPathAsync(homePath);
    }

    private async Task<string?> ShowTextPromptAsync(string title, string prompt, string initialValue, string confirmText)
    {
        string? result = null;
        var input = new TextBox
        {
            Text = initialValue,
            MinWidth = 420,
        };
        var okBtn = new Button { Content = confirmText, MinWidth = 100 };
        var cancelBtn = new Button { Content = "Cancel", MinWidth = 100 };

        var dlg = new Window
        {
            Title = title,
            Width = 520,
            Height = 180,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            CanResize = false,
            Background = BgPanel,
            Content = new StackPanel
            {
                Margin = new Thickness(20),
                Spacing = 14,
                Children =
                {
                    new TextBlock
                    {
                        Text = prompt,
                        Foreground = FgKey,
                        TextWrapping = TextWrapping.Wrap,
                    },
                    input,
                    new StackPanel
                    {
                        Orientation = Orientation.Horizontal,
                        HorizontalAlignment = HorizontalAlignment.Center,
                        Spacing = 10,
                        Children = { okBtn, cancelBtn },
                    },
                },
            },
        };

        void Accept()
        {
            result = input.Text?.Trim();
            dlg.Close();
        }

        okBtn.Click += (_, _) => Accept();
        cancelBtn.Click += (_, _) => dlg.Close();
        input.AttachedToVisualTree += (_, _) => input.Focus();
        input.KeyDown += (_, e) =>
        {
            if (e.Key == Key.Enter && !e.KeyModifiers.HasFlag(KeyModifiers.Shift))
            {
                e.Handled = true;
                Accept();
            }
            else if (e.Key == Key.Escape)
            {
                e.Handled = true;
                dlg.Close();
            }
        };

        await dlg.ShowDialog(this);
        return result;
    }

    private async Task ShowMessageAsync(string title, string message)
    {
        var okBtn = new Button { Content = "OK" };
        var dlg = new Window
        {
            Title           = title,
            Width           = 420,
            Height          = 200,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            CanResize       = false,
            Background      = BgPanel,
            Content         = new StackPanel
            {
                Margin      = new Thickness(20),
                Spacing     = 16,
                Children    =
                {
                    new TextBlock
                    {
                        Text       = message,
                        Foreground = FgKey,
                        TextWrapping = TextWrapping.Wrap,
                    },
                    new StackPanel
                    {
                        HorizontalAlignment = HorizontalAlignment.Center,
                        Children = { okBtn },
                    },
                },
            },
        };
        okBtn.Click += (_, _) => dlg.Close();
        await dlg.ShowDialog(this);
    }

    private async Task<bool> ShowConfirmAsync(string title, string message, string yesText, string noText)
    {
        bool result = false;
        var yesBtn = BuildDialogActionButton(yesText, primary: true);
        var noBtn = BuildDialogActionButton(noText, primary: false);
        var messageBlock = new TextBlock
        {
            Text = message,
            Foreground = HudText,
            TextWrapping = TextWrapping.Wrap,
            FontSize = 15,
            LineHeight = 22,
        };
        var messageScroll = new ScrollViewer
        {
            Content = messageBlock,
            MaxHeight = 340,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
        };
        var buttonRow = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right,
            Spacing = 10,
            Margin = new Thickness(0, 18, 0, 0),
            Children = { yesBtn, noBtn },
        };
        var content = new Border
        {
            Background = HudFrame,
            BorderBrush = HudEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(12),
            Padding = new Thickness(20),
            Child = new StackPanel
            {
                Spacing = 0,
                Children = { messageScroll, buttonRow },
            },
        };

        var dlg = new Window
        {
            Title = title,
            Width = 560,
            MinHeight = 180,
            MaxHeight = 560,
            SizeToContent = SizeToContent.Height,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            CanResize = false,
            Background = HudWindow,
            Content = content,
        };

        yesBtn.Click += (_, _) =>
        {
            result = true;
            dlg.Close();
        };
        noBtn.Click += (_, _) =>
        {
            result = false;
            dlg.Close();
        };

        await dlg.ShowDialog(this);
        return result;
    }

    private static Button BuildDialogActionButton(string text, bool primary)
        => new()
        {
            Content = text,
            MinWidth = 112,
            Padding = new Thickness(18, 8),
            Background = primary ? HudAccent : HudHeaderAlt,
            BorderBrush = primary ? HudAccentHot : HudInnerEdge,
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8),
            Foreground = primary ? HudAccentInk : HudText,
            FontWeight = FontWeight.Bold,
        };
}
