/**
 * Database Seed Script
 * Creates initial super admin user
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if super admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (existingAdmin) {
    console.log('✅ Super admin already exists');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  // Create super admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super_admin',
      isActive: true,
    },
  });

  console.log('✅ Super admin created successfully');
  console.log('📧 Email: admin@example.com');
  console.log('🔑 Password: Admin@123');
  console.log('⚠️  Please change the password after first login!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
