# Vibe Taxi Crash Debugger
$ErrorActionPreference = "Continue"

# 1. Setup Path
$adbPath = "C:\Users\re1nl4te\AppData\Local\Android\Sdk\platform-tools"
if ($env:Path -notlike "*$adbPath*") {
    $env:Path += ";$adbPath"
}

Write-Host "--- ANDROID DEBUGGER STARTING ---" -ForegroundColor Cyan
Write-Host "1. Clearing app data to ensure a fresh start..." -ForegroundColor Gray
cmd /c "adb shell pm clear com.vibetaxi"

Write-Host "2. Preparing to catch the crash..." -ForegroundColor Gray
Write-Host "👉 PLEASE OPEN THE APP ON YOUR EMULATOR NOW!" -ForegroundColor Yellow
Write-Host "Waiting for 10 seconds to capture logs..." -ForegroundColor Gray

# Capture logs for 10 seconds
# We filter for FATAL and RuntimeError to find the crash
$logs = cmd /c "adb logcat -d *:E" 

Write-Host "`n--- CAPTURED ERROR LOGS ---" -ForegroundColor Magenta
$logs
Write-Host "`n--- END OF LOGS ---" -ForegroundColor Magenta

Write-Host "`nAnalysis: If you see 'FATAL EXCEPTION' or 'RuntimeException' above, that is the cause of the crash." -ForegroundColor Cyan
