const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            fs.writeFileSync('models.json', JSON.stringify(json, null, 2));
            console.log('Saved models.json');
        } catch (e) { console.error(e); }
    });
});
