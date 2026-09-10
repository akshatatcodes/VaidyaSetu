const express = require('express');
const router = express.Router();
const Consent = require('../models/Consent');

const VALID_PURPOSES = [
  'clinical_history',
  'document_scanning',
  'document_processing',
  'doctor_sharing',
  'lab_sharing',
  'followup_notification',
  'abdm_exchange',
  'secondary_use',
  'whatsapp',
  'sms'
];

/**
 * @route POST /api/consent/grant
 * @desc Grant granular, per-purpose consent with full §47 metadata
 */
router.post('/grant', async (req, res) => {
  try {
    const { patientId, purpose, dataScope, recipient, method, language } = req.body;

    if (!patientId || !purpose) {
      return res.status(400).json({
        status: 'error',
        message: 'patientId and purpose are required'
      });
    }

    if (!VALID_PURPOSES.includes(purpose)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid consent purpose. Must be one of: ${VALID_PURPOSES.join(', ')}`
      });
    }

    const consentId = `CNS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const consent = await Consent.findOneAndUpdate(
      { patientId, purpose },
      {
        consentId,
        patientId,
        purpose,
        dataScope: dataScope || 'opd_encounter_data',
        recipient: recipient || 'assigned_clinical_team',
        method: method || 'kiosk_ui',
        language: language || 'en',
        status: 'active',
        grantedAt: new Date(),
        revokedAt: null
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      status: 'success',
      message: `Granular consent granted for purpose [${purpose}]`,
      data: consent
    });
  } catch (error) {
    console.error('Error granting consent:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/consent/revoke
 * @desc Revoke a previously granted consent (§48)
 */
router.post('/revoke', async (req, res) => {
  try {
    const { patientId, purpose, consentId } = req.body;

    let query = {};
    if (consentId) {
      query = { consentId };
    } else if (patientId && purpose) {
      query = { patientId, purpose };
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Either consentId OR (patientId and purpose) is required to revoke consent'
      });
    }

    const consent = await Consent.findOneAndUpdate(
      query,
      {
        status: 'revoked',
        revokedAt: new Date()
      },
      { new: true }
    );

    if (!consent) {
      return res.status(404).json({
        status: 'error',
        message: 'Active consent record not found'
      });
    }

    return res.json({
      status: 'success',
      message: `Consent revoked for purpose [${consent.purpose}]`,
      data: consent
    });
  } catch (error) {
    console.error('Error revoking consent:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/consent/check
 * @desc Verify if active consent exists before exposing data (§47)
 */
router.post('/check', async (req, res) => {
  try {
    const { patientId, purpose } = req.body;
    if (!patientId || !purpose) {
      return res.status(400).json({ status: 'error', message: 'patientId and purpose required' });
    }
    const consent = await Consent.findOne({ patientId, purpose, status: 'active' });
    return res.json({
      status: 'success',
      granted: !!consent,
      data: consent || null
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/consent/my/:patientId
 * @desc Retrieve patient-facing "My Consent" list (§48)
 */
router.get('/my/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const consents = await Consent.find({ patientId }).sort({ createdAt: -1 });

    return res.json({
      status: 'success',
      count: consents.length,
      data: consents
    });
  } catch (error) {
    console.error('Error fetching consent list:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
