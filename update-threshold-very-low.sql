-- Update threshold to very low for debugging
UPDATE knowledge_settings SET "similarityThreshold" = 0.05;

-- Also check current settings
SELECT * FROM knowledge_settings;

-- Show sample of chunk text to understand content
SELECT 
  id,
  LEFT("chunkText", 100) as preview,
  "tokenCount",
  "chunkIndex"
FROM knowledge_chunks
LIMIT 5;
