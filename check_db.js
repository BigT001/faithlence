const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDatabase() {
    try {
        console.log('Connecting to:', MONGODB_URI.split('@')[1] || MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Use the schema from models.ts logic but simplified
        const schema = new mongoose.Schema({}, { strict: false });
        const Content = mongoose.models.GeneratedContent || mongoose.model('GeneratedContent', schema);

        const counts = await Content.countDocuments();
        console.log('Total documents:', counts);

        const lastEntries = await Content.find().sort({ createdAt: -1 }).limit(5);
        console.log('Last 5 entries:');
        lastEntries.forEach((entry, i) => {
            console.log(`--- Entry ${i + 1} ---`);
            console.log(`ID: ${entry._id}`);
            console.log(`Title: ${entry.videoTitle}`);
            console.log(`File: ${entry.fileName}`);
            console.log(`Created: ${entry.createdAt}`);
            console.log(`Has Analysis: ${!!entry.summary}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error checking database:', error);
    }
}

checkDatabase();
