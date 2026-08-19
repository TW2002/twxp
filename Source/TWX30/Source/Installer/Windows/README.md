# Windows Installer Build

This folder contains the Windows MSI installer setup for:

- `MTC`
- `TWXP`
- `TWXC`
- `TWXD`

The installer layout matches the TWX27-style split between the application binaries
and the configurable TWX `ProgramDir`:

- `MTC` and `TWXP` install under `Program Files\TWXProxy`
- `TWXC` and `TWXD` install under the configurable `ProgramDir`
- the default `ProgramDir` is `C:\twxproxy`
- the installer creates `scripts`, `data`, `logs`, and `modules` under `ProgramDir`

The MSI writes these registry values to:

- `HKLM\Software\TWXProxy\TWX30\ProgramDir`
- `HKLM\Software\TWXProxy\TWX30\InstallDir`

At runtime, TWX30 uses the stored `ProgramDir` value on Windows to derive:

- the default scripts directory: `ProgramDir\scripts`
- `twxp.cfg`: `ProgramDir\twxp.cfg`

The installer ships only the Mombot script tree under `ProgramDir\scripts\mombot`.
That payload is staged from the same `mombot5.0\Release\mombot` tree used to
build `mombot.zip`.

## Prerequisites

Run the Windows installer build scripts on Windows with:

- .NET SDK 10
- .NET MAUI Windows workload
- Windows SDK / Visual Studio Build Tools sufficient for MAUI Windows publish
- internet access for first-time NuGet restore of the WiX SDK packages

## Build One Installer

```powershell
pwsh .\Build-WindowsInstaller.ps1 -Architecture x64
pwsh .\Build-WindowsInstaller.ps1 -Architecture arm64
```

Optional arguments:

- `-Configuration Release`
- `-ProgramDirDefault C:\twxproxy`
- `-MombotReleaseSource C:\tw2002\mombot\mombot5.0\Release\mombot`

`MOMBOT_RELEASE_SOURCE` can also be set in the environment when the release
tree lives somewhere else.

## Build Both Installers

```powershell
pwsh .\Build-AllWindowsInstallers.ps1
```

## Output

The generated installers are written to:

- `artifacts\x64\TWXProxy-x64.msi`
- `artifacts\arm64\TWXProxy-arm64.msi`

The staged publish payload used by WiX is written under:

- `artifacts\<arch>\payload\`
