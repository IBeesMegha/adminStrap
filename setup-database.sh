#!/bin/bash
# Complete Database Setup Script
# This script runs migrations, generates Prisma client, and seeds the database

echo "========================================"
echo "   Complete Database Setup Script       "
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create a .env file with DATABASE_URL"
    echo ""
    echo "Example .env content:"
    echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/dbname\""
    echo ""
    exit 1
fi

echo "✅ .env file found"
echo ""

# Step 1: Run migrations
echo "Step 1: Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Migration failed!"
    echo "Please check your database connection and try again."
    exit 1
fi

echo "  ✓ Migrations completed"
echo ""

# Step 2: Generate Prisma Client
echo "Step 2: Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Prisma client generation failed!"
    echo "Please close all editors and terminals, then try again."
    exit 1
fi

echo "  ✓ Prisma client generated"
echo ""

# Step 3: Seed the database
echo "Step 3: Seeding database..."
echo ""

npx prisma db seed

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Seeding failed!"
    exit 1
fi

# Success!
echo ""
echo "========================================"
echo "✅ Database setup completed!"
echo "========================================"
echo ""
echo "🎉 Your CMS is fully configured and ready!"
echo ""
echo "📋 What's been set up:"
echo "  ✓ Database tables created (migrations)"
echo "  ✓ Prisma client generated"
echo "  ✓ Permissions & Roles configured"
echo "  ✓ Admin user created"
echo "  ✓ Languages added"
echo "  ✓ Sample content types created"
echo "  ✓ Knowledge Base initialized"
echo ""
echo "🔑 Login Credentials:"
echo "  Email:    admin@example.com"
echo "  Password: Admin@123"
echo "  ⚠️  Change this password after first login!"
echo ""
echo "🚀 Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Visit: http://localhost:3000/admin"
echo "  3. Login with credentials above"
echo "  4. Explore your CMS!"
echo ""
echo "📚 Key Features:"
echo "  • Dashboard with analytics"
echo "  • Content Manager (Blog, Products)"
echo "  • Media Library"
echo "  • Content-Type Builder"
echo "  • AI Agents → Knowledge Base"
echo "  • User & Role Management"
echo "  • Multi-language Support"
echo ""
echo "Happy building! 🎨"
echo ""
