const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const InteractionHistory = require('../models/InteractionHistory');
const Feedback = require('../models/Feedback');

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
    const fields = [
      'age', 'gender', 'height', 'weight', 'bmi', 'bmiCategory',
      'activityLevel', 'sleepHours', 'stressLevel', 'isSmoker', 'alcoholConsumption',
      'dietType', 'sugarIntake', 'saltIntake', 'eatsLeafyGreens', 'eatsFruits', 'junkFoodFrequency',
      'allergies', 'medicalHistory', 'otherConditions'
    ];

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
      nestedData,
      { new: true, upsert: true }
    );

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
