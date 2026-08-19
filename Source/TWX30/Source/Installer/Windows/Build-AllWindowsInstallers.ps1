param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Release',

    [string]$ProgramDirDefault = 'C:\twxproxy'
)

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$singleBuildScript = Join-Path $scriptRoot 'Build-WindowsInstaller.ps1'

& $singleBuildScript -Architecture x64 -Configuration $Configuration -ProgramDirDefault $ProgramDirDefault
& $singleBuildScript -Architecture arm64 -Configuration $Configuration -ProgramDirDefault $ProgramDirDefault
