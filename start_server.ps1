$ErrorActionPreference = "Stop"
Set-Location "D:\vibe_taxi"
Write-Host "Starting Vibe Taxi API on port 3000 (all interfaces)..."
node index.js
