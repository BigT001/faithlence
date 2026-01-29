const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;
console.log('API Key present:', !!apiKey);

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    const modelsToTry = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-pro-latest',
        'gemini-pro'
    ];

    console.log('Testing models with verbose error...');

    for (const modelName of modelsToTry) {
        console.log(`\nTesting ${modelName}...`);
        try {
            const m = genAI.getGenerativeModel({ model: modelName });
            const result = await m.generateContent('Hello');
            console.log(`✅ ${modelName} WORKS!`);
        } catch (e) {
            console.log(`❌ ${modelName} FAILED`);
            console.log(`   Message: ${e.message}`);
        }
    }
}

listModels();
