const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');

/**
 * @route GET /api/medications/patient/:patientId
 * @desc Fetch all medications for a patient, grouped by bucket (§6)
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    let query = { active: true };

    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.patientId = patientId;
    } else {
      query.clerkId = patientId;
    }

    const medications = await Medication.find(query).sort({ createdAt: -1 });

    const grouped = {
      CURRENT: [],
      PREVIOUS: [],
      STOPPED: [],
      NEEDS_CONFIRMATION: []
    };

    medications.forEach(m => {
      const bucketKey = m.status === 'NEEDS CONFIRMATION' ? 'NEEDS_CONFIRMATION' : (m.status || 'CURRENT');
      if (grouped[bucketKey]) {
        grouped[bucketKey].push(m);
      } else {
        grouped.CURRENT.push(m);
      }
    });

    return res.json({
      status: 'success',
      data: medications,
      buckets: grouped
    });
  } catch (error) {
    console.error('Error fetching patient medications:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/medications/needs-confirmation/:patientId
 * @desc Auto-surface "NEEDS CONFIRMATION" medications for registration hook (§6)
 */
router.get('/needs-confirmation/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    let query = { status: 'NEEDS CONFIRMATION', active: true };

    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.patientId = patientId;
    } else {
      query.clerkId = patientId;
    }

    const pendingMeds = await Medication.find(query);
    return res.json({
      status: 'success',
      count: pendingMeds.length,
      data: pendingMeds
    });
  } catch (error) {
    console.error('Error fetching pending confirmation meds:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/medications/:clerkId
 * @desc Fetch medications by clerkId/patientId (backwards-compatible)
 */
router.get('/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    let query = { active: true };
    if (clerkId.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ patientId: clerkId }, { clerkId }];
    } else {
      query.clerkId = clerkId;
    }

    const medications = await Medication.find(query).sort({ createdAt: -1 });
    res.json({ status: 'success', data: medications });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/medications
 * @desc Add a new medication into one of the 4 §6 buckets
 */
router.post('/', async (req, res) => {
  try {
    const { patientId, clerkId, name, system, dosage, frequency, status, sourceTag, sourceDocId, timings, startDate, endDate } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Medication name is required' });
    }

    const medStatus = status || 'CURRENT';
    const validStatuses = ['CURRENT', 'PREVIOUS', 'STOPPED', 'NEEDS CONFIRMATION'];

    if (!validStatuses.includes(medStatus)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const med = new Medication({
      patientId: patientId && patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : undefined,
      clerkId: clerkId || patientId,
      name: name.trim(),
      system: system || 'modern',
      dosage: dosage || 'As prescribed',
      frequency: frequency || 'daily',
      status: medStatus,
      sourceTag: sourceTag || 'Patient reported',
      sourceDocId: sourceDocId || undefined,
      timings: timings || ['09:00'],
      startDate: startDate || new Date(),
      endDate: endDate || null
    });

    await med.save();
    return res.status(201).json({ status: 'success', data: med });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route PATCH /api/medications/:id/status
 * @desc Transition a medication between §6 buckets (e.g. NEEDS CONFIRMATION -> CURRENT / STOPPED)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['CURRENT', 'PREVIOUS', 'STOPPED', 'NEEDS CONFIRMATION'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const med = await Medication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!med) {
      return res.status(404).json({ status: 'error', message: 'Medication record not found' });
    }

    return res.json({ status: 'success', message: `Medication status updated to ${status}`, data: med });
  } catch (error) {
    console.error('Error updating medication status:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route DELETE /api/medications/:id
 * @desc Deactivate/delete a medication
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
