# GA WORK-TIME Official 1-Click Fast Installer
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  GA WORK-TIME Enterprise Desktop Client     " -ForegroundColor White
Write-Host "  Fast Workstation Setup                     " -ForegroundColor DarkGray
Write-Host "=============================================" -ForegroundColor Cyan

$destDir = "$env:LOCALAPPDATA\GA-Work-Time"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

$exePath = "$destDir\GA-Work-Time.exe"
$icoPath = "$destDir\app.ico"

# Stop any running instances first
Get-Process -Name "GA-Work-Time" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Downloading client executable..." -ForegroundColor Yellow
$baseUrl = "https://work-time-lyart.vercel.app"
try {
    Invoke-WebRequest -Uri "$baseUrl/downloads/GA-Work-Time.exe" -OutFile $exePath -UseBasicParsing
    Invoke-WebRequest -Uri "$baseUrl/downloads/app.ico" -OutFile $icoPath -UseBasicParsing
} catch {
    Write-Warning "Primary download endpoint busy, trying fallback..."
    Invoke-WebRequest -Uri "http://localhost:5173/downloads/GA-Work-Time.exe" -OutFile $exePath -UseBasicParsing -ErrorAction SilentlyContinue
}

# Create Desktop Shortcut
try {
    $sh = (New-Object -ComObject WScript.Shell).CreateShortcut("$env:USERPROFILE\Desktop\GA WORK-TIME.lnk")
    $sh.TargetPath = $exePath
    $sh.WorkingDirectory = $destDir
    if (Test-Path $icoPath) {
        $sh.IconLocation = "$icoPath,0"
    }
    $sh.Description = "GA WORK-TIME Enterprise Desktop Client"
    $sh.Save()
    Write-Host "Created Desktop shortcut: GA WORK-TIME" -ForegroundColor Green
} catch { }

# Launch Application
Start-Process -FilePath $exePath
Write-Host "`nInstallation complete! GA WORK-TIME is now running in your system tray." -ForegroundColor Green
