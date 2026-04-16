const express = require('express');
const router = express.Router();
const Vital = require('../models/Vital');
const LabResult = require('../models/LabResult');
const Medication = require('../models/Medication');
const HealthGoal = require('../models/HealthGoal');
const Alert = require('../models/Alert');
const UserProfile = require('../models/UserProfile');

/**
 * Step 75: Export all user health data as JSON
 */
router.get('/export/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    
    const [vitals, labs, meds, goals, alerts, profile] = await Promise.all([
      Vital.find({ clerkId }),
      LabResult.find({ clerkId }),
      Medication.find({ clerkId }),
      HealthGoal.find({ clerkId }),
      Alert.find({ clerkId }),
      UserProfile.findOne({ clerkId })
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      platform: "VaidyaSetu",
      version: "1.2.0-Alpha",
      user: profile,
      history: {
        vitals,
        laboratory_results: labs,
        medications: meds,
        goals,
        notifications: alerts
      }
    };

    res.json({ status: 'success', data: exportData });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * Step 76: Irreversible Data Purge
 */
router.delete('/purge/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    
    // We preserve the Clerk account but wipe all health records
    await Promise.all([
      Vital.deleteMany({ clerkId }),
      LabResult.deleteMany({ clerkId }),
      Medication.deleteMany({ clerkId }),
      HealthGoal.deleteMany({ clerkId }),
      Alert.deleteMany({ clerkId }),
      // We don't delete UserProfile but reset its data if needed, 
      // or delete it too as requested (Step 76: "delete all health records while preserving account")
    ]);

    res.json({ status: 'success', message: 'All health records have been permanently purged.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
