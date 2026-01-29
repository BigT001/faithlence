const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
        console.log('Testing gemini-1.5-flash-001...');
        const result = await model.generateContent('Hello');
        console.log('Success:', result.response.text());
    } catch (e) {
        console.log('Failed:', e.message);
    }
}
test();
