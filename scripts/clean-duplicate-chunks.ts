/**
 * Database Cleanup Script
 * 
 * This script re-processes existing knowledge base documents to remove duplicates.
 * It will:
 * 1. Fetch all documents from the database
 * 2. Re-clean their content with the improved deduplication
 * 3. Regenerate chunks without duplicates
 * 4. Update the database with cleaned data
 * 
 * Usage:
 *   npx ts-node scripts/clean-duplicate-chunks.ts
 */

import { PrismaClient } from '@prisma/client';
import { cleanTextContent, chunkText, generateEmbedding } from '../lib/knowledge-processing';

const prisma = new PrismaClient();

interface CleanupStats {
  documentsProcessed: number;
  chunksBefore: number;
  chunksAfter: number;
  duplicatesRemoved: number;
  errors: number;
}

async function cleanDuplicateChunks() {
  const stats: CleanupStats = {
    documentsProcessed: 0,
    chunksBefore: 0,
    chunksAfter: 0,
    duplicatesRemoved: 0,
    errors: 0
  };

  console.log('🧹 Starting database cleanup...\n');

  try {
    // Fetch all knowledge documents
    const documents = await prisma.knowledgeDocument.findMany({
      include: {
        chunks: true
      }
    });

    console.log(`📚 Found ${documents.length} documents to process\n`);

    for (const doc of documents) {
      console.log(`\n📄 Processing: ${doc.title || doc.url || doc.id}`);
      console.log(`   Original chunks: ${doc.chunks.length}`);

      try {
        // Store original chunk count
        stats.chunksBefore += doc.chunks.length;

        // Re-clean the content with improved deduplication
        const cleanedContent = cleanTextContent(doc.content);

        // Check if content actually changed
        if (cleanedContent === doc.content && doc.chunks.length > 0) {
          console.log('   ✓ Content unchanged, skipping...');
          stats.documentsProcessed++;
          continue;
        }

        // Regenerate chunks without duplicates
        const newChunks = chunkText(cleanedContent, {
          chunkSize: 800,
          chunkOverlap: 100
        });

        console.log(`   New chunks: ${newChunks.length}`);
        stats.chunksAfter += newChunks.length;
        stats.duplicatesRemoved += (doc.chunks.length - newChunks.length);

        // Delete old chunks
        await prisma.knowledgeChunk.deleteMany({
          where: {
            documentId: doc.id
          }
        });

        console.log('   🗑️  Deleted old chunks');

        // Generate embeddings for new chunks and create them
        console.log('   🔄 Generating new embeddings...');
        
        for (let i = 0; i < newChunks.length; i++) {
          const chunk = newChunks[i];
          
          try {
            // Generate embedding
            const embedding = await generateEmbedding(chunk.chunkText);

            // Create new chunk
            await prisma.knowledgeChunk.create({
              data: {
                documentId: doc.id,
                chunkText: chunk.chunkText,
                chunkIndex: i, // Use sequential index
                tokenCount: chunk.tokenCount,
                embedding: embedding
              }
            });

            // Progress indicator
            if ((i + 1) % 5 === 0 || i === newChunks.length - 1) {
              process.stdout.write(`\r   Progress: ${i + 1}/${newChunks.length} chunks`);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            console.error(`\n   ⚠️  Error processing chunk ${i}:`, error);
            stats.errors++;
          }
        }

        console.log('');

        // Update document with cleaned content
        await prisma.knowledgeDocument.update({
          where: { id: doc.id },
          data: {
            content: cleanedContent
          }
        });

        console.log('   ✅ Document updated successfully');
        stats.documentsProcessed++;

      } catch (error) {
        console.error(`   ❌ Error processing document:`, error);
        stats.errors++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Documents processed: ${stats.documentsProcessed}/${documents.length}`);
    console.log(`Total chunks before: ${stats.chunksBefore}`);
    console.log(`Total chunks after: ${stats.chunksAfter}`);
    console.log(`Duplicates removed: ${stats.duplicatesRemoved}`);
    console.log(`Reduction: ${((stats.duplicatesRemoved / stats.chunksBefore) * 100).toFixed(1)}%`);
    console.log(`Errors encountered: ${stats.errors}`);
    console.log('='.repeat(60));

    if (stats.duplicatesRemoved > 0) {
      console.log('\n✨ Success! Your database is now cleaner.');
    } else {
      console.log('\n✓ No duplicates found. Your database was already clean.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanDuplicateChunks()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
