# Windows PowerShell Script to Fix Expo Metro Error
# Save as fix-expo.ps1 and run in PowerShell

Write-Host "🔧 Fixing Expo Metro Bundler Error..." -ForegroundColor Green

# Navigate to project directory
$projectPath = "C:\Users\Miflow\Documents\GitHub\tbc-system\beaconcentremobile"
Set-Location $projectPath

Write-Host "📁 Current directory: $projectPath" -ForegroundColor Yellow

# Step 1: Kill any running Metro processes
Write-Host "🛑 Killing any running Metro processes..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*Metro*" } | Stop-Process -Force
Get-Process -Name "expo" -ErrorAction SilentlyContinue | Stop-Process -Force

# Step 2: Clear all caches and temporary files
Write-Host "🧹 Clearing caches and temporary files..." -ForegroundColor Blue

# Clear Expo cache
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force
    Write-Host "✅ Removed .expo directory" -ForegroundColor Green
}

# Clear node_modules
if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force
    Write-Host "✅ Removed node_modules directory" -ForegroundColor Green
}

# Clear package lock
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

# Clear yarn lock if exists
if (Test-Path "yarn.lock") {
    Remove-Item "yarn.lock" -Force
    Write-Host "✅ Removed yarn.lock" -ForegroundColor Green
}

# Step 3: Reinstall dependencies
Write-Host "📦 Reinstalling dependencies..." -ForegroundColor Blue
npm install

# Step 4: Fix Expo dependencies
Write-Host "🔧 Fixing Expo dependencies..." -ForegroundColor Blue
npx expo install --fix

# Step 5: Try to start the project
Write-Host "🚀 Attempting to start Expo..." -ForegroundColor Blue
Write-Host "If this fails, try the alternative commands below:" -ForegroundColor Yellow
Write-Host "  npx expo start --tunnel" -ForegroundColor Cyan
Write-Host "  npx expo start --localhost" -ForegroundColor Cyan
Write-Host "  npx expo start --no-dev" -ForegroundColor Cyan

# Start with clear cache
npx expo start --clear