param(
    [ValidateSet('x64', 'arm64')]
    [string]$Architecture = 'x64',

    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Release',

    [string]$ProgramDirDefault = 'C:\twxproxy',

    [string]$MombotReleaseSource = ''
)

$ErrorActionPreference = 'Stop'

$isRunningOnWindows = $false
if (Get-Variable -Name IsWindows -ErrorAction SilentlyContinue) {
    $isRunningOnWindows = [bool]$IsWindows
} else {
    $isRunningOnWindows = ($env:OS -eq 'Windows_NT')
}

if (-not $isRunningOnWindows) {
    throw 'Build-WindowsInstaller.ps1 must be run on Windows.'
}

function Invoke-DotNetPublish {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$ErrorMessage
    )

    & dotnet publish @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw $ErrorMessage
    }
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceRoot = Resolve-Path (Join-Path $scriptRoot '..\..')
$repoRoot = Resolve-Path (Join-Path $sourceRoot '..')
if ([string]::IsNullOrWhiteSpace($MombotReleaseSource)) {
    $MombotReleaseSource = $env:MOMBOT_RELEASE_SOURCE
}
if ([string]::IsNullOrWhiteSpace($MombotReleaseSource)) {
    $MombotReleaseSource = 'C:\tw2002\mombot\mombot5.0\Release\mombot'
}
$mombotReleaseSourcePath = (Resolve-Path -LiteralPath $MombotReleaseSource).ProviderPath
$payloadRoot = Join-Path $scriptRoot "artifacts\$Architecture\payload"
$programDirPayload = Join-Path $payloadRoot 'ProgramDir'
$scriptsPayload = Join-Path $payloadRoot 'scripts'
$mtcPayload = Join-Path $payloadRoot 'MTC'
$twxpPayload = Join-Path $payloadRoot 'TWXP'
$outputRoot = Join-Path $scriptRoot "artifacts\$Architecture"
$rid = "win-$Architecture"
$twxpRid = if ($Architecture -eq 'x64') { 'win-x64' } else { 'win-arm64' }
$wixProject = Join-Path $scriptRoot 'TWXWindowsInstaller.wixproj'
$sourceControlBuildProperties = @(
    '-p:EnableSourceControlManagerQueries=false',
    '-p:ContinuousIntegrationBuild=false'
)

Write-Host "==> Cleaning payload for $Architecture"
Remove-Item $payloadRoot -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $programDirPayload, $scriptsPayload, $mtcPayload, $twxpPayload | Out-Null

Write-Host "==> Staging Mombot scripts payload from $mombotReleaseSourcePath"
$mombotPayload = Join-Path $scriptsPayload 'mombot'
New-Item -ItemType Directory -Force -Path $mombotPayload | Out-Null
Get-ChildItem -LiteralPath $mombotReleaseSourcePath -Force | Copy-Item -Destination $mombotPayload -Recurse -Force

Write-Host "==> Publishing MTC ($rid) - single-file self-contained"
Invoke-DotNetPublish -Arguments @(
    (Join-Path $sourceRoot 'MTC\MTC.csproj'),
    '-c', $Configuration,
    '-r', $rid,
    '--self-contained', 'true',
    '-p:PublishSingleFile=true',
    '-p:IncludeNativeLibrariesForSelfExtract=true',
    '-p:EnableCompressionInSingleFile=true',
    $sourceControlBuildProperties,
    '-o', $mtcPayload
) -ErrorMessage "MTC publish failed for $rid."

Write-Host "==> Publishing TWXC ($rid) - NativeAOT"
try {
    Invoke-DotNetPublish -Arguments @(
        (Join-Path $sourceRoot 'TWXC\TWXC.csproj'),
        '-c', $Configuration,
        '-r', $rid,
        '-p:PublishAot=true',
        $sourceControlBuildProperties,
        '-o', $programDirPayload
    ) -ErrorMessage "TWXC NativeAOT publish failed for $rid."
} catch {
    Write-Warning "TWXC NativeAOT publish failed for $rid. Falling back to single-file self-contained."
    Invoke-DotNetPublish -Arguments @(
        (Join-Path $sourceRoot 'TWXC\TWXC.csproj'),
        '-c', $Configuration,
        '-r', $rid,
        '--self-contained', 'true',
        '-p:PublishSingleFile=true',
        '-p:IncludeNativeLibrariesForSelfExtract=true',
        '-p:EnableCompressionInSingleFile=true',
        $sourceControlBuildProperties,
        '-o', $programDirPayload
    ) -ErrorMessage "TWXC fallback publish failed for $rid."
}

Write-Host "==> Publishing TWXD ($rid) - NativeAOT"
try {
    Invoke-DotNetPublish -Arguments @(
        (Join-Path $sourceRoot 'TWXD\TWXD.csproj'),
        '-c', $Configuration,
        '-r', $rid,
        '-p:PublishAot=true',
        $sourceControlBuildProperties,
        '-o', $programDirPayload
    ) -ErrorMessage "TWXD NativeAOT publish failed for $rid."
} catch {
    Write-Warning "TWXD NativeAOT publish failed for $rid. Falling back to single-file self-contained."
    Invoke-DotNetPublish -Arguments @(
        (Join-Path $sourceRoot 'TWXD\TWXD.csproj'),
        '-c', $Configuration,
        '-r', $rid,
        '--self-contained', 'true',
        '-p:PublishSingleFile=true',
        '-p:IncludeNativeLibrariesForSelfExtract=true',
        '-p:EnableCompressionInSingleFile=true',
        $sourceControlBuildProperties,
        '-o', $programDirPayload
    ) -ErrorMessage "TWXD fallback publish failed for $rid."
}

Write-Host "==> Publishing TWXP ($twxpRid) - single-file self-contained"
Invoke-DotNetPublish -Arguments @(
    (Join-Path $sourceRoot 'TWXP\TWXP.csproj'),
    '-c', $Configuration,
    '-r', $twxpRid,
    '--self-contained', 'true',
    '-p:PublishSingleFile=true',
    '-p:IncludeNativeLibrariesForSelfExtract=true',
    '-p:EnableCompressionInSingleFile=true',
    $sourceControlBuildProperties,
    '-o', $twxpPayload
) -ErrorMessage "TWXP publish failed for $twxpRid."

Write-Host "==> Building MSI ($Architecture)"
dotnet build $wixProject `
    -c $Configuration `
    -p:InstallerPlatform=$Architecture `
    -p:ProgramDirDefault="$ProgramDirDefault" `
    -p:PayloadRoot="$payloadRoot" `
    -p:EnableSourceControlManagerQueries=false `
    -p:ContinuousIntegrationBuild=false `
    -p:SuppressValidation=true

$builtMsi = Join-Path $scriptRoot "bin\$Configuration\$Architecture\TWXProxy-$Architecture.msi"
$finalMsi = Join-Path $outputRoot "TWXProxy-$Architecture.msi"
$repoBinRoot = Join-Path $repoRoot 'bin'
$repoBinMsi = Join-Path $repoBinRoot "twx30-win-$Architecture.msi"

if (-not (Test-Path $builtMsi)) {
    throw "Installer build completed but MSI was not found at $builtMsi"
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
Copy-Item $builtMsi $finalMsi -Force
New-Item -ItemType Directory -Force -Path $repoBinRoot | Out-Null
Copy-Item $builtMsi $repoBinMsi -Force

Write-Host ''
Write-Host "==> Done: $finalMsi"
Write-Host "==> Copied to: $repoBinMsi"
