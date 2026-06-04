#!/bin/bash
# Database Seeding Script
# This script seeds your database with all required initial data

echo "========================================"
echo "       Database Seeding Script          "
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create a .env file with DATABASE_URL"
    exit 1
fi

# Run the seed
echo "🌱 Running database seed..."
echo ""

npx prisma db seed

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ Database seeded successfully!"
    echo "========================================"
    echo ""
    echo "📋 What was created:"
    echo "  • Permissions (Dashboard, Users, Roles, Content, Media, Settings, Schema, Knowledge Base)"
    echo "  • Roles (Super Admin, Admin, Editor, Viewer)"
    echo "  • Super Admin User"
    echo "      📧 Email: admin@example.com"
    echo "      🔑 Password: Admin@123"
    echo "  • Languages (English, French, German, Spanish, etc.)"
    echo "  • Sample Knowledge Base Source"
    echo "  • Sample Collection Types (Blog, Product)"
    echo "  • Sample Single Type (Home Page)"
    echo "  • Sample Component (Hero Section)"
    echo ""
    echo "🚀 Your CMS is ready!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run dev"
    echo "  2. Visit: http://localhost:3000/admin"
    echo "  3. Login with the credentials above"
    echo "  4. Change the admin password!"
    echo ""
else
    echo ""
    echo "❌ Seed failed!"
    echo "Please check the error messages above."
    echo ""
    exit 1
fi
