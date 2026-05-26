// List all available models for your API key
// Run with: node list-available-models.js

const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
console.log('\n🔍 Fetching available models...\n');

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${apiKey}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.error('❌ Error:', response.error.message);
        console.error('\n💡 This might mean:');
        console.error('   1. API key is invalid');
        console.error('   2. Gemini API is not enabled for this key');
        console.error('   3. You need to create a new API key at: https://makersuite.google.com/app/apikey');
        return;
      }

      if (response.models && response.models.length > 0) {
        console.log('✅ Available models:\n');
        response.models.forEach(model => {
          console.log(`📦 ${model.name}`);
          console.log(`   Display Name: ${model.displayName}`);
          console.log(`   Description: ${model.description || 'N/A'}`);
          console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
          console.log('');
        });

        // Find models that support generateContent
        const contentModels = response.models.filter(m => 
          m.supportedGenerationMethods?.includes('generateContent')
        );

        if (contentModels.length > 0) {
          console.log('\n🎯 Models that support generateContent:\n');
          contentModels.forEach(model => {
            const modelName = model.name.replace('models/', '');
            console.log(`✅ ${modelName}`);
          });

          console.log('\n💡 Use one of these models in your code!');
        }
      } else {
        console.log('❌ No models available for this API key');
        console.log('\n💡 Please:');
        console.log('   1. Go to: https://makersuite.google.com/app/apikey');
        console.log('   2. Create a new API key');
        console.log('   3. Make sure "Generative Language API" is enabled');
        console.log('   4. Update your .env file with the new key');
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.log('\nRaw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();
