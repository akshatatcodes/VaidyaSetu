/**
 * Governance, Security & Auditability Routes (§46–§52)
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Mongoose Models
const Vital = require('../models/Vital');
const LabResult = require('../models/LabResult');
const Medication = require('../models/Medication');
const UserProfile = require('../models/UserProfile');
const Patient = require('../models/Patient');
const Encounter = require('../models/Encounter');
const History = require('../models/History');
const Document = require('../models/Document');
const Symptom = require('../models/Symptom');
const FollowUp = require('../models/FollowUp');
const Referral = require('../models/Referral');
const Consent = require('../models/Consent');
const AuditLog = require('../models/AuditLog');
const { logAuditEvent } = require('../middleware/auditMiddleware');

/**
 * 1. POST /api/governance/check-access
 * Purpose-based Access Control (§49):
 * Doctor can read patient data ONLY IF they have an assigned/active encounter OR explicit valid consent.
 */
router.post('/check-access', async (req, res) => {
  try {
    const { doctorId, patientId, purpose = 'clinical_care' } = req.body;

    if (!doctorId || !patientId) {
      return res.status(400).json({ status: 'error', message: 'doctorId and patientId are required' });
    }

    // Check active encounter assignment
    const activeEncounter = await Encounter.findOne({
      patientId: mongoose.Types.ObjectId.isValid(patientId) ? patientId : null,
      status: { $in: ['opened', 'in_consultation', 'lab_pending', 'doctor_review'] }
    });

    // Check explicit consent
    const consent = await Consent.findOne({
      patientId: mongoose.Types.ObjectId.isValid(patientId) ? patientId : null,
      status: 'active'
    });

    const isAccessAllowed = Boolean(activeEncounter || consent);

    // Record AuditLog row (§50)
    await logAuditEvent({
      actorId: String(doctorId),
      actorRole: 'doctor',
      action: isAccessAllowed ? 'access_granted' : 'access_denied',
      targetType: 'patient_record',
      targetId: String(patientId),
      patientId,
      reason: `Purpose: ${purpose}. Active encounter: ${Boolean(activeEncounter)}, Consent: ${Boolean(consent)}`
    });

    if (!isAccessAllowed) {
      return res.status(403).json({
        status: 'denied',
        message: 'Access Denied (§49): Doctor has no assigned active encounter or explicit patient consent for this record.'
      });
    }

    return res.json({
      status: 'success',
      accessGranted: true,
      reason: activeEncounter ? 'Assigned active encounter' : 'Explicit patient consent granted'
    });
  } catch (error) {
    console.error('Error checking access:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * 2. DELETE /api/governance/patients/:patientId/cascade-delete
 * Cascading Delete Endpoint (§51) — DPDP Right to Erasure
 * Permanently removes Patient and all child records (Encounter, History, Vital, LabResult, Document, Medication, Symptom, FollowUp, Referral).
 */
router.delete('/patients/:patientId/cascade-delete', async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ status: 'error', message: 'Valid patientId is required' });
    }

    // Log AuditLog row before deletion
    await logAuditEvent({
      actorId: req.headers['x-user-id'] || 'ADMIN-01',
      actorRole: 'admin',
      action: 'cascade_delete_patient',
      targetType: 'patient',
      targetId: patientId,
      patientId,
      reason: 'DPDP Right to Erasure request'
    });

    const results = await Promise.all([
      Patient.findByIdAndDelete(patientId),
      Encounter.deleteMany({ patientId }),
      History.deleteMany({ patientId }),
      Vital.deleteMany({ patientId }),
      LabResult.deleteMany({ patientId }),
      Document.deleteMany({ patientId }),
      Medication.deleteMany({ patientId }),
      Symptom.deleteMany({ patientId }),
      FollowUp.deleteMany({ patientId }),
      Referral.deleteMany({ patientId }),
      Consent.deleteMany({ patientId })
    ]);

    return res.json({
      status: 'success',
      message: 'Patient and all associated health records have been permanently purged (Cascading Delete).',
      purgedSummary: {
        patientDeleted: Boolean(results[0]),
        encountersPurged: results[1].deletedCount,
        historyPurged: results[2].deletedCount,
        vitalsPurged: results[3].deletedCount,
        labResultsPurged: results[4].deletedCount,
        documentsPurged: results[5].deletedCount,
        medicationsPurged: results[6].deletedCount
      }
    });
  } catch (error) {
    console.error('Error executing cascade delete:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * 3. GET /api/governance/audit-logs
 * Fetch Audit Logs for Admin audit dashboards (§50)
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ at: -1 }).limit(100).lean();
    return res.json({ status: 'success', count: logs.length, data: logs });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * Legacy export & purge routes
 */
router.get('/export/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const [vitals, labs, meds, profile] = await Promise.all([
      Vital.find({ clerkId }),
      LabResult.find({ clerkId }),
      Medication.find({ clerkId }),
      UserProfile.findOne({ clerkId })
    ]);

    res.json({
      status: 'success',
      data: {
        exportDate: new Date().toISOString(),
        platform: "VaidyaSetu",
        user: profile,
        history: { vitals, laboratory_results: labs, medications: meds }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.delete('/purge/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    await Promise.all([
      Vital.deleteMany({ clerkId }),
      LabResult.deleteMany({ clerkId }),
      Medication.deleteMany({ clerkId })
    ]);
    res.json({ status: 'success', message: 'All health records have been permanently purged.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
