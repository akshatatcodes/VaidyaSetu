const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const Alert = require('../models/Alert');

// Step 86: Setup Background Jobs

/**
 * Initializes all CRON routines for the VaidyaSetu platform.
 * Should be mounted globally in server.js.
 */
const initCronJobs = () => {
    console.log('[CRON] Initializing background job schedules...');

    // 1. Daily Health Tips Generation (Every day at 7 AM)
    cron.schedule('0 7 * * *', () => {
        console.log('[CRON Worker] Firing Daily Health Tip generation queue.');
        // In a production environment, this would loop through active user profiles,
        // hit Groq API for a daily context snippet, and push an alert.
    });

    // 2. Alert Expiry Processing (Every 12 hours)
    // Deletes 'dismissed' alerts older than 30 days to save DB space
    cron.schedule('0 */12 * * *', async () => {
        console.log('[CRON Worker] Excuting Alert Expiry Processing.');
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const result = await Alert.deleteMany({
                status: 'dismissed',
                updatedAt: { $lt: thirtyDaysAgo }
            });
            console.log(`[CRON Worker] Purged ${result.deletedCount} expired alerts.`);
        } catch(e) {
            console.error('[CRON Worker Error]', e);
        }
    });

    // 3. Stale Temporary File Cleanup (Every hour)
    // Clears out unused Multer uploads from /uploads folder that are > 2 hours old
    cron.schedule('0 * * * *', () => {
        const directoryPath = path.join(__dirname, '../../../uploads');
        if(!fs.existsSync(directoryPath)) return;
        
        fs.readdir(directoryPath, (err, files) => {
            if (err) return console.log('[CRON Worker] Unable to scan directory: ' + err); 
            
            const now = Date.now();
            files.forEach((file) => {
                const filePath = path.join(directoryPath, file);
                fs.stat(filePath, (err, stat) => {
                    if (err) return;
                    const endTime = new Date(stat.ctime).getTime() + 7200000; // 2 hours
                    if (now > endTime) {
                        fs.unlink(filePath, (err) => {
                            if(!err) console.log(`[CRON Worker] Deleted stale local file: ${file}`);
                        });
                    }
                });
            });
        });
    });
};

module.exports = initCronJobs;
