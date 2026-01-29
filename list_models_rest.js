const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('No API Key');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => console.log(`- ${m.name.replace('models/', '')} (${m.supportedGenerationMethods.join(', ')})`));
            } else {
                console.log('Error:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error('Parse error:', e, data);
        }
    });
}).on('error', err => {
    console.error('Request error:', err);
});
