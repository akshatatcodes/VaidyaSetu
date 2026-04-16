const express = require('express');
const router = express.Router();

const MitigationCompletion = require('../models/MitigationCompletion');
const { schedulePredictiveRecompute } = require('../services/predictiveRiskRecomputeScheduler');

// Mark a mitigation step as completed so predictive risk can decrease.
// Body: { clerkId }
router.post('/:diseaseId/:stepId/complete', async (req, res) => {
  try {
    const { diseaseId, stepId } = req.params;
    const { clerkId } = req.body || {};

    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }
    if (!diseaseId || !stepId) {
      return res.status(400).json({ status: 'error', message: 'diseaseId and stepId are required' });
    }

    await MitigationCompletion.findOneAndUpdate(
      { clerkId, diseaseId, stepId },
      { $set: { status: true, completedAt: new Date() } },
      { upsert: true, new: true }
    );

    // Recompute predictive risk for all predictive diseases after mitigation state changes.
    schedulePredictiveRecompute({ clerkId });

    res.json({ status: 'success', data: { clerkId, diseaseId, stepId, status: true } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;

