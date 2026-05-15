# Fix Prisma Client Script
Write-Host "=== Prisma Client Fix Script ===" -ForegroundColor Cyan

# Step 1: Stop Node processes
Write-Host "`n1. Stopping Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Delete Prisma client
Write-Host "`n2. Deleting old Prisma client..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Step 3: Regenerate Prisma client
Write-Host "`n3. Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Prisma client regenerated successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Run: npm run dev" -ForegroundColor White
    Write-Host "2. Try uploading a file" -ForegroundColor White
    Write-Host "3. It should work now!" -ForegroundColor White
} else {
    Write-Host "`n✗ Failed to regenerate Prisma client" -ForegroundColor Red
    Write-Host "`nTry these steps manually:" -ForegroundColor Yellow
    Write-Host "1. Close VS Code" -ForegroundColor White
    Write-Host "2. Pause OneDrive sync" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
}
