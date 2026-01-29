const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    console.log('Testing gemini-1.5-flash with explicit versions...');

    // The SDK accepts arguments in getGenerativeModel
    // Check if we can pass apiVersion?
    // looking at typical SDK usage, it's usually just model name.

    // Maybe the model name IS 'models/gemini-1.5-flash'?
    try {
        console.log('Trying models/gemini-1.5-flash ...');
        const m = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
        await m.generateContent('Hi');
        console.log('Success with models/ prefix');
    } catch (e) { console.log('Failed:', e.message.split('[')[0]); }

    // Maybe gemini-1.5-flash-8b?
    try {
        console.log('Trying gemini-1.5-flash-8b ...');
        const m = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
        await m.generateContent('Hi');
        console.log('Success with 8b');
    } catch (e) { console.log('Failed:', e.message.split('[')[0]); }

    // Maybe gemini-2.0-flash-exp?
    try {
        console.log('Trying gemini-2.0-flash-exp ...');
        const m = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        await m.generateContent('Hi');
        console.log('Success with 2.0-exp');
    } catch (e) { console.log('Failed:', e.message.split('[')[0]); }

}
test();
