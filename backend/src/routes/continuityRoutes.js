/**
 * Phase 9 — Continuity Engine: Follow-up & Referral Routes (§31–§38)
 *
 * Implements:
 * 1. Auto-creation & evaluation of FollowUp documents upon LabResult verification (§31, §36)
 * 2. Next-day review scheduling (§35) with no repeated intake
 * 3. Dedicated follow-up queue engine (§32, §34)
 * 4. Same-hospital and cross-hospital referrals (§38) with department visibility scoping
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Mongoose Models
const FollowUp = require('../models/FollowUp');
const Referral = require('../models/Referral');
const Encounter = require('../models/Encounter');
const InvestigationOrder = require('../models/InvestigationOrder');
const LabResult = require('../models/LabResult');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

/**
 * Helper: Check linked orders and update FollowUp status (§36)
 */
async function evaluateLinkedCareTasks(followUpId) {
  const followUp = await FollowUp.findById(followUpId);
  if (!followUp) return null;

  if (followUp.linkedOrderIds?.length > 0) {
    const orders = await InvestigationOrder.find({ _id: { $in: followUp.linkedOrderIds } });
    const allVerified = orders.every(o => o.status === 'verified');

    if (allVerified) {
      followUp.status = 'schedulable';
      // Compute time window (§34)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      followUp.scheduledWindow = {
        date: tomorrow.toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '10:30'
      };
      await followUp.save();
    }
  }
  return followUp;
}

/**
 * 1. POST /api/continuity/followups/trigger-lab-check
 * Triggered on lab result verification (§31).
 * Auto-creates or updates FollowUp referencing origin encounter.
 */
router.post('/followups/trigger-lab-check', async (req, res) => {
  try {
    const { encounterId, patientId, investigationOrderId } = req.body;

    if (!patientId) {
      return res.status(400).json({ status: 'error', message: 'patientId is required' });
    }

    // Check existing linked InvestigationOrders for this encounter/patient
    let linkedOrderIds = [];
    if (encounterId && mongoose.Types.ObjectId.isValid(encounterId)) {
      const orders = await InvestigationOrder.find({ encounterId }).lean();
      linkedOrderIds = orders.map(o => o._id);
    } else if (investigationOrderId) {
      linkedOrderIds = [investigationOrderId];
    }

    // Check if all linked orders are verified
    let allVerified = true;
    if (linkedOrderIds.length > 0) {
      const orders = await InvestigationOrder.find({ _id: { $in: linkedOrderIds } }).lean();
      allVerified = orders.every(o => o.status === 'verified');
    }

    let followUp = await FollowUp.findOne({
      patientId,
      originEncounterId: encounterId && mongoose.Types.ObjectId.isValid(encounterId) ? encounterId : null
    });

    if (!followUp) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      followUp = await FollowUp.create({
        originEncounterId: encounterId && mongoose.Types.ObjectId.isValid(encounterId) ? encounterId : new mongoose.Types.ObjectId(),
        patientId,
        reason: 'lab_result',
        linkedOrderIds,
        status: allVerified ? 'schedulable' : 'waiting_for_results',
        scheduledWindow: allVerified ? {
          date: tomorrow.toISOString().split('T')[0],
          startTime: '09:30',
          endTime: '10:00'
        } : {}
      });
    } else {
      if (allVerified && followUp.status === 'waiting_for_results') {
        followUp.status = 'schedulable';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        followUp.scheduledWindow = {
          date: tomorrow.toISOString().split('T')[0],
          startTime: '09:30',
          endTime: '10:00'
        };
        await followUp.save();
      }
    }

    // Dispatch notification through consent-gated engine (§56)
    if (patientId) {
      const { sendNotification } = require('../services/notificationEngine');
      await sendNotification({
        recipientId: patientId,
        channel: 'sms',
        template: 'followup_slot_available',
        payload: {
          scheduledWindow: followUp.scheduledWindow,
          message: 'A follow-up consultation slot is ready for your review.'
        }
      }).catch(err => console.warn('[Continuity] Notification dispatch warning:', err.message));
    }

    return res.json({
      status: 'success',
      message: allVerified ? 'FollowUp slot created & schedulable' : 'FollowUp created, waiting for remaining lab results',
      data: followUp
    });
  } catch (error) {
    console.error('Error triggering lab follow-up check:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * 2. POST /api/continuity/followups/next-day
 * Doctor creates a Next-Day Review during consult (§35).
 * No new token or repeated intake needed.
 */
router.post('/followups/next-day', async (req, res) => {
  try {
    const { encounterId, patientId, doctorId, reason = 'review', date, startTime = '09:00', endTime = '09:30' } = req.body;

    if (!patientId) {
      return res.status(400).json({ status: 'error', message: 'patientId is required' });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = date || tomorrow.toISOString().split('T')[0];

    const followUp = await FollowUp.create({
      originEncounterId: encounterId && mongoose.Types.ObjectId.isValid(encounterId) ? encounterId : new mongoose.Types.ObjectId(),
      patientId,
      doctorId: doctorId && mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null,
      reason,
      status: 'schedulable',
      scheduledWindow: {
        date: targetDate,
        startTime,
        endTime
      }
    });

    return res.status(201).json({
      status: 'success',
      message: 'Next-day review scheduled successfully (no repeated intake required).',
      data: followUp
    });
  } catch (error) {
    console.error('Error scheduling next-day review:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * 3. GET /api/continuity/followups
 * Lists follow-ups filtered by patient or status (§32).
 */
router.get('/followups', async (req, res) => {
  try {
    const { patientId, status, doctorId } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;

    const followUps = await FollowUp.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ status: 'success', count: followUps.length, data: followUps });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * 4. POST /api/continuity/referrals
 * Same-hospital or Cross-hospital Referral creation (§38).
 */
router.post('/referrals', async (req, res) => {
  try {
    const {
      encounterId,
      patientId,
      fromDoctorId,
      referralScope = 'same_hospital',
      toHospitalId,
      toDepartmentId,
      toDoctorId,
      reason,
      priority = 'routine'
    } = req.body;

    if (!patientId || !toDepartmentId || !reason) {
      return res.status(400).json({ status: 'error', message: 'patientId, toDepartmentId, and reason are required' });
    }

    const qrPayload = `REF-${referralScope.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const referral = await Referral.create({
      encounterId: encounterId && mongoose.Types.ObjectId.isValid(encounterId) ? encounterId : new mongoose.Types.ObjectId(),
      patientId,
      fromDoctorId: fromDoctorId && mongoose.Types.ObjectId.isValid(fromDoctorId) ? fromDoctorId : new mongoose.Types.ObjectId(),
      referralScope,
      toHospitalId: toHospitalId && mongoose.Types.ObjectId.isValid(toHospitalId) ? toHospitalId : null,
      toDepartmentId: toDepartmentId && mongoose.Types.ObjectId.isValid(toDepartmentId) ? toDepartmentId : new mongoose.Types.ObjectId(),
      toDoctorId: toDoctorId && mongoose.Types.ObjectId.isValid(toDoctorId) ? toDoctorId : null,
      reason,
      priority,
      status: 'pending',
      qrPayload
    });

    return res.status(201).json({ status: 'success', data: referral });
  } catch (error) {
    console.error('Error creating referral:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * 5. GET /api/continuity/referrals/department/:departmentId
 * Fetches referrals scoped strictly to the receiving department (§38).
 */
router.get('/referrals/department/:departmentId', async (req, res) => {
  try {
    const { departmentId } = req.params;

    const referrals = await Referral.find({
      toDepartmentId: mongoose.Types.ObjectId.isValid(departmentId) ? departmentId : new mongoose.Types.ObjectId()
    }).sort({ createdAt: -1 }).lean();

    return res.json({ status: 'success', count: referrals.length, data: referrals });
  } catch (error) {
    console.error('Error fetching department referrals:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/referrals/my/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const referrals = await Referral.find({ patientId }).sort({ createdAt: -1 }).lean();
    return res.json({ status: 'success', count: referrals.length, data: referrals });
  } catch (error) {
    console.error('Error fetching patient referrals:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
