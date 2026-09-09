const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const IntakeSession = require('../models/IntakeSession');

/**
 * Initializes all CRON routines for the VaidyaSetu / MediSahayak platform.
 */
const initCronJobs = () => {
    console.log('[CRON] Initializing background job schedules...');

    cron.schedule('0 * * * *', () => {
        const directoryPath = path.join(__dirname, '../../../uploads');
        if (!fs.existsSync(directoryPath)) return;

        fs.readdir(directoryPath, (err, files) => {
            if (err) return console.log('[CRON Worker] Unable to scan directory: ' + err);

            const now = Date.now();
            files.forEach((file) => {
                const filePath = path.join(directoryPath, file);
                fs.stat(filePath, (err, stat) => {
                    if (err) return;
                    const endTime = new Date(stat.ctime).getTime() + 7200000;
                    if (now > endTime) {
                        fs.unlink(filePath, (err) => {
                            if (!err) console.log(`[CRON Worker] Deleted stale local file: ${file}`);
                        });
                    }
                });
            });
        });
    });

    // Phase 6 — anonymize abandoned waiting_intake sessions
    cron.schedule('15 * * * *', async () => {
        const hours = Number(process.env.INTAKE_PURGE_HOURS || 24);
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        try {
            const stale = await IntakeSession.find({
                queueStatus: 'waiting_intake',
                updatedAt: { $lt: cutoff },
                tokenNumber: { $not: /^OPD-DEMO/ }
            }).limit(200);

            let purged = 0;
            for (const s of stale) {
                s.patientName = 'ANONYMIZED';
                s.contactNumber = '';
                s.abhaId = s.abhaId ? `PURGED-${String(s._id).slice(-6)}` : '';
                s.chiefComplaint = '';
                s.intakeTranscript = [];
                s.socrates = {};
                s.documents = [];
                s.ocrPrescriptions = [];
                s.evidenceSnippets = [];
                s.soapNote = undefined;
                s.queueStatus = 'completed';
                s.accessLog = [
                    ...(s.accessLog || []),
                    {
                        actorId: 'system',
                        actorRole: 'system',
                        action: 'auto_purge_anonymize',
                        field: 'session',
                        at: new Date()
                    }
                ];
                await s.save();
                purged += 1;
            }
            if (purged) {
                console.log(`[CRON Worker] Anonymized ${purged} stale waiting_intake sessions older than ${hours}h.`);
            }
        } catch (e) {
            console.error('[CRON Worker] Intake purge error:', e.message);
        }
    });
};

module.exports = initCronJobs;
