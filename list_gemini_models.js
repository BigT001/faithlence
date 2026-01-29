const https = require('https');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const apiKey = process.env.GOOGLE_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                const info = json.models.map(m => {
                    return `${m.name.replace('models/', '')} | Methods: ${m.supportedMethods.join(', ')}`;
                }).join('\n');
                fs.writeFileSync('model_details.txt', info, 'utf8');
                console.log('Saved model details to model_details.txt');
            } else {
                console.log('Error:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error('Failed to parse response:', e);
            console.log('Raw data:', data);
        }
    });
}).on('error', (e) => {
    console.error('Request failed:', e);
});
