# Script to restart the development server after adding Knowledge Base feature

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Knowledge Base Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any running node processes
Write-Host "Step 1: Stopping any running Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Generate Prisma Client
Write-Host "Step 2: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to generate Prisma client" -ForegroundColor Red
    Write-Host "Please close any editors/terminals and try again" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Start development server
Write-Host "Step 3: Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Navigate to: http://localhost:3000/admin/knowledge-base" -ForegroundColor Cyan
Write-Host ""

npm run dev
