-- Update similarity threshold for local embeddings
-- Higher threshold = fewer but more relevant results
UPDATE knowledge_settings 
SET "similarityThreshold" = 0.25 
WHERE id IS NOT NULL;

-- Verify the update
SELECT id, "similarityThreshold", "maxSearchResults" 
FROM knowledge_settings;
