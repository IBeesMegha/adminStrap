// Test local embedding generation
const { generateEmbedding } = require('./lib/knowledge-processing.ts');

async function test() {
  console.log('🧪 Testing local embedding generation...\n');

  const testTexts = [
    'This is a test sentence about technology.',
    'The weather is sunny today.',
    'I love programming and coding.',
  ];

  for (const text of testTexts) {
    try {
      console.log(`📝 Text: "${text}"`);
      
      const start = Date.now();
      const embedding = await generateEmbedding(text);
      const duration = Date.now() - start;
      
      console.log(`✅ Generated embedding in ${duration}ms`);
      console.log(`✅ Dimensions: ${embedding.length}`);
      console.log(`✅ Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      
      // Check normalization (magnitude should be ~1)
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      console.log(`✅ Vector magnitude: ${magnitude.toFixed(4)} (should be ~1.0)`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error:`, error.message);
      console.log('');
    }
  }

  // Test similarity
  console.log('🔍 Testing similarity calculation...\n');
  
  try {
    const emb1 = await generateEmbedding('I love programming');
    const emb2 = await generateEmbedding('I enjoy coding');
    const emb3 = await generateEmbedding('The weather is nice');
    
    const similarity12 = cosineSimilarity(emb1, emb2);
    const similarity13 = cosineSimilarity(emb1, emb3);
    
    console.log(`Similarity (programming vs coding): ${(similarity12 * 100).toFixed(1)}%`);
    console.log(`Similarity (programming vs weather): ${(similarity13 * 100).toFixed(1)}%`);
    console.log('');
    
    if (similarity12 > similarity13) {
      console.log('✅ Similar texts have higher similarity!');
      console.log('✅ Semantic search will work correctly!');
    } else {
      console.log('⚠️  Unexpected similarity results');
    }
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }

  console.log('\n🎉 Test complete!');
}

function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

test().catch(console.error);
