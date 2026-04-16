const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');

/**
 * @route GET /api/medications/:clerkId
 * @desc  Fetch all medications for a user
 */
router.get('/:clerkId', async (req, res) => {
  try {
    const medications = await Medication.find({ clerkId: req.params.clerkId, active: true });
    res.json({ status: 'success', data: medications });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/medications
 * @desc  Add a new medication
 */
router.post('/', async (req, res) => {
  try {
    const med = new Medication(req.body);
    await med.save();
    res.status(201).json({ status: 'success', data: med });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route PATCH /api/medications/:id/take
 * @desc  Mark a medication as taken and update adherence
 */
router.patch('/:id/take', async (req, res) => {
  try {
    const med = await Medication.findById(req.params.id);
    if (!med) return res.status(404).json({ status: 'error', message: 'Medication not found' });

    med.lastTaken = new Date();
    med.adherence.takenDoses += 1;
    med.adherence.totalDoses += 1;
    await med.save();

    res.json({ status: 'success', data: med });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route DELETE /api/medications/:id
 * @desc  Deactivate/delete a medication
 */
router.delete('/:id', async (req, res) => {
  try {
    await Medication.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ status: 'success', message: 'Medication deactivated' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
