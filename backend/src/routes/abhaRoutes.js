const express = require('express');
const router = express.Router();
const ABHAIdentity = require('../models/ABHAIdentity');

/**
 * @route POST /api/abha/link-request
 * @desc Stub ABHA identity link intent with pending_abdm_flow status (§2 / §156)
 * IMPORTANT: Does NOT fabricate local ABHA numbers; records intent for ABDM governance.
 */
router.post('/link-request', async (req, res) => {
  try {
    const { patientId, abhaId, abhaAddress } = req.body;

    if (!patientId || !abhaId) {
      return res.status(400).json({
        status: 'error',
        message: 'patientId and abhaId are required for ABHA link request'
      });
    }

    const cleanAbha = abhaId.trim();

    const abhaIdentity = await ABHAIdentity.findOneAndUpdate(
      { patientId },
      {
        patientId,
        abhaId: cleanAbha,
        abhaAddress: abhaAddress || '',
        linkStatus: 'pending_abdm_flow'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(202).json({
      status: 'success',
      message: 'ABHA linkage request registered. Awaiting ABDM M1/M2 OTP verification.',
      data: abhaIdentity
    });
  } catch (error) {
    console.error('Error creating ABHA link request:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/abha/status/:patientId
 * @desc Check ABHA linking status for a patient (§2)
 */
router.get('/status/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const abhaIdentity = await ABHAIdentity.findOne({ patientId });

    if (!abhaIdentity) {
      return res.json({
        status: 'success',
        data: {
          patientId,
          linkStatus: 'unlinked',
          abhaId: null
        }
      });
    }

    return res.json({
      status: 'success',
      data: abhaIdentity
    });
  } catch (error) {
    console.error('Error fetching ABHA status:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
