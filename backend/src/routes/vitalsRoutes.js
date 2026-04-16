const express = require('express');
const router = express.Router();
const Vital = require('../models/Vital');
const UserProfile = require('../models/UserProfile');
const Alert = require('../models/Alert');
const alertService = require('../services/alertService');
const { getVitalStatus, getNormalRange } = require('../utils/vitalRanges');
const { generateVitalMitigations } = require('../services/vitalMitigationService');

/**
 * Helper: Generate Health Alerts based on Vital Thresholds
 */
const checkThresholds = async (clerkId, type, value) => {
  let alert = null;
  
  if (type === 'blood_pressure') {
    const { systolic, diastolic } = value;
    if (systolic >= 180 || diastolic >= 120) {
      alert = {
        type: 'vital_out_of_range',
        priority: 'critical',
        title: '🚨 Hypertensive Crisis Warning',
        description: `Your reading of ${systolic}/${diastolic} is dangerously high. Consult a doctor immediately. Mitigation: Rest quietly, avoid caffeine, and follow your emergency BP protocol.`,
        actionUrl: '/vitals',
        actionText: 'Emergency Guidance'
      };
    } else if (systolic >= 140 || diastolic >= 90) {
      alert = {
        type: 'vital_out_of_range',
        priority: 'high',
        title: 'High Blood Pressure Detected',
        description: `Your reading of ${systolic}/${diastolic} is significantly above normal. Consult a doctor to discuss long-term management. Mitigation: Reduce sodium intake and monitor daily.`,
        actionUrl: '/vitals',
        actionText: 'Log Follow-up'
      };
    }
  } else if (type === 'blood_glucose') {
    if (value >= 250) {
      alert = {
        type: 'vital_out_of_range',
        priority: 'high',
        title: 'Severe Hyperglycemia',
        description: `Your blood glucose of ${value} mg/dL is very high. Consult a doctor immediately. Mitigation: Follow your insulin protocol and stay hydrated.`,
        actionUrl: '/vitals',
        actionText: 'Glucose Protocol'
      };
    } else if (value <= 70) {
      alert = {
        type: 'vital_out_of_range',
        priority: 'critical',
        title: 'Hypoglycemia Warning',
        description: `Your blood glucose of ${value} mg/dL is dangerously low. Consult a doctor if this recurs. Mitigation: Consume 15g of fast-acting sugar immediately.`,
        actionUrl: '/vitals',
        actionText: 'Safety Protocol'
      };
    }
  } else if (type === 'sleep_duration') {
    if (value < 5) {
      alert = {
        type: 'vital_out_of_range',
        priority: 'high',
        title: 'Acute Sleep Deprivation',
        description: `You logged only ${value} hours of sleep. Chronic sleep loss increases cardiovascular risk. Consult a doctor if you have insomnia. Mitigation: Maintain a dark, cool room and avoid screens 1 hour before bed.`,
        actionUrl: '/vitals',
        actionText: 'Sleep Hygiene'
      };
    }
  } else if (type === 'steps') {
    if (value < 2000) {
      alert = {
        type: 'vital_out_of_range',
        priority: 'medium',
        title: 'Sedentary Activity Level',
        description: `Your daily activity (${value} steps) is significantly below the health baseline. Consult a doctor for a safe exercise plan. Mitigation: Aim for short 10-minute walks to improve metabolic health.`,
        actionUrl: '/vitals',
        actionText: 'Activity Tips'
      };
    }
  }

  if (alert) {
    const newAlert = new Alert({ ...alert, clerkId, status: 'unread' });
    await newAlert.save();
    console.log(`[ALERT SERVICE] Generated ${alert.priority} alert for ${clerkId}: ${alert.title}`);
  }
};

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
    
    // Trigger automated monitoring (Step 13)
    await alertService.processNewReading(newVital);
    
    // Step 58: Check thresholds and trigger alerts asynchronously
    checkThresholds(clerkId, type, value).catch(err => console.error("Alert generation failed", err));

    res.status(201).json({ status: 'success', data: newVital });
  } catch (error) {
    console.error('Add vital error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/vitals/latest/:clerkId
 * @desc  Get the most recent reading for each vital type
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

    const filtered = latestVitals.filter(v => v !== null);
    console.log(`[GET] Found ${filtered.length} latest vitals for ${clerkId}`);

    // Return as an array for the frontend to process (Step 181 Vitals.jsx)
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
 * Get personalized mitigation steps for a vital reading
 */
router.post('/:clerkId/analyze', async (req, res) => {
  try {
    const { vitalType, value } = req.body;
    
    console.log('[Vitals Analyze] Request:', { clerkId: req.params.clerkId, vitalType, value });
    
    if (!vitalType || !value) {
      console.error('[Vitals Analyze] Missing required fields:', { vitalType, value });
      return res.status(400).json({ 
        status: 'error', 
        message: 'vitalType and value are required' 
      });
    }

    // Get user profile for personalized analysis
    const userProfile = await UserProfile.findOne({ clerkId: req.params.clerkId });
    console.log('[Vitals Analyze] User profile found:', !!userProfile);
    
    // Determine status
    const status = getVitalStatus(vitalType, value);
    const normalRange = getNormalRange(vitalType);
    console.log('[Vitals Analyze] Status:', status, 'Normal Range:', normalRange);
    
    // Generate personalized mitigations
    let mitigations = null;
    if (status !== 'normal') {
      console.log('[Vitals Analyze] Generating mitigations for abnormal status');
      mitigations = await generateVitalMitigations({
        vitalType,
        currentValue: value,
        status,
        userProfile: userProfile || {}
      });
      console.log('[Vitals Analyze] Mitigations generated:', !!mitigations);
    }

    const responseData = {
      vitalType,
      currentValue: value,
      status,
      normalRange,
      mitigations
    };
    
    console.log('[Vitals Analyze] Sending response:', { status, hasMitigations: !!mitigations });
    
    res.json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error('[Vitals Analyze] Error:', error.message);
    console.error('[Vitals Analyze] Stack:', error.stack);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /api/vitals/latest/:clerkId
 * Get latest vitals with analysis and mitigations
 */
router.get('/latest-with-analysis/:clerkId', async (req, res) => {
  try {
    console.log('[Vitals Latest with Analysis] Fetching for clerkId:', req.params.clerkId);
    
    const vitals = await Vital.find({ clerkId: req.params.clerkId })
      .sort({ timestamp: -1 })
      .limit(20); // Get recent vitals

    console.log('[Vitals Latest with Analysis] Found vitals:', vitals.length);

    if (!vitals || vitals.length === 0) {
      console.log('[Vitals Latest with Analysis] No vitals found, returning empty array');
      return res.json({ status: 'success', data: [] });
    }

    // Get latest reading for each vital type
    const latestByType = {};
    vitals.forEach(vital => {
      if (!latestByType[vital.type]) {
        latestByType[vital.type] = vital;
      }
    });

    console.log('[Vitals Latest with Analysis] Latest by type:', Object.keys(latestByType));

    // Get user profile
    const userProfile = await UserProfile.findOne({ clerkId: req.params.clerkId });

    // Analyze each vital
    const analyzedVitals = await Promise.all(
      Object.values(latestByType).map(async (vital) => {
        const status = getVitalStatus(vital.type, vital.value);
        const normalRange = getNormalRange(vital.type);
        
        // Only generate mitigations for abnormal vitals
        let mitigations = null;
        if (status !== 'normal') {
          mitigations = await generateVitalMitigations({
            vitalType: vital.type,
            currentValue: vital.value,
            status,
            userProfile: userProfile || {}
          });
        }

        return {
          ...vital.toObject(),
          status,
          normalRange,
          mitigations
        };
      })
    );

    console.log('[Vitals Latest with Analysis] Returning', analyzedVitals.length, 'analyzed vitals');
    res.json({ status: 'success', data: analyzedVitals });
  } catch (error) {
    console.error('[Vitals Latest with Analysis] Error:', error.message);
    console.error('[Vitals Latest with Analysis] Stack:', error.stack);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/vitals/mitigations
 * @desc  Generate personalized mitigation steps for vital readings
 */
router.post('/mitigations', async (req, res) => {
  try {
    const { vitals, userProfile } = req.body;

    if (!vitals || !Array.isArray(vitals) || vitals.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Vitals array is required' 
      });
    }

    console.log(`[Vitals Mitigations] Analyzing ${vitals.length} vital(s)...`);

    // Analyze each vital and generate mitigations
    const mitigations = await Promise.all(
      vitals.map(async (vital) => {
        const status = getVitalStatus(vital.type, vital.value);
        const normalRange = getNormalRange(vital.type);
        
        let mitigationSteps = null;
        
        // Generate mitigations for abnormal vitals
        if (status !== 'normal') {
          console.log(`[Vitals Mitigations] ${vital.type}: ${status.toUpperCase()} - Generating mitigations...`);
          mitigationSteps = await generateVitalMitigations({
            vitalType: vital.type,
            currentValue: vital.value,
            status,
            userProfile: userProfile || {}
          });
        } else {
          console.log(`[Vitals Mitigations] ${vital.type}: NORMAL - No mitigations needed`);
        }

        return {
          vitalType: vital.type,
          currentValue: vital.value,
          status,
          normalRange,
          mitigations: mitigationSteps
        };
      })
    );

    console.log('[Vitals Mitigations] ✅ Analysis complete!');

    res.json({ 
      status: 'success', 
      data: {
        vitalsAnalyzed: vitals.length,
        abnormalCount: mitigations.filter(m => m.status !== 'normal').length,
        mitigations
      }
    });
  } catch (error) {
    console.error('[Vitals Mitigations] Error:', error.message);
    console.error(error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

module.exports = router;
