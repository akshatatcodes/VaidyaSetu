const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Patient = require('../models/Patient');
const History = require('../models/History');
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
    const nestedData = { clerkId, onboardingComplete: true, onboardingCompleted: true };
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

    // Sync to Patient document (§4, §5)
    try {
      const cleanDigits = clerkId.replace(/\D/g, '').slice(-10);
      let patient = null;
      if (String(clerkId).match(/^[0-9a-fA-F]{24}$/)) {
        patient = await Patient.findById(clerkId);
      }
      if (!patient) {
        patient = await Patient.findOne({ abhaId: clerkId }) ||
          await Patient.findOne({ userId: clerkId }) ||
          (cleanDigits.length === 10 ? (
            await Patient.findOne({ mobileNumber: cleanDigits }) ||
            await Patient.findOne({ 'basicInfo.contactNumber': new RegExp(cleanDigits) })
          ) : null);
      }
      if (!patient) {
        patient = new Patient({
          basicInfo: {
            fullName: profileData.name || profileData.fullName || 'Ayush Patient',
            age: Number(profileData.age) || 30,
            gender: profileData.gender || 'Male',
            contactNumber: cleanDigits.length === 10 ? `+91 ${cleanDigits}` : ''
          }
        });
      } else {
        if (profileData.name || profileData.fullName) patient.basicInfo.fullName = profileData.name || profileData.fullName;
        if (profileData.age) patient.basicInfo.age = Number(profileData.age);
        if (profileData.gender) patient.basicInfo.gender = profileData.gender;
      }
      await patient.save();
    } catch (pErr) {
      console.error('Error syncing onboarding profile to Patient:', pErr);
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
      History.deleteMany({ clerkId })
    ]);
    res.json({ status: 'success', message: 'All user data successfully purged' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
