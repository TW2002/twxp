# TWX Proxy UI (TWXP)

Cross-platform UI and proxy server for TWX Proxy 3.0 using .NET MAUI.

## Features

- **Game Configuration Management**: Add, edit, and delete game configurations
- **Connection Settings**: Configure host, port, and database paths
- **Auto-Connect**: Set games to automatically connect on startup
- **Multi-Game Support**: Run multiple game proxies simultaneously
- **Start/Stop/Reset Controls**: Manage game proxy lifecycle
- **Cross-Platform**: Runs on macOS and Windows

## Project Structure

```
TWXP/
├── Models/              # Data models (GameConfig, GameStatus)
├── Services/            # Business logic services
│   ├── GameConfigService.cs   # Config persistence
│   └── ProxyService.cs         # Proxy lifecycle management
├── ViewModels/          # MVVM view models
│   ├── BaseViewModel.cs
│   ├── MainViewModel.cs
│   └── GameConfigViewModel.cs
├── Pages/               # UI pages
│   ├── MainPage.xaml           # Game list view
│   └── GameConfigPage.xaml     # Game configuration editor
├── Resources/           # App resources
│   └── Styles/          # XAML styles and colors
└── Platforms/           # Platform-specific code
    ├── MacCatalyst/
    └── Windows/
```

## Building

### Prerequisites

- .NET 8.0 SDK
- Visual Studio 2022 (Windows) or Visual Studio for Mac
- macOS 14.0+ or Windows 10.0.19041.0+

### Build Commands

```bash
# Build for all platforms
dotnet build

# Build for macOS
dotnet build -f net8.0-maccatalyst

# Build for Windows
dotnet build -f net8.0-windows10.0.19041.0

# Run on macOS
dotnet run -f net8.0-maccatalyst

# Run on Windows
dotnet run -f net8.0-windows10.0.19041.0
```

## Configuration Storage

Game configurations are stored in JSON format at:
- **macOS**: `~/Library/Application Support/TWXP/gameconfigs.json`
- **Windows**: `%APPDATA%/TWXP/gameconfigs.json`

## Integration with TWXProxy

The UI integrates with the TWXProxy core library through the `ProxyService` class. Currently, the service contains stub implementations that need to be connected to the actual proxy classes:

- TODO: Initialize `Script` and `TCP` classes for each game
- TODO: Implement actual connection/disconnection logic
- TODO: Add status monitoring and event handling
- TODO: Integrate database initialization

## Usage

1. **Add a Game**: Click "Add Game" button
2. **Configure Settings**: 
   - Enter game name
   - Set connection details (host and port)
   - Choose database file
   - Enable auto-connect if desired
3. **Save**: Click "Save" to persist configuration
4. **Start Game**: Click "Start" button on a game card
5. **Monitor Status**: Status indicator shows current state (Stopped/Starting/Running/Error)
6. **Control Game**: Use Stop/Reset buttons as needed

## Architecture

The app follows MVVM (Model-View-ViewModel) pattern:

- **Models**: Plain data classes representing game configurations
- **Services**: Business logic for config management and proxy control
- **ViewModels**: Handle UI state and commands, bind to views
- **Views**: XAML pages for UI layout and presentation

All game interaction happens in the background through services. The UI is only for configuration and control.
