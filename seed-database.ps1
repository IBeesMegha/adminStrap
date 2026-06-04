# Database Seeding Script
# This script seeds your database with all required initial data

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Database Seeding Script          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Run the seed
Write-Host "🌱 Running database seed..." -ForegroundColor Yellow
Write-Host ""

npx prisma db seed

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 What was created:" -ForegroundColor Cyan
    Write-Host "  • Permissions (Dashboard, Users, Roles, Content, Media, Settings, Schema, Knowledge Base)" -ForegroundColor White
    Write-Host "  • Roles (Super Admin, Admin, Editor, Viewer)" -ForegroundColor White
    Write-Host "  • Super Admin User" -ForegroundColor White
    Write-Host "      📧 Email: admin@example.com" -ForegroundColor Yellow
    Write-Host "      🔑 Password: Admin@123" -ForegroundColor Yellow
    Write-Host "  • Languages (English, French, German, Spanish, etc.)" -ForegroundColor White
    Write-Host "  • Sample Knowledge Base Source" -ForegroundColor White
    Write-Host "  • Sample Collection Types (Blog, Product)" -ForegroundColor White
    Write-Host "  • Sample Single Type (Home Page)" -ForegroundColor White
    Write-Host "  • Sample Component (Hero Section)" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Your CMS is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: npm run dev" -ForegroundColor White
    Write-Host "  2. Visit: http://localhost:3000/admin" -ForegroundColor White
    Write-Host "  3. Login with the credentials above" -ForegroundColor White
    Write-Host "  4. Change the admin password!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Seed failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
