# Vibe Taxi Deploy
$ErrorActionPreference = "Stop"

Write-Host "Cleaning processes..."
Stop-Process -Name "java" -ErrorAction SilentlyContinue
Stop-Process -Name "gradle" -ErrorAction SilentlyContinue

$adbPath = "C:\Users\re1nl4te\AppData\Local\Android\Sdk\platform-tools"
if ($env:Path -notlike "*$adbPath*") {
    $env:Path += ";$adbPath"
}

Write-Host "Checking device..."
$devices = adb devices | Select-String "device$"
if (-not $devices) {
    Write-Host "Error: No device found."
    exit
}

cd "D:\vibe_taxi\VibeTaxi\android"
Write-Host "Building APK..."
cmd /c "gradlew assembleDebug --no-daemon"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed."
    exit
}

Write-Host "Installing APK..."
$apkPath = "D:\vibe_taxi\VibeTaxi\android\app\build\outputs\apk\debug\app-debug.apk"
cmd /c "adb install -r $apkPath"

Write-Host "Launching App..."
cmd /c "adb shell monkey -p com.vibetaxi -c android.intent.category.LAUNCHER 1"

Write-Host "Done."
