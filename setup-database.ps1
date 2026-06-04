# Complete Database Setup Script
# This script runs migrations, generates Prisma client, and seeds the database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Complete Database Setup Script       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with DATABASE_URL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example .env content:" -ForegroundColor Cyan
    Write-Host "DATABASE_URL=`"postgresql://user:password@localhost:5432/dbname`"" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green
Write-Host ""

# Step 1: Stop any running processes
Write-Host "Step 1: Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "  ✓ Processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Run migrations
Write-Host "Step 2: Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Please check your database connection and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✓ Migrations completed" -ForegroundColor Green
Write-Host ""

# Step 3: Generate Prisma Client
Write-Host "Step 3: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Prisma client generation failed!" -ForegroundColor Red
    Write-Host "Please close all editors and terminals, then try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✓ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 4: Seed the database
Write-Host "Step 4: Seeding database..." -ForegroundColor Yellow
Write-Host ""

npx prisma db seed

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Seeding failed!" -ForegroundColor Red
    exit 1
}

# Success!
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Database setup completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your CMS is fully configured and ready!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 What's been set up:" -ForegroundColor Cyan
Write-Host "  ✓ Database tables created (migrations)" -ForegroundColor White
Write-Host "  ✓ Prisma client generated" -ForegroundColor White
Write-Host "  ✓ Permissions & Roles configured" -ForegroundColor White
Write-Host "  ✓ Admin user created" -ForegroundColor White
Write-Host "  ✓ Languages added" -ForegroundColor White
Write-Host "  ✓ Sample content types created" -ForegroundColor White
Write-Host "  ✓ Knowledge Base initialized" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Login Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@example.com" -ForegroundColor White
Write-Host "  Password: Admin@123" -ForegroundColor White
Write-Host "  ⚠️  Change this password after first login!" -ForegroundColor Red
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm run dev" -ForegroundColor White
Write-Host "  2. Visit: http://localhost:3000/admin" -ForegroundColor White
Write-Host "  3. Login with credentials above" -ForegroundColor White
Write-Host "  4. Explore your CMS!" -ForegroundColor White
Write-Host ""
Write-Host "📚 Key Features:" -ForegroundColor Cyan
Write-Host "  • Dashboard with analytics" -ForegroundColor White
Write-Host "  • Content Manager (Blog, Products)" -ForegroundColor White
Write-Host "  • Media Library" -ForegroundColor White
Write-Host "  • Content-Type Builder" -ForegroundColor White
Write-Host "  • AI Agents → Knowledge Base" -ForegroundColor White
Write-Host "  • User & Role Management" -ForegroundColor White
Write-Host "  • Multi-language Support" -ForegroundColor White
Write-Host ""
Write-Host "Happy building! 🎨" -ForegroundColor Magenta
Write-Host ""
