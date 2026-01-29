const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    console.log('Testing v1 apiVersion...');
    try {
        // According to sources, you can pass apiVersion to getGenerativeModel
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            apiVersion: 'v1'
        });
        console.log('Testing gemini-1.5-flash on v1...');
        const result = await model.generateContent('Hello');
        console.log('Success:', result.response.text());
    } catch (e) {
        console.log('Failed:', e.message.split('[')[0]);
        console.log('Full error:', e.message);
    }
}
test();
