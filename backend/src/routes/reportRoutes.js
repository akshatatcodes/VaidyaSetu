const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const InteractionHistory = require('../models/InteractionHistory');
const Feedback = require('../models/Feedback');

// Get Latest Report
router.get('/:clerkId', async (req, res) => {
  try {
    const clerkId = req.params.clerkId;
    const [report, profile] = await Promise.all([
      Report.findOne({ clerkId }).sort({ createdAt: -1 }).lean(),
      UserProfile.findOne({ clerkId }).lean()
    ]);

    if (!report) {
      console.log(`[ReportPoll] No report found for ${clerkId}`);
      return res.status(404).json({ status: 'not_found', message: 'Report not found' });
    }

    // Explicit Serialization to prevent data loss in transfer
    const serializedData = JSON.parse(JSON.stringify({
      ...report,
      userProfile: profile || {}
    }));

    console.log(`[ReportPoll] Found report for ${clerkId}. RiskScores: ${Object.keys(serializedData.risk_scores || {}).length}, Advice: ${Object.keys(serializedData.advice || {}).length}`);

    res.json({ 
      status: 'success', 
      data: serializedData
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
