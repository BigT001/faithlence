const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('GOOGLE_API_KEY not found in .env.local');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); // Dummy model to access client if needed, but we need listModels usually on the client
        // Actually the SDK might not expose listModels directly on the main class in older versions, 
        // but usually it does or we can try a simple generation on a known model.
        // Let's rely on the error message which told us to "Call ListModels". 
        // Wait, the node SDK doesn't always expose listModels easily.

        // Instead, let's try to infer from a simple script that tries a few common names.
        const modelsToTry = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-1.0-pro'
        ];

        console.log('Testing models...');

        for (const modelName of modelsToTry) {
            console.log(`\nTesting ${modelName}...`);
            try {
                const m = genAI.getGenerativeModel({ model: modelName });
                const result = await m.generateContent('Hello');
                console.log(`✅ ${modelName} WORKS! Response: ${result.response.text().substring(0, 20)}...`);
            } catch (e) {
                console.log(`❌ ${modelName} FAILED: ${e.message.split('[')[0]}`);
                // Logging partial error to keep it clean, but if it is 404 we will see it.
                if (e.message.includes('404')) console.log('   -> Model not found');
                if (e.message.includes('429')) console.log('   -> Quota exceeded (but model exists)');
            }
        }

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

listModels();
