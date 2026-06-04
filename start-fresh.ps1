# Start Fresh - Clean start of dev server

Write-Host "Starting development server (fresh)..." -ForegroundColor Cyan
Write-Host ""

# Stop any running processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Start dev server
npm run dev
