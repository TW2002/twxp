param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

$signature = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class RestartManager
{
    [StructLayout(LayoutKind.Sequential)]
    public struct RM_UNIQUE_PROCESS
    {
        public int dwProcessId;
        public System.Runtime.InteropServices.ComTypes.FILETIME ProcessStartTime;
    }

    public enum RM_APP_TYPE
    {
        RmUnknownApp = 0,
        RmMainWindow = 1,
        RmOtherWindow = 2,
        RmService = 3,
        RmExplorer = 4,
        RmConsole = 5,
        RmCritical = 1000
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct RM_PROCESS_INFO
    {
        public RM_UNIQUE_PROCESS Process;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
        public string strAppName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]
        public string strServiceShortName;
        public RM_APP_TYPE ApplicationType;
        public uint AppStatus;
        public uint TSSessionId;
        [MarshalAs(UnmanagedType.Bool)]
        public bool bRestartable;
    }

    [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)]
    public static extern int RmStartSession(out uint pSessionHandle, int dwSessionFlags, string strSessionKey);

    [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)]
    public static extern int RmRegisterResources(uint pSessionHandle, uint nFiles, string[] rgsFilenames, uint nApplications, RM_UNIQUE_PROCESS[] rgApplications, uint nServices, string[] rgsServiceNames);

    [DllImport("rstrtmgr.dll")]
    public static extern int RmGetList(uint dwSessionHandle, out uint pnProcInfoNeeded, ref uint pnProcInfo, [In, Out] RM_PROCESS_INFO[] rgAffectedApps, ref uint lpdwRebootReasons);

    [DllImport("rstrtmgr.dll")]
    public static extern int RmEndSession(uint pSessionHandle);
}
'@

Add-Type -TypeDefinition $signature -ErrorAction Stop

$fullPath = [System.IO.Path]::GetFullPath($Path)
$sessionKey = [Guid]::NewGuid().ToString()
$session = 0
$result = [RestartManager]::RmStartSession([ref]$session, 0, $sessionKey)
if ($result -ne 0) { throw "RmStartSession failed: $result" }

try {
    $resources = @($fullPath)
    $result = [RestartManager]::RmRegisterResources($session, 1, $resources, 0, $null, 0, $null)
    if ($result -ne 0) { throw "RmRegisterResources failed: $result" }

    $needed = 0
    $count = 0
    $reasons = 0
    $result = [RestartManager]::RmGetList($session, [ref]$needed, [ref]$count, $null, [ref]$reasons)
    if ($needed -eq 0) {
        Write-Host "No locking processes found for $fullPath"
        exit 0
    }

    $count = $needed
    $processInfo = New-Object RestartManager+RM_PROCESS_INFO[] $count
    $result = [RestartManager]::RmGetList($session, [ref]$needed, [ref]$count, $processInfo, [ref]$reasons)
    if ($result -ne 0) { throw "RmGetList failed: $result" }

    for ($i = 0; $i -lt $count; $i++) {
        $pidValue = $processInfo[$i].Process.dwProcessId
        $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
        [PSCustomObject]@{
            Id = $pidValue
            ProcessName = if ($process) { $process.ProcessName } else { $processInfo[$i].strAppName }
            AppName = $processInfo[$i].strAppName
            ApplicationType = $processInfo[$i].ApplicationType
            MainWindowTitle = if ($process) { $process.MainWindowTitle } else { '' }
        }
    }
} finally {
    [void][RestartManager]::RmEndSession($session)
}
