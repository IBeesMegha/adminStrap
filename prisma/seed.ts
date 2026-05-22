/**
 * Database Seed Script
 * Creates initial roles, permissions, and super admin user
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Define all permissions
const PERMISSIONS = [
  // Dashboard
  { name: 'View Dashboard', slug: 'dashboard.read', module: 'dashboard', description: 'View dashboard and analytics' },
  
  // Users
  { name: 'View Users', slug: 'users.read', module: 'users', description: 'View user list' },
  { name: 'Create Users', slug: 'users.create', module: 'users', description: 'Create new users' },
  { name: 'Update Users', slug: 'users.update', module: 'users', description: 'Edit user details' },
  { name: 'Delete Users', slug: 'users.delete', module: 'users', description: 'Delete users' },
  
  // Roles
  { name: 'View Roles', slug: 'roles.read', module: 'roles', description: 'View roles list' },
  { name: 'Create Roles', slug: 'roles.create', module: 'roles', description: 'Create new roles' },
  { name: 'Update Roles', slug: 'roles.update', module: 'roles', description: 'Edit role details' },
  { name: 'Delete Roles', slug: 'roles.delete', module: 'roles', description: 'Delete roles' },
  
  // Content
  { name: 'View Content', slug: 'content.read', module: 'content', description: 'View content entries' },
  { name: 'Create Content', slug: 'content.create', module: 'content', description: 'Create new content' },
  { name: 'Update Content', slug: 'content.update', module: 'content', description: 'Edit content' },
  { name: 'Delete Content', slug: 'content.delete', module: 'content', description: 'Delete content' },
  { name: 'Publish Content', slug: 'content.publish', module: 'content', description: 'Publish/unpublish content' },
  
  // Media
  { name: 'View Media', slug: 'media.read', module: 'media', description: 'View media library' },
  { name: 'Upload Media', slug: 'media.upload', module: 'media', description: 'Upload media files' },
  { name: 'Delete Media', slug: 'media.delete', module: 'media', description: 'Delete media files' },
  
  // Settings
  { name: 'Manage Settings', slug: 'settings.manage', module: 'settings', description: 'Access and modify settings' },
  
  // Schema
  { name: 'Manage Schema', slug: 'schema.manage', module: 'schema', description: 'Manage content types and schema' },
];

// Define roles with their permissions
const ROLES = [
  {
    name: 'Super Admin',
    slug: 'super_admin',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: PERMISSIONS.map(p => p.slug), // All permissions
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Administrative access to manage users, content, and media',
    isSystem: true,
    permissions: [
      'dashboard.read',
      'users.read',
      'users.create',
      'users.update',
      'content.read',
      'content.create',
      'content.update',
      'content.delete',
      'content.publish',
      'media.read',
      'media.upload',
      'media.delete',
      'settings.manage',
    ],
  },
  {
    name: 'Editor',
    slug: 'editor',
    description: 'Content management access',
    isSystem: true,
    permissions: [
      'dashboard.read',
      'content.read',
      'content.create',
      'content.update',
      'content.publish',
      'media.read',
      'media.upload',
    ],
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access',
    isSystem: true,
    permissions: [
      'dashboard.read',
      'content.read',
      'media.read',
    ],
  },
];

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create permissions
  console.log('📝 Creating permissions...');
  const createdPermissions = new Map();
  
  for (const perm of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: perm,
      create: perm,
    });
    createdPermissions.set(perm.slug, permission);
    console.log(`  ✓ ${perm.name} (${perm.slug})`);
  }
  
  console.log(`\n✅ Created ${PERMISSIONS.length} permissions\n`);

  // Create roles with permissions
  console.log('👥 Creating roles...');
  
  for (const roleData of ROLES) {
    const { permissions, ...roleInfo } = roleData;
    
    const role = await prisma.role.upsert({
      where: { slug: roleInfo.slug },
      update: roleInfo,
      create: roleInfo,
    });
    
    // Assign permissions to role
    for (const permSlug of permissions) {
      const permission = createdPermissions.get(permSlug);
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
    
    console.log(`  ✓ ${roleInfo.name} (${permissions.length} permissions)`);
  }
  
  console.log(`\n✅ Created ${ROLES.length} roles\n`);

  // Create super admin user
  console.log('👤 Creating super admin user...');
  
  const superAdminRole = await prisma.role.findUnique({
    where: { slug: 'super_admin' },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found');
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (existingAdmin) {
    // Update existing user with role
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { roleId: superAdminRole.id },
    });
    console.log('  ✓ Updated existing admin user with Super Admin role');
  } else {
    // Create new super admin
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Super Admin',
        roleId: superAdminRole.id,
        isActive: true,
      },
    });
    console.log('  ✓ Created new super admin user');
  }

  console.log('\n✅ Super admin user ready');
  console.log('📧 Email: admin@example.com');
  console.log('🔑 Password: Admin@123');
  console.log('⚠️  Please change the password after first login!\n');
  
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
