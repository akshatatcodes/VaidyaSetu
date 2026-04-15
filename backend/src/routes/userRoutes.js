const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const History = require('../models/History');
const Report = require('../models/Report');
const InteractionHistory = require('../models/InteractionHistory');
const Feedback = require('../models/Feedback');
const { calculateDataQuality } = require('../utils/dataQualityWatcher');

// Initial Profile Save (Onboarding)
router.post('/profile', async (req, res) => {
  try {
    const profileData = req.body;
    const { clerkId } = profileData;

    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    // Convert flat data to nested structure for onboarding
    const nestedData = { clerkId, onboardingComplete: true };
    const excludedFields = new Set(['clerkId', 'firstName', 'lastName']);
    const fields = Object.keys(profileData).filter((key) => !excludedFields.has(key));

    fields.forEach(f => {
      if (profileData[f] !== undefined) {
        nestedData[f] = {
          value: profileData[f],
          lastUpdated: new Date(),
          updateType: 'initial'
        };
      }
    });

    const profile = await UserProfile.findOneAndUpdate(
      { clerkId },
      { $set: nestedData },
      { new: true, upsert: true }
    );

    // LOG HISTORY for onboarding/initial save
    const historyEntries = [];
    fields.forEach(f => {
      if (profileData[f] !== undefined) {
        historyEntries.push({
          clerkId,
          field: f,
          oldValue: null,
          newValue: profileData[f],
          changeType: 'initial',
          source: 'user',
          timestamp: new Date()
        });
      }
    });

    if (historyEntries.length > 0) {
      await History.insertMany(historyEntries);
      
      // Update Data Quality
      const dq = calculateDataQuality(profile);
      profile.dataQualityScore = dq.score;
      profile.dataQualityLabel = dq.label;
      await profile.save();
    }

    res.json({
      status: 'success',
      message: 'Profile saved successfully',
      data: profile
    });
  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete Account Data (Phase 5 Refinement)
router.delete('/:clerkId', async (req, res) => {
  try {
    const clerkId = req.params.clerkId;
    await Promise.all([
      UserProfile.deleteOne({ clerkId }),
      History.deleteMany({ clerkId }),
      Report.deleteMany({ clerkId }),
      InteractionHistory.deleteMany({ clerkId }),
      Feedback.deleteMany({ clerkId })
    ]);
    res.json({ status: 'success', message: 'All user data successfully purged' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
