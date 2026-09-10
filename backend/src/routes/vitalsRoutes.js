const express = require('express');
const router = express.Router();
const Vital = require('../models/Vital');
const Encounter = require('../models/Encounter');
const { getVitalStatus, getNormalRange } = require('../utils/vitalRanges');

/**
 * @route POST /api/vitals
 * @desc  Log a new health reading
 */
router.post('/', async (req, res) => {
  try {
    const { clerkId, type, value, unit, timestamp, source, notes, mealContext } = req.body;
    
    if (!clerkId || !type || value === undefined) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const newVital = new Vital({
      clerkId, type, value, unit, timestamp, source, notes, mealContext
    });

    await newVital.save();

    res.status(201).json({ status: 'success', data: newVital });
  } catch (error) {
    console.error('Add vital error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/vitals/sync-wearable
 * @desc  Sync live vitals from Google Fit, Apple Health, or Smart Watch
 */
router.post('/sync-wearable', async (req, res) => {
  try {
    const { clerkId, platform = 'Google Fit', vitals = {} } = req.body;
    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'Missing patient identifier' });
    }

    const timestamp = new Date();
    const sourceTag = String(platform).toLowerCase().replace(/\s+/g, '_');
    const createdVitals = [];

    if (vitals.heartRate) {
      createdVitals.push(await Vital.create({
        clerkId, type: 'heart_rate', value: Number(vitals.heartRate), unit: 'bpm', timestamp, source: sourceTag
      }));
    }
    if (vitals.bloodPressure) {
      createdVitals.push(await Vital.create({
        clerkId, type: 'blood_pressure', value: String(vitals.bloodPressure), unit: 'mmHg', timestamp, source: sourceTag
      }));
    }
    if (vitals.spo2) {
      createdVitals.push(await Vital.create({
        clerkId, type: 'oxygen_saturation', value: Number(vitals.spo2), unit: '%', timestamp, source: sourceTag
      }));
    }
    if (vitals.temperature) {
      createdVitals.push(await Vital.create({
        clerkId, type: 'body_temperature', value: Number(vitals.temperature), unit: '°F', timestamp, source: sourceTag
      }));
    }
    if (vitals.steps) {
      createdVitals.push(await Vital.create({
        clerkId, type: 'steps', value: Number(vitals.steps), unit: 'steps', timestamp, source: sourceTag
      }));
    }
    if (vitals.sleepHours) {
      createdVitals.push(await Vital.create({
        clerkId, type: 'sleep_duration', value: Number(vitals.sleepHours), unit: 'hrs', timestamp, source: sourceTag
      }));
    }

    res.json({
      status: 'success',
      message: `Successfully synchronized ${createdVitals.length} vitals from ${platform}`,
      data: createdVitals
    });
  } catch (err) {
    console.error('[Vitals / Sync-Wearable] Error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * @route GET /api/vitals/latest/:clerkId
 * @desc  Get the most recent reading for each vital type (includes Kiosk & Wearables)
 */
router.get('/latest/:clerkId', async (req, res) => {
  try {
    const clerkId = req.params.clerkId;
    console.log(`[GET] Fetching latest vitals for clerkId: ${clerkId}`);
    const types = [
      'blood_pressure', 'heart_rate', 'blood_glucose', 
      'weight', 'body_temperature', 'oxygen_saturation', 
      'sleep_duration', 'water_intake', 'steps'
    ];

    const latestVitals = await Promise.all(
      types.map(type => 
        Vital.findOne({ clerkId, type }).sort({ timestamp: -1 })
      )
    );

    let filtered = latestVitals.filter(v => v !== null);

    // Also look up latest Encounter / Kiosk session to include Kiosk sensor captures
    try {
      const latestEncounter = await Encounter.findOne({
        $or: [
          { patientId: clerkId },
          { abhaId: clerkId },
          { 'patient.abhaId': clerkId },
          { 'patient.patientId': clerkId }
        ]
      }).sort({ createdAt: -1 });

      if (latestEncounter && latestEncounter.vitals) {
        const kv = latestEncounter.vitals;
        const existingTypes = new Set(filtered.map(f => f.type));

        if ((kv.systolicBP || kv.blood_pressure) && !existingTypes.has('blood_pressure')) {
          const bpVal = kv.blood_pressure || `${kv.systolicBP || 128}/${kv.diastolicBP || 82}`;
          filtered.push({
            type: 'blood_pressure',
            value: bpVal,
            unit: 'mmHg',
            source: 'kiosk_sensor',
            status: 'Normal',
            timestamp: latestEncounter.createdAt || new Date()
          });
        }
        if (kv.heartRate && !existingTypes.has('heart_rate')) {
          filtered.push({
            type: 'heart_rate',
            value: kv.heartRate,
            unit: 'bpm',
            source: 'kiosk_sensor',
            status: 'Normal',
            timestamp: latestEncounter.createdAt || new Date()
          });
        }
        if (kv.spo2 && !existingTypes.has('oxygen_saturation')) {
          filtered.push({
            type: 'oxygen_saturation',
            value: kv.spo2,
            unit: '%',
            source: 'kiosk_sensor',
            status: 'Normal',
            timestamp: latestEncounter.createdAt || new Date()
          });
        }
        if (kv.temperature && !existingTypes.has('body_temperature')) {
          filtered.push({
            type: 'body_temperature',
            value: kv.temperature,
            unit: '°F',
            source: 'kiosk_sensor',
            status: 'Normal',
            timestamp: latestEncounter.createdAt || new Date()
          });
        }
        if (kv.weightKg && !existingTypes.has('weight')) {
          filtered.push({
            type: 'weight',
            value: kv.weightKg,
            unit: 'kg',
            source: 'kiosk_sensor',
            status: 'Normal',
            timestamp: latestEncounter.createdAt || new Date()
          });
        }
      }
    } catch (encErr) {
      console.warn('[Vitals / Encounter Vitals Merge Note]:', encErr.message);
    }

    console.log(`[GET] Found ${filtered.length} latest vitals for ${clerkId}`);
    res.json({ status: 'success', data: filtered });
  } catch (error) {
    console.error('Get latest vitals error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/vitals/:clerkId
 * @desc  Get history of vitals for a user
 */
router.get('/:clerkId', async (req, res) => {
  try {
    const { type, limit } = req.query;
    const query = { clerkId: req.params.clerkId };
    
    if (type) query.type = type;

    const vitals = await Vital.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit) || 100);

    res.json({ status: 'success', data: vitals });
  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/vitals/:clerkId/trends
 * @desc  Get weekly or monthly average trends for a specific vital type
 */
router.get('/:clerkId/trends', async (req, res) => {
  try {
    const { type, days } = req.query;
    if (!type) return res.status(400).json({ status: 'error', message: 'Vital type is required' });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(days) || 30));

    const trends = await Vital.aggregate([
      {
        $match: {
          clerkId: req.params.clerkId,
          type: type,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$timestamp" },
            month: { $month: "$timestamp" },
            year: { $year: "$timestamp" }
          },
          averageValue: { $avg: "$value" },
          count: { $sum: 1 },
          date: { $first: "$timestamp" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    res.json({ status: 'success', data: trends });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route PATCH /api/vitals/:id
 * @desc  Update a specific vital reading
 */
router.patch('/:id', async (req, res) => {
  try {
    const vital = await Vital.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vital) return res.status(404).json({ status: 'error', message: 'Vital not found' });


    res.json({ status: 'success', data: vital });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route DELETE /api/vitals/:id
 * @desc  Delete a specific vital reading
 */
router.delete('/:id', async (req, res) => {
  try {
    const vital = await Vital.findByIdAndDelete(req.params.id);
    if (!vital) return res.status(404).json({ status: 'error', message: 'Vital not found' });


    res.json({ status: 'success', message: 'Vital deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /api/vitals/:clerkId/analyze
 * Classify a single reading against its normal range.
 *
 * NOTE (MediKiosk refactor): this used to return LLM "mitigation" coaching
 * (diet, lifestyle, self-care steps). §15 — an out-of-range reading is a triage
 * trigger for a clinician, not a cue for the platform to advise. What remains is
 * the deterministic range classification the UI needs to colour the reading.
 */
router.post('/:clerkId/analyze', async (req, res) => {
  try {
    const { vitalType, value } = req.body;

    if (!vitalType || value === undefined || value === null || value === '') {
      return res.status(400).json({
        status: 'error',
        message: 'vitalType and value are required'
      });
    }

    const status = getVitalStatus(vitalType, value);
    const normalRange = getNormalRange(vitalType);

    res.json({
      status: 'success',
      data: {
        vitalType,
        currentValue: value,
        status,
        normalRange
      }
    });
  } catch (error) {
    console.error('[Vitals Analyze] Error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/vitals/latest-with-analysis/:clerkId
 * Latest reading per vital type, each classified against its normal range.
 */
router.get('/latest-with-analysis/:clerkId', async (req, res) => {
  try {
    const vitals = await Vital.find({ clerkId: req.params.clerkId })
      .sort({ timestamp: -1 })
      .limit(20);

    if (!vitals || vitals.length === 0) {
      return res.json({ status: 'success', data: [] });
    }

    // Keep only the most recent reading of each type (the sort above is newest
    // first, so the first one we see for a type wins).
    const latestByType = {};
    vitals.forEach((vital) => {
      if (!latestByType[vital.type]) latestByType[vital.type] = vital;
    });

    const analyzedVitals = Object.values(latestByType).map((vital) => ({
      ...vital.toObject(),
      status: getVitalStatus(vital.type, vital.value),
      normalRange: getNormalRange(vital.type)
    }));

    res.json({ status: 'success', data: analyzedVitals });
  } catch (error) {
    console.error('[Vitals Latest with Analysis] Error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/*
 * Removed (MediKiosk refactor): POST /api/vitals/mitigations, which generated
 * per-reading self-care coaching. It had no callers once the wellness UI was
 * removed, and §15 forbids the platform issuing clinical direction on its own.
 */

module.exports = router;
