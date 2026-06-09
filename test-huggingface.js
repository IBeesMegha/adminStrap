// Test Hugging Face API connection
const https = require('https');
require('dotenv').config();

const apiKey = process.env.HUGGINGFACE_API_KEY;

if (!apiKey) {
  console.error('❌ HUGGINGFACE_API_KEY not found in .env');
  process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
console.log('\n🔍 Testing Hugging Face API...\n');

const testText = 'This is a test sentence.';
const model = 'sentence-transformers/all-MiniLM-L6-v2';

const postData = JSON.stringify({
  inputs: testText,
  options: {
    wait_for_model: true,
  },
});

const options = {
  hostname: 'router.huggingface.co',
  path: `/hf-inference/pipeline/feature-extraction/${model}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = https.request(options, (res) => {
  let data = '';

  console.log('Status Code:', res.statusCode);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      if (res.statusCode === 200) {
        const parsed = JSON.parse(data);
        const vector = Array.isArray(parsed[0]) ? parsed[0] : parsed;
        
        console.log('✅ API works!');
        console.log('✅ Embedding dimensions:', vector.length);
        console.log('✅ Sample values:', vector.slice(0, 5));
        console.log('\n🎉 Everything is working correctly!');
      } else if (res.statusCode === 503) {
        console.log('⏳ Model is loading. Wait 10-20 seconds and try again.');
        console.log('Response:', data);
      } else {
        console.log('❌ Error:', res.statusCode);
        console.log('Response:', data);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();
