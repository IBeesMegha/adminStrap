// Test script to check available Gemini models
// Run with: node test-gemini-models.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  console.log('\n🔍 Testing available models...\n');

  const genAI = new GoogleGenerativeAI(apiKey);

  // List of models to test
  const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'models/gemini-pro',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash',
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Try a simple generation
      const result = await model.generateContent('Say "Hello"');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} - WORKS!`);
      console.log(`   Response: ${text.substring(0, 50)}...\n`);
      
      // If this works, we found a working model!
      console.log(`\n🎉 SUCCESS! Use this model: "${modelName}"\n`);
      break;
      
    } catch (error) {
      console.log(`❌ ${modelName} - Failed`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  console.log('\n📝 Test complete!');
}

testModels().catch(console.error);
