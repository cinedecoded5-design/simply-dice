# deploy.ps1
$ErrorActionPreference = "Stop"
$GitPath = "C:\Program Files\Git\cmd\git.exe"

Write-Host "🚀 Starting Deployment Repair..." -ForegroundColor Cyan

# 1. Initialize Git if missing
if (-not (Test-Path ".git")) {
    Write-Host "Initializing new Git repository..."
    & $GitPath init
}

# 2. Configure User (Local scope only)
& $GitPath config user.email "deploy@example.com"
& $GitPath config user.name "DeployScript"

# 3. Add Remote (Remove existing first to avoid errors)
Write-Host "Configuring generic remote..."
try {
    & $GitPath remote remove origin 2>$null
}
catch {}
& $GitPath remote add origin "https://github.com/cinedecoded5-design/simply-dice.git"

# 4. Add config for authentication helper if needed (Windows)
& $GitPath config credential.helper manager

# 5. Add, Commit, Push
Write-Host "Renaming branch to main..."
& $GitPath branch -M main

Write-Host "Adding files..."
& $GitPath add .

Write-Host "Committing..."
try {
    & $GitPath commit -m "Force deploy repair"
}
catch {
    Write-Host "Nothing to commit, proceeding..." -ForegroundColor Yellow
}

Write-Host "Pushing to GitHub (Force update)..."
Write-Host "⚠️  A pop-up window might appear asking you to sign in to GitHub! ⚠️" -ForegroundColor Magenta
& $GitPath push -u origin main --force

Write-Host "✅ Deployment Command Sent!" -ForegroundColor Green
Write-Host "Your app should be live in 2-3 minutes at:"
Write-Host "👉 https://cinedecoded5-design.github.io/simply-dice/" -ForegroundColor Cyan
Write-Host "Press Enter to exit..."
Read-Host
