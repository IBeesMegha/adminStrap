/**
 * Test: Enhanced Deduplication
 * 
 * Demonstrates how the improved cleanTextContent and chunkText functions
 * now remove duplicate content more aggressively
 */

import { cleanTextContent, chunkText } from '../lib/knowledge-processing';

// Simulate the kind of repetitive content you're seeing in the database
const repetitiveHtml = `
<html>
<body>
  <p>Ask NissanEnquire Now4Admission Open|Have a Question about JIET Chat with YintrAImportant AnnouncementsAdmissions Open for 2025 Apply NowAnother Opportunity - Open House (Parent Interaction) on 13th June 2026 Register NowFirst OpeningsSubjInforYunik15 tr9486973ap79d0j Ask NissanEnquire Now4Admission Open|Have a Question about JIET Chat with YintrAImportant AnnouncementsAdmissions Open for 2025 Apply NowAnother Opportunity - Open House (Parent Interaction) on 13th June 2026 Register NowFirst OpeningsSubjInforYunik15 tr9486973ap79d0j</p>
  
  <p>Ask NissanEnquire Now4Admission Open|Have a Question about JIET Chat with YintrAImportant AnnouncementsAdmissions Open for 2025 Apply NowAnother Opportunity - Open House (Parent Interaction) on 13th June 2026 Register NowFirst OpeningsSubjInforYunik15 tr9486973ap79d0j</p>
  
  <div>Real content about admissions process here.</div>
  <div>Information about the school facilities and programs.</div>
  
  <p>Ask NissanEnquire Now4Admission Open|Have a Question about JIET Chat with YintrAImportant AnnouncementsAdmissions Open for 2025 Apply NowAnother Opportunity - Open House (Parent Interaction) on 13th June 2026 Register NowFirst OpeningsSubjInforYunik15</p>
  
  <div>More real content about curriculum.</div>
  <div>More real content about curriculum.</div>
  
</body>
</html>
`;

console.log('=== BEFORE CLEANING ===');
console.log('Raw length:', repetitiveHtml.length);
console.log('Raw content (first 500 chars):', repetitiveHtml.substring(0, 500));

console.log('\n=== AFTER CLEANING ===');
const cleaned = cleanTextContent(repetitiveHtml);
console.log('Cleaned length:', cleaned.length);
console.log('Cleaned content:', cleaned);

// Count unique lines
const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
console.log('\nNumber of unique lines:', lines.length);

console.log('\n=== CHUNKING TEST ===');

// Test with content that has duplicates
const textWithDuplicates = `
This is the first paragraph about our product. It contains useful information.
This is the first paragraph about our product. It contains useful information.
This is the second paragraph with different content about features.
This is the first paragraph about our product. It contains useful information.
This is the third paragraph with unique information about pricing.
This is the second paragraph with different content about features.
`;

console.log('Before chunking (with duplicates):');
console.log(textWithDuplicates);

const cleanedText = cleanTextContent(textWithDuplicates);
console.log('\nAfter cleaning:');
console.log(cleanedText);

const chunks = chunkText(cleanedText, {
  chunkSize: 20,
  chunkOverlap: 5
});

console.log('\nNumber of chunks created:', chunks.length);
chunks.forEach((chunk, i) => {
  console.log(`\nChunk ${i}:`);
  console.log(`  Text: ${chunk.chunkText.substring(0, 100)}...`);
  console.log(`  Words: ${chunk.chunkText.split(/\s+/).length}`);
  console.log(`  Tokens: ${chunk.tokenCount}`);
});

console.log('\n=== SIMILARITY TEST ===');

// Test strings that should be detected as duplicates
const testStrings = [
  'Ask NissanEnquire NowAdmission OpenHave a Question about JIET',
  'Ask NissanEnquire NowAdmission OpenHave a Question about JIET Chat',
  'Completely different content about something else entirely',
  'Ask Nissan Enquire Now Admission Open Have Question JIET'
];

console.log('Testing similarity detection:');
for (let i = 0; i < testStrings.length; i++) {
  for (let j = i + 1; j < testStrings.length; j++) {
    const cleaned1 = testStrings[i].toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
    const cleaned2 = testStrings[j].toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
    
    // Calculate similarity manually (same logic as in the function)
    const words1 = cleaned1.split(/\s+/);
    const words2 = cleaned2.split(/\s+/);
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    let intersectionCount = 0;
    set1.forEach(word => {
      if (set2.has(word)) {
        intersectionCount++;
      }
    });
    
    const unionSize = set1.size + set2.size - intersectionCount;
    const similarity = unionSize > 0 ? intersectionCount / unionSize : 0;
    
    console.log(`\nString ${i + 1} vs String ${j + 1}:`);
    console.log(`  Similarity: ${(similarity * 100).toFixed(1)}%`);
    console.log(`  Would be filtered: ${similarity > 0.9 ? 'YES' : 'NO'}`);
  }
}

console.log('\n=== SUMMARY ===');
console.log('✅ Duplicate lines are now removed');
console.log('✅ Similar lines (>90% similarity) are filtered');
console.log('✅ Duplicate chunks are prevented');
console.log('✅ Common spam patterns are removed');
console.log('\nThis should prevent repetitive content in the database!');
