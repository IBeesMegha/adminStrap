/**
 * Cleanup Duplicate Chunks in Database
 * 
 * This script removes duplicate or very similar chunks from the knowledge base
 * to improve search quality and reduce database size.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate similarity between two strings using Jaccard similarity
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  let intersection = 0;
  words1.forEach(word => {
    if (words2.has(word)) intersection++;
  });
  
  const union = words1.size + words2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Find and remove duplicate chunks
 */
async function cleanupDuplicateChunks() {
  console.log('🔍 Starting duplicate chunk cleanup...\n');
  
  try {
    // Get all chunks grouped by document
    const documents = await prisma.knowledgeDocument.findMany({
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' }
        }
      }
    });
    
    console.log(`Found ${documents.length} documents to process\n`);
    
    let totalDuplicatesRemoved = 0;
    
    for (const doc of documents) {
      const chunks = doc.chunks;
      
      if (chunks.length === 0) {
        continue;
      }
      
      console.log(`\n📄 Processing: ${doc.title || doc.id}`);
      console.log(`   Original chunks: ${chunks.length}`);
      
      // Track chunks to keep and chunks to delete
      const chunksToKeep: typeof chunks = [];
      const chunkIdsToDelete: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const currentChunk = chunks[i];
        let isDuplicate = false;
        
        // Compare with all chunks we're keeping
        for (const keptChunk of chunksToKeep) {
          // Check exact match
          if (currentChunk.chunkText === keptChunk.chunkText) {
            isDuplicate = true;
            console.log(`   ❌ Exact duplicate found at chunk ${i}`);
            break;
          }
          
          // Check similarity (85% threshold)
          const similarity = calculateSimilarity(
            currentChunk.chunkText,
            keptChunk.chunkText
          );
          
          if (similarity > 0.85) {
            isDuplicate = true;
            console.log(`   ❌ Similar chunk found at ${i} (${(similarity * 100).toFixed(1)}% similar)`);
            break;
          }
        }
        
        if (isDuplicate) {
          chunkIdsToDelete.push(currentChunk.id);
        } else {
          chunksToKeep.push(currentChunk);
        }
      }
      
      // Delete duplicate chunks
      if (chunkIdsToDelete.length > 0) {
        await prisma.knowledgeChunk.deleteMany({
          where: {
            id: { in: chunkIdsToDelete }
          }
        });
        
        console.log(`   ✅ Removed ${chunkIdsToDelete.length} duplicate chunks`);
        console.log(`   ✨ Kept ${chunksToKeep.length} unique chunks`);
        totalDuplicatesRemoved += chunkIdsToDelete.length;
        
        // Reindex remaining chunks
        for (let i = 0; i < chunksToKeep.length; i++) {
          await prisma.knowledgeChunk.update({
            where: { id: chunksToKeep[i].id },
            data: { chunkIndex: i }
          });
        }
        
        console.log(`   🔢 Re-indexed remaining chunks`);
      } else {
        console.log(`   ✅ No duplicates found`);
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✨ Cleanup Complete!`);
    console.log(`   Total duplicates removed: ${totalDuplicatesRemoved}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get statistics about duplicates without removing them
 */
async function analyzeChunks() {
  console.log('📊 Analyzing chunks for duplicates...\n');
  
  try {
    const documents = await prisma.knowledgeDocument.findMany({
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' }
        }
      }
    });
    
    let totalChunks = 0;
    let totalDuplicates = 0;
    
    for (const doc of documents) {
      const chunks = doc.chunks;
      totalChunks += chunks.length;
      
      const seenTexts = new Set<string>();
      let duplicatesInDoc = 0;
      
      for (const chunk of chunks) {
        const normalized = chunk.chunkText.toLowerCase().trim();
        if (seenTexts.has(normalized)) {
          duplicatesInDoc++;
        } else {
          seenTexts.add(normalized);
        }
      }
      
      if (duplicatesInDoc > 0) {
        console.log(`📄 ${doc.title || doc.id}`);
        console.log(`   Chunks: ${chunks.length}, Duplicates: ${duplicatesInDoc}`);
        totalDuplicates += duplicatesInDoc;
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Total chunks: ${totalChunks}`);
    console.log(`Estimated duplicates: ${totalDuplicates}`);
    console.log(`Efficiency: ${((1 - totalDuplicates / totalChunks) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
const args = process.argv.slice(2);
const mode = args[0] || 'cleanup';

if (mode === 'analyze') {
  analyzeChunks();
} else if (mode === 'cleanup') {
  cleanupDuplicateChunks();
} else {
  console.log('Usage:');
  console.log('  npx ts-node scripts/cleanup-duplicate-chunks.ts analyze  - Analyze duplicates without removing');
  console.log('  npx ts-node scripts/cleanup-duplicate-chunks.ts cleanup  - Remove duplicate chunks');
}
