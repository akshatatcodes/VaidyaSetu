const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const History = require('../models/History');
const Report = require('../models/Report');
const { calculateDataQuality } = require('../utils/dataQualityWatcher');
const { schedulePredictiveRecompute } = require('../services/predictiveRiskRecomputeScheduler');

// Get current profile with metadata
router.get('/:clerkId', async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ clerkId: req.params.clerkId });
    if (!profile) {
      return res.status(404).json({ status: 'not_found', message: 'Profile not found' });
    }
    
    const dq = calculateDataQuality(profile);
    
    res.json({ 
      status: 'success', 
      data: profile,
      dataQuality: dq
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update Profile with Change Detection (Phase A.5)
router.post('/update', async (req, res) => {
  try {
    const { clerkId, updates, intent, notes, changeDate } = req.body;
    
    if (!clerkId || !updates) {
      return res.status(400).json({ status: 'error', message: 'clerkId and updates are required' });
    }

    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    const timestamp = changeDate ? new Date(changeDate) : new Date();
    const historyEntries = [];

    // Compare and apply updates
    for (const [field, newValue] of Object.entries(updates)) {
      const oldValueObj = profile[field] || {};
      const oldValue = oldValueObj.value;

      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;

      let detectedType = intent || 'real_change';
      
      if (!intent) {
        if (field === 'weight') {
          const diff = Math.abs(oldValue - newValue);
          const lastUpd = oldValueObj.lastUpdated ? new Date(oldValueObj.lastUpdated) : null;
          const daysSinceLastUpdate = lastUpd ? (timestamp - lastUpd) / (1000 * 60 * 60 * 24) : 999;
          
          if (diff > 5 && daysSinceLastUpdate < 7) {
            detectedType = 'correction';
          }
        }
      }

      profile[field] = {
        value: newValue,
        lastUpdated: timestamp,
        updateType: detectedType,
        previousValue: oldValue,
        unit: oldValueObj.unit
      };

      historyEntries.push({
        clerkId, field, oldValue, newValue,
        changeType: detectedType, intent: intent || '', notes: notes || '',
        source: 'user', timestamp
      });
    }

    // Helper to get numeric value safely from either new nested schema or old simple schema
    const getNum = (field) => {
      const val = updates[field] !== undefined ? updates[field] : profile[field];
      if (val === null || val === undefined) return 0;
      if (typeof val === 'object' && val.value !== undefined) return Number(val.value);
      return Number(val);
    };

    const weightVal = getNum('weight');
    const heightVal = getNum('height');

    if (weightVal > 0 && heightVal > 0) {
      const heightInMeters = heightVal / 100;
      const bmiValue = parseFloat((weightVal / (heightInMeters * heightInMeters)).toFixed(1));
      
      let category = 'Normal';
      if (bmiValue < 18.5) category = 'Underweight';
      else if (bmiValue >= 23 && bmiValue < 27.5) category = 'Overweight';
      else if (bmiValue >= 27.5) category = 'Obese';

      // Update BMI if it changed significantly
      const currentBmi = profile.bmi?.value || 0;
      if (Math.abs(currentBmi - bmiValue) > 0.05) {
        const oldBmi = currentBmi;
        profile.bmi = { value: bmiValue, lastUpdated: timestamp, updateType: 'sync' };
        profile.bmiCategory = { value: category, lastUpdated: timestamp, updateType: 'sync' };
        
        historyEntries.push({
          clerkId, field: 'bmi', oldValue: oldBmi, newValue: bmiValue,
          changeType: 'sync', source: 'system', timestamp
        });
      }
    }

    // Always calculate Data Quality and save if any changes occurred
    if (historyEntries.length > 0) {
      await History.insertMany(historyEntries);
      const dq = calculateDataQuality(profile);
      profile.dataQualityScore = dq.score;
      profile.dataQualityLabel = dq.label;
      profile.markModified('bmi');
      profile.markModified('bmiCategory');
      
      // Also mark manual updates as modified since they are nested
      Object.keys(updates).forEach(field => profile.markModified(field));
      
      await profile.save();
    }

    // Debounced predictive-risk refresh (baseline affected by onboarding/profile changes)
    schedulePredictiveRecompute({ clerkId });

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: profile,
      changesLogged: historyEntries.length
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/history/:clerkId', async (req, res) => {
  try {
    const history = await History.find({ clerkId: req.params.clerkId }).sort({ timestamp: -1 });
    res.json({ status: 'success', data: history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Phase F.5: Allow Users to Reclassify Changes
router.put('/history/:id/reclassify', async (req, res) => {
  try {
    const { changeType } = req.body;
    if (!changeType) {
      return res.status(400).json({ status: 'error', message: 'changeType is required' });
    }
    
    // Validate ENUM
    const validTypes = ['initial', 'correction', 'real_change', 'auto_add', 'auto_remove', 'sync'];
    if (!validTypes.includes(changeType)) {
      return res.status(400).json({ status: 'error', message: 'Invalid changeType' });
    }

    const historyRecord = await History.findById(req.params.id);
    if (!historyRecord) {
      return res.status(404).json({ status: 'error', message: 'History record not found' });
    }

    historyRecord.changeType = changeType;
    await historyRecord.save();

    res.json({
      status: 'success',
      message: 'History record reclassified successfully',
      data: historyRecord
    });
  } catch (error) {
    console.error('Reclassify history error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update Platform Settings (Phase 1)
router.patch('/settings/:clerkId', async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ status: 'error', message: 'Settings are required' });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { $set: { settings: settings } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    res.json({
      status: 'success',
      message: 'Platform settings updated',
      data: profile.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const Vital = require('../models/Vital');
const LabResult = require('../models/LabResult');
const HealthGoal = require('../models/HealthGoal');
const Alert = require('../models/Alert');

/**
 * @route GET /api/profile/export/:clerkId
 * @desc  Consolidate and export all user health data as JSON
 */
router.get('/export/:clerkId', async (req, res) => {
  try {
    const clerkId = req.params.clerkId;
    const [profile, history, reports, vitals, labResults, goals, alerts] = await Promise.all([
      UserProfile.findOne({ clerkId }),
      History.find({ clerkId }),
      Report.find({ clerkId }),
      Vital.find({ clerkId }),
      LabResult.find({ clerkId }),
      HealthGoal.find({ clerkId }),
      Alert.find({ clerkId })
    ]);

    const exportData = {
      profile,
      medicalHistory: history,
      aiReports: reports,
      vitals,
      labResults,
      goals,
      alerts,
      exportedAt: new Date()
    };

    res.json({ status: 'success', data: exportData });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route DELETE /api/profile/account/:clerkId
 * @desc  Permanently delete all data associated with a user
 */
router.delete('/account/:clerkId', async (req, res) => {
  try {
    const clerkId = req.params.clerkId;
    
    // Cascade deletion
    await Promise.all([
      UserProfile.deleteOne({ clerkId }),
      History.deleteMany({ clerkId }),
      Report.deleteMany({ clerkId }),
      Vital.deleteMany({ clerkId }),
      LabResult.deleteMany({ clerkId }),
      HealthGoal.deleteMany({ clerkId }),
      Alert.deleteMany({ clerkId }),
      require('../models/AlertPreference').deleteOne({ clerkId }),
      require('../models/InteractionHistory').deleteMany({ clerkId })
    ]);

    res.json({ status: 'success', message: 'Account and all health records deleted permanently.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// STEP 55: Save Doctor Feature
router.post('/saved-doctors', async (req, res) => {
  try {
    const { clerkId, doctor } = req.body;
    if (!clerkId || !doctor) {
      return res.status(400).json({ status: 'error', message: 'clerkId and doctor data are required' });
    }

    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) return res.status(404).json({ status: 'error', message: 'Profile not found' });

    // Check if duplicate
    const exists = profile.savedDoctors.some(d => d.placeId === doctor.placeId || d.name === doctor.name);
    if (exists) return res.status(409).json({ status: 'error', message: 'Doctor already saved' });

    profile.savedDoctors.push(doctor);
    await profile.save();

    res.json({ status: 'success', data: profile.savedDoctors });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.delete('/saved-doctors/:clerkId/:placeId', async (req, res) => {
  try {
    const { clerkId, placeId } = req.params;
    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) return res.status(404).json({ status: 'error', message: 'Profile not found' });

    profile.savedDoctors = profile.savedDoctors.filter(d => d.placeId !== placeId);
    await profile.save();

    res.json({ status: 'success', data: profile.savedDoctors });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update Doctor Notes
router.patch('/saved-doctors/:clerkId/:placeId/notes', async (req, res) => {
  try {
    const { clerkId, placeId } = req.params;
    const { notes } = req.body;
    
    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) return res.status(404).json({ status: 'error', message: 'Profile not found' });

    const doctor = profile.savedDoctors.find(d => d.placeId === placeId);
    if (!doctor) return res.status(404).json({ status: 'error', message: 'Doctor not found in your network' });

    doctor.notes = notes;
    await profile.save();

    res.json({ status: 'success', data: profile.savedDoctors });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// STEP 61: Card Persistence
router.patch('/card-meta/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { updates } = req.body; // { 'diabetes': { reviewed: true, dismissed: ['waist'] } }

    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) return res.status(404).json({ status: 'error', message: 'Profile not found' });

    // Deep merge or replace depending on needs. Here we replace keys to keep it simple.
    Object.entries(updates).forEach(([diseaseId, meta]) => {
      const current = profile.cardMeta.get(diseaseId) || {};
      profile.cardMeta.set(diseaseId, { ...current, ...meta });
    });

    profile.markModified('cardMeta');
    await profile.save();

    res.json({ status: 'success', data: profile.cardMeta });
  } catch (error) {
    console.error('Card meta error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
