<#
.SYNOPSIS
    GA-Work-Time Win32 Telemetry Probe
.DESCRIPTION
    Captures active foreground window title, process executable, and idle time
    using Win32 P/Invoke APIs (GetForegroundWindow, GetLastInputInfo, QueryFullProcessImageName).
#>

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinTelemetryProbe {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [StructLayout(LayoutKind.Sequential)]
    public struct LASTINPUTINFO {
        public uint cbSize;
        public uint dwTime;
    }

    [DllImport("user32.dll")]
    public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    public static uint GetIdleTime() {
        LASTINPUTINFO lii = new LASTINPUTINFO();
        lii.cbSize = (uint)Marshal.SizeOf(lii);
        if (GetLastInputInfo(ref lii)) {
            return ((uint)Environment.TickCount - lii.dwTime);
        }
        return 0;
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'WinTelemetryProbe').Type) {
    Add-Type -TypeDefinition $cs -ErrorAction SilentlyContinue
}

# 1. Capture Foreground Window Handle
$hwnd = [WinTelemetryProbe]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 512
[void][WinTelemetryProbe]::GetWindowText($hwnd, $sb, 512)
$windowTitle = $sb.ToString().Trim()

# 2. Capture Process Information
[uint32]$targetProcessId = 0
[void][WinTelemetryProbe]::GetWindowThreadProcessId($hwnd, [ref]$targetProcessId)

$targetProcess = if ($targetProcessId -gt 0) {
    Get-Process -Id $targetProcessId -ErrorAction SilentlyContinue
} else { $null }

$procName = if ($targetProcess) { $targetProcess.ProcessName } else { "" }
$exeName = if ($procName) { "$procName.exe" } else { "System" }

# Fallback: if windowTitle is empty, try active process MainWindowTitle
if (-not $windowTitle -and $targetProcess -and $targetProcess.MainWindowTitle) {
    $windowTitle = $targetProcess.MainWindowTitle.Trim()
}

# 3. Capture Idle Seconds
$idleMs = [WinTelemetryProbe]::GetIdleTime()
$idleSec = [math]::Round($idleMs / 1000, 1)

# 4. State Machine Evaluation (300s threshold)
$state = "ACTIVE"
if ($idleSec -ge 300) {
    $state = "IDLE"
}
if ($procName -in @("LockApp", "LogonUI", "ScreenSaver")) {
    $state = "LOCKED"
    $windowTitle = "Workstation Locked"
}

# Categorization
$category = "neutral"
$workExes = @("code.exe", "devenv.exe", "idea64.exe", "pycharm64.exe", "windowsterminal.exe", "powershell.exe", "cmd.exe", "figma.exe", "postman.exe", "slack.exe", "teams.exe", "zoom.exe", "excel.exe", "winword.exe")
$browserExes = @("chrome.exe", "msedge.exe", "firefox.exe", "brave.exe")

$lowerExe = $exeName.ToLower()
if ($lowerExe -in $workExes) {
    $category = "work"
} elseif ($lowerExe -in $browserExes) {
    # Check if window title suggests work
    $titleLower = $windowTitle.ToLower()
    if ($titleLower -match "github|gitlab|localhost|stackoverflow|docs|portal|crm|firebase|jira|confluence|trello|asana|figma|notion|google doc|sheet") {
        $category = "work"
    } else {
        $category = "neutral"
    }
}

[PSCustomObject]@{
    windowTitle    = $windowTitle
    processName    = $exeName
    processId      = $targetProcessId
    idleSeconds    = $idleSec
    state          = $state
    category       = $category
    computerName   = $env:COMPUTERNAME
    windowsUser    = $env:USERNAME
    timestamp      = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Compress
