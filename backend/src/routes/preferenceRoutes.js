const express = require('express');
const router = express.Router();
const AlertPreference = require('../models/AlertPreference');

/**
 * @route GET /api/preferences/:clerkId
 * @desc  Fetch alert preferences for a user
 */
router.get('/:clerkId', async (req, res) => {
  try {
    let prefs = await AlertPreference.findOne({ clerkId: req.params.clerkId });
    
    // Create default preferences if none exist
    if (!prefs) {
      prefs = new AlertPreference({ clerkId: req.params.clerkId, preferences: [] });
      // Logic could go here to pre-populate with defaults
      await prefs.save();
    }

    res.json({ status: 'success', data: prefs });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route PATCH /api/preferences/:clerkId
 * @desc  Update alert preferences
 */
router.patch('/:clerkId', async (req, res) => {
  try {
    const { preferences, quietHours, customThresholds } = req.body;
    
    const prefs = await AlertPreference.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { 
        $set: { 
          preferences, 
          quietHours, 
          customThresholds 
        } 
      },
      { new: true, upsert: true }
    );

    res.json({ status: 'success', data: prefs });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/preferences/:clerkId/reset
 * @desc  Reset alert preferences to defaults
 */
router.post('/:clerkId/reset', async (req, res) => {
  try {
    const prefs = await AlertPreference.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { 
        $set: { 
          preferences: [
            { alertType: 'vital_out_of_range', pushEnabled: true, emailEnabled: true, inAppEnabled: true },
            { alertType: 'predictive_risk_high', pushEnabled: true, emailEnabled: true, inAppEnabled: true },
            { alertType: 'medication_reminder', pushEnabled: true, emailEnabled: true, inAppEnabled: true },
            { alertType: 'interaction_detected', pushEnabled: true, emailEnabled: true, inAppEnabled: true },
            { alertType: 'lab_test_due', pushEnabled: true, emailEnabled: false, inAppEnabled: true },
            { alertType: 'profile_incomplete', pushEnabled: true, emailEnabled: false, inAppEnabled: true },
            { alertType: 'goal_achieved', pushEnabled: true, emailEnabled: false, inAppEnabled: true },
            { alertType: 'new_feature', pushEnabled: false, emailEnabled: false, inAppEnabled: true },
            { alertType: 'health_tip', pushEnabled: false, emailEnabled: false, inAppEnabled: true }
          ],
          quietHours: { enabled: false, start: '22:00', end: '07:00' },
          customThresholds: {
            systolicBP: { low: 90, high: 140 },
            diastolicBP: { low: 60, high: 90 },
            fastingGlucose: { low: 70, high: 110 },
            heartRate: { low: 50, high: 100 },
            spo2: { low: 94 }
          }
        } 
      },
      { new: true, upsert: true }
    );
    res.json({ status: 'success', data: prefs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/preferences/:clerkId/test
 * @desc  Send a sample test notification alert
 */
router.post('/:clerkId/test', async (req, res) => {
  try {
    const Alert = require('../models/Alert');
    const testAlert = new Alert({
      clerkId: req.params.clerkId,
      type: 'new_feature',
      priority: 'low',
      title: '🧪 Test Alert Successful',
      description: 'Your notification system is fully configured and operational.',
      actionText: 'Got it'
    });
    await testAlert.save();
    res.json({ status: 'success', message: 'Test alert generated', data: testAlert });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
