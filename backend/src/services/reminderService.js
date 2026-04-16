const Medication = require('../models/Medication');
const LabResult = require('../models/LabResult');
const UserProfile = require('../models/UserProfile');
const Alert = require('../models/Alert');

/**
 * Step 59, 60: Periodic Health Monitoring Service
 * This service runs every minute (in a real production env this would be a CRON job or Bull queue)
 * and checks for due medications and laboratory tests.
 */
const runReminderService = async () => {
  setInterval(async () => {
    try {
      const now = new Date();
      const currentHHmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      console.log(`[Reminder Service] Heartbeat at ${currentHHmm}`);

      // 1. Medication Reminders (Step 59)
      const meds = await Medication.find({ active: true, timings: currentHHmm });
      for (const med of meds) {
        // Create an alert if not already recently alerted (simple check)
        const recentAlert = await Alert.findOne({
           clerkId: med.clerkId,
           type: 'medication_reminder',
           title: { $regex: med.name },
           createdAt: { $gte: new Date(now.getTime() - 10 * 60000) } // past 10 min
        });

        if (!recentAlert) {
          const alert = new Alert({
            clerkId: med.clerkId,
            type: 'medication_reminder',
            priority: 'medium',
            title: `Medication Due: ${med.name}`,
            description: `Scheduled dose: ${med.dosage}. Please mark as taken when consumed.`,
            actionUrl: '/alerts',
            actionText: 'Mark Taken'
          });
          await alert.save();
          console.log(`[ALERT] Medication reminder created for ${med.clerkId}: ${med.name}`);
        }
      }

      // 2. Lab Test Due Reminders (Step 60)
      // We run this once an hour or day, but for demo let's check profile conditions
      const profiles = await UserProfile.find({ onboardingComplete: true });
      for (const profile of profiles) {
        if (profile.conditions?.includes('Diabetes')) {
           // Check if HBA1C was done in last 90 days
           const lastHb = await LabResult.findOne({ 
             clerkId: profile.clerkId, 
             testName: { $regex: /hba1c|glucose/i },
             sampleDate: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
           });
           
           if (!lastHb) {
              // Trigger reminder
              await Alert.findOneAndUpdate(
                 { clerkId: profile.clerkId, type: 'lab_test_due', title: 'HbA1C Screening Due' },
                 {
                   clerkId: profile.clerkId,
                   type: 'lab_test_due',
                   priority: 'medium',
                   title: 'HbA1C Screening Due',
                   description: 'Based on your Diabetes profile, an HbA1C test is recommended every 3 months. Your last check was more than 90 days ago.',
                   actionUrl: '/vitals',
                   actionText: 'Update Records',
                   status: 'unread'
                 },
                 { upsert: true }
              );
           }
        }
      }

    } catch (err) {
      console.error("[Reminder Service] Execution error:", err.message);
    }
  }, 60000); // Pulse every 1 minute
};

module.exports = { runReminderService };
