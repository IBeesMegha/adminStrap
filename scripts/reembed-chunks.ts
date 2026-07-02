import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '../lib/knowledge-processing';

const prisma = new PrismaClient();

async function reembedChunks() {
  const total = await prisma.knowledgeChunk.count();
  console.log(`Re-embedding ${total} chunks with HuggingFace API (BAAI/bge-small-en-v1.5)...`);

  const BATCH = 10;
  let processed = 0;
  let errors = 0;

  while (processed < total) {
    const chunks = await prisma.knowledgeChunk.findMany({
      skip: processed,
      take: BATCH,
      orderBy: { createdAt: 'asc' },
    });

    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk.chunkText);
        await prisma.knowledgeChunk.update({
          where: { id: chunk.id },
          data: { embedding },
        });
        processed++;
        console.log(`[${processed}/${total}] Re-embedded chunk ${chunk.id} (${chunk.chunkText.slice(0, 50)}...)`);
      } catch (error: any) {
        errors++;
        processed++;
        console.error(`[ERROR] Chunk ${chunk.id}: ${error.message}`);
      }
    }

    console.log(`Progress: ${processed}/${total} chunks, ${errors} errors`);
  }

  console.log(`Done. Processed: ${processed}, Errors: ${errors}`);
  await prisma.$disconnect();
}

reembedChunks().catch((e) => {
  console.error('Script failed:', e);
  prisma.$disconnect().finally(() => process.exit(1));
});
