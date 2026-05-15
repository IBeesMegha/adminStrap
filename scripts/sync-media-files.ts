/**
 * Script to sync existing files in public/uploads with the database
 * Run with: npx ts-node scripts/sync-media-files.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function scanDirectory(dir: string, baseDir: string): Promise<any[]> {
  const files: any[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const subFiles = await scanDirectory(fullPath, baseDir);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      // Get file stats
      const stats = fs.statSync(fullPath);
      const relativePath = path.relative(baseDir, fullPath);
      const urlPath = '/' + relativePath.replace(/\\/g, '/');
      
      // Extract folder from path
      const pathParts = relativePath.split(path.sep);
      const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : null;
      
      files.push({
        name: entry.name,
        url: urlPath,
        mime: getMimeType(entry.name),
        size: stats.size,
        ext: path.extname(entry.name),
        folder: folder,
      });
    }
  }

  return files;
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function main() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  console.log('Scanning uploads directory:', uploadsDir);
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('Uploads directory does not exist');
    return;
  }

  const files = await scanDirectory(uploadsDir, path.join(process.cwd(), 'public'));
  
  console.log(`Found ${files.length} files`);
  
  let added = 0;
  let skipped = 0;
  
  for (const file of files) {
    // Check if file already exists in database
    const existing = await prisma.media.findFirst({
      where: { url: file.url },
    });
    
    if (existing) {
      console.log(`Skipping ${file.url} (already in database)`);
      skipped++;
      continue;
    }
    
    // Add to database
    await prisma.media.create({
      data: file,
    });
    
    console.log(`Added ${file.url} to database`);
    added++;
  }
  
  console.log(`\nSync complete!`);
  console.log(`Added: ${added}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${files.length}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
