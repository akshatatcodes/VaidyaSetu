const mongoose = require('mongoose');

// Step 90: MongoDB Performance Indexing Script

async function applyIndexes() {
    console.log('[INDEXING] Building compound indexes to optimize lookups...');

    // These need to be run manually or during deployment migrations, 
    // but mongoose will also build them automatically if defined in Schema.
    // Explicit building ensures they exist for scale.
    
    try {
        const Alert = require('../models/Alert');
        const Vital = require('../models/Vital');
        const UserProfile = require('../models/UserProfile');

        console.log('[INDEXING] Indexing Alerts collection (clerkId + status)...');
        await Alert.collection.createIndex({ clerkId: 1, status: 1 });
        await Alert.collection.createIndex({ createdAt: -1 }); // for expiry processing

        console.log('[INDEXING] Indexing Vitals collection (clerkId + timestamp)...');
        await Vital.collection.createIndex({ clerkId: 1, timestamp: -1 });

        console.log('[INDEXING] Indexing Profile collection (clerkId)...');
        await UserProfile.collection.createIndex({ clerkId: 1 }, { unique: true });

        console.log('[INDEXING] ✅ Compound Indexing completed successfully.');
    } catch (e) {
        console.error('[INDEXING] ❌ Error building indexes:', e);
    }
}

module.exports = applyIndexes;
