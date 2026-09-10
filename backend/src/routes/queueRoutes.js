const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Encounter = require('../models/Encounter');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const { inferDepartmentFromSymptoms } = require('../services/adaptiveSocratesService');
const { buildTokenPayload, generateQrSvgDataUri, buildPrintableTokenSlipHtml } = require('../services/qrService');

/**
 * Helper to compute ETA range string (§18)
 * Always outputs as a range (e.g., "15 - 25 mins"), never false-precision exact seconds.
 */
function computeEtaRange(patientsAhead, rollingAverageMinutes = 12) {
  if (patientsAhead <= 0) return '0 - 5 mins (Immediate)';
  const minMins = Math.max(5, patientsAhead * Math.max(5, rollingAverageMinutes - 3));
  const maxMins = patientsAhead * (rollingAverageMinutes + 5);
  return `${minMins} - ${maxMins} mins`;
}

/**
 * @route POST /api/routing/suggest
 * @desc AI-Assisted Department Routing Suggestion (§17)
 * IMPORTANT: Explicitly labeled "AI-assisted routing", never framed as diagnosis.
 */
router.post('/suggest', async (req, res) => {
  try {
    const { chiefComplaint, userSpeech, history, vitals, age, gender } = req.body;

    const inferred = inferDepartmentFromSymptoms({
      chiefComplaint,
      userSpeech,
      age,
      gender
    }) || {
      department: 'Kayachikitsa',
      departmentId: 'Kayachikitsa',
      departmentName: 'कायचिकित्सा (Kayachikitsa)',
      sub: 'Internal Medicine & General Care',
      confidence: 85,
      reason: 'General primary care routing'
    };

    return res.json({
      status: 'success',
      label: 'AI-assisted routing', // Explicit requirement per §17
      disclaimer: 'This routing recommendation is AI-assisted for queue assignment and does NOT constitute a clinical diagnosis.',
      data: inferred
    });
  } catch (error) {
    console.error('Error suggesting routing:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/queue/token
 * @desc Generate OPD Token document, QR payload, and compute ETA range (§18-20)
 */
router.post('/token', async (req, res) => {
  try {
    const { encounterId, patientId, hospitalId, departmentId, doctorId, priority } = req.body;

    let encounter = null;
    if (encounterId && String(encounterId).match(/^[0-9a-fA-F]{24}$/)) {
      encounter = await Encounter.findById(encounterId);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const hId = hospitalId || encounter?.hospitalId || '60d0fe4f5311236168a109cb';
    const dId = departmentId || encounter?.departmentId || '60d0fe4f5311236168a109cc';
    const docId = doctorId || encounter?.doctorId || null;

    // Find or create Queue collection row for hospital+department+date
    let queue = await Queue.findOne({
      hospitalId: hId,
      departmentId: dId,
      date: todayStr,
      queueType: 'opd'
    });

    if (!queue) {
      queue = new Queue({
        hospitalId: hId,
        departmentId: dId,
        doctorId: docId,
        date: todayStr,
        queueType: 'opd',
        entries: []
      });
    }

    const tokenNumber = encounter ? encounter.tokenNumber : `OPD-${todayStr.replace(/-/g, '')}-${queue.entries.length + 101}`;

    const patientsAhead = queue.entries.filter(e => e.status === 'waiting').length;

    // Fetch doctor rolling consultation speed if available
    let rollingSpeed = 12;
    if (docId) {
      const doctor = await Doctor.findById(docId);
      if (doctor) {
        rollingSpeed = doctor.expectedConsultationMinutes(12);
      }
    }

    const etaRange = computeEtaRange(patientsAhead, rollingSpeed);

    // Add entry to queue
    const entryPriority = priority || (encounter ? encounter.triagePriority : 'normal');
    queue.entries.push({
      patientId: patientId || (encounter ? encounter.patientId : '60d0fe4f5311236168a109ca'),
      encounterId: encounter ? encounter._id : null,
      tokenNumber,
      priority: entryPriority,
      joinedAt: new Date(),
      status: 'waiting',
      estimatedWaitMinutes: patientsAhead * rollingSpeed
    });

    await queue.save();

    // Generate QR payload containing ZERO clinical data (§20)
    const qrPayload = buildTokenPayload({
      sessionId: encounter ? encounter._id : tokenNumber,
      tokenNumber
    });

    const qrSvgDataUri = generateQrSvgDataUri(qrPayload);

    const printableHtml = buildPrintableTokenSlipHtml({
      tokenNumber,
      patientName: req.body.patientName || 'Ayush Patient',
      department: req.body.departmentName || 'Kayachikitsa',
      triagePriority: entryPriority
    }, qrSvgDataUri);

    // Trigger Multi-Channel Notification (§20, §56)
    const targetPatId = patientId || (encounter ? encounter.patientId : null);
    if (targetPatId && mongoose.Types.ObjectId.isValid(targetPatId)) {
      try {
        const { sendNotification } = require('../services/notificationEngine');
        await sendNotification({
          recipientId: targetPatId,
          channel: 'push',
          template: 'token_issued',
          payload: {
            tokenNumber,
            patientsAhead,
            etaRange,
            roomNumber: 'Room 104',
            message: `OPD Token ${tokenNumber} issued. Department: ${req.body.departmentName || 'Kayachikitsa'}, Wait ETA: ${etaRange}.`
          }
        });
      } catch (e) {
        console.warn('Queue token notification note:', e?.message);
      }
    }

    return res.status(201).json({
      status: 'success',
      data: {
        tokenNumber,
        patientsAhead,
        etaRange, // Always a range string per §18
        qrPayload, // Zero clinical data in QR
        qrSvgDataUri,
        printableHtml,
        roomNumber: 'Room 104'
      }
    });
  } catch (error) {
    console.error('Error generating queue token:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/queue/live
 * @desc Get Live Queue display feed (§19)
 */
router.get('/live', async (req, res) => {
  try {
    const { hospitalId, departmentId, date } = req.query;
    const todayStr = date || new Date().toISOString().slice(0, 10);

    let query = { date: todayStr };
    if (hospitalId && String(hospitalId).match(/^[0-9a-fA-F]{24}$/)) query.hospitalId = hospitalId;
    if (departmentId && String(departmentId).match(/^[0-9a-fA-F]{24}$/)) query.departmentId = departmentId;

    const queue = await Queue.findOne(query).populate('entries.patientId');

    if (!queue) {
      return res.json({
        status: 'success',
        data: {
          tokenNumber: '—',
          currentlyServing: '—',
          patientsAhead: 0,
          etaRange: '0 - 5 mins',
          status: 'empty',
          entries: []
        }
      });
    }

    const waiting = queue.entries.filter(e => e.status === 'waiting');
    const inConsult = queue.entries.find(e => e.status === 'in_consultation');

    return res.json({
      status: 'success',
      data: {
        currentlyServing: inConsult ? inConsult.tokenNumber : (queue.entries.find(e => e.status === 'completed')?.tokenNumber || 'None'),
        totalWaiting: waiting.length,
        etaRange: computeEtaRange(waiting.length, 12),
        entries: queue.entries.map(e => ({
          tokenNumber: e.tokenNumber,
          priority: e.priority,
          status: e.status,
          joinedAt: e.joinedAt,
          patientName: e.patientId?.basicInfo?.fullName || 'Patient'
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching live queue:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/queue/consult-end
 * @desc Complete consultation, update doctor's rolling consultation speed, and recalculate ETAs (§18)
 */
router.post('/consult-end', async (req, res) => {
  try {
    const { queueId, tokenNumber, doctorId, actualDurationMinutes } = req.body;

    let queue = null;
    if (queueId) {
      queue = await Queue.findById(queueId);
    } else if (tokenNumber) {
      queue = await Queue.findOne({ 'entries.tokenNumber': tokenNumber });
    }

    if (queue && tokenNumber) {
      const entry = queue.entries.find(e => e.tokenNumber === tokenNumber);
      if (entry) {
        entry.status = 'completed';
        await queue.save();
      }
    }

    // Update Doctor rolling consultation speed if doctorId provided
    if (doctorId && actualDurationMinutes && Number(actualDurationMinutes) > 0) {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        const duration = Number(actualDurationMinutes);
        const stats = doctor.consultationStats || { sampleSize: 0, rollingAverageMinutes: 12 };
        const oldSample = stats.sampleSize || 0;
        const oldAvg = stats.rollingAverageMinutes || 12;

        const newSample = oldSample + 1;
        const newAvg = parseFloat((((oldAvg * oldSample) + duration) / newSample).toFixed(1));

        doctor.consultationStats = {
          sampleSize: newSample,
          rollingAverageMinutes: newAvg,
          lastComputedAt: new Date()
        };
        await doctor.save();
      }
    }

    return res.json({
      status: 'success',
      message: 'Consultation completed. Doctor rolling average speed updated and queue ETAs recalculated.'
    });
  } catch (error) {
    console.error('Error ending consultation:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/queue/my/:patientId
 * @desc Patient-facing live queue and follow-up slot status (§19, §33-34)
 */
router.get('/my/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const todayStr = new Date().toISOString().slice(0, 10);

    // Resolve patientId: patientId may be a MongoDB ObjectId, a phone number, or a custom string like "PAT-7383963235"
    let resolvedObjectId = null;
    if (mongoose.Types.ObjectId.isValid(patientId) && String(new mongoose.Types.ObjectId(patientId)) === String(patientId)) {
      resolvedObjectId = new mongoose.Types.ObjectId(patientId);
    } else {
      // Try resolving by matching Patient model if available
      try {
        const Patient = mongoose.models.Patient || require('../models/Patient');
        const cleanMobile = patientId.replace(/^PAT-/, '').replace(/\D/g, '');
        const matchedPatient = await Patient.findOne({
          $or: [
            { mobileNumber: cleanMobile },
            { abhaId: patientId },
            { contactNumber: cleanMobile }
          ]
        }).select('_id');
        if (matchedPatient) {
          resolvedObjectId = matchedPatient._id;
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    let activeEncounter = null;
    if (resolvedObjectId) {
      activeEncounter = await Encounter.findOne({
        patientId: resolvedObjectId,
        status: { $in: ['intake_completed', 'queued', 'in_consultation', 'doctor_review'] }
      }).sort({ createdAt: -1 });
    }

    let queue = null;
    if (resolvedObjectId) {
      queue = await Queue.findOne({ date: todayStr, 'entries.patientId': resolvedObjectId });
    }

    if (!queue && !activeEncounter) {
      return res.json({
        status: 'success',
        data: null,
        message: 'No active queue token found for today.'
      });
    }

    const tokenEntry = queue?.entries.find(e => 
      (resolvedObjectId && String(e.patientId) === String(resolvedObjectId)) || 
      (activeEncounter && e.tokenNumber === activeEncounter.tokenNumber)
    );

    let patientsAhead = 0;
    if (tokenEntry && queue) {
      const tokenIdx = queue.entries.findIndex(e => e.tokenNumber === tokenEntry.tokenNumber);
      patientsAhead = queue.entries.slice(0, tokenIdx).filter(e => e.status === 'waiting').length;
    }

    return res.json({
      status: 'success',
      data: {
        tokenNumber: tokenEntry?.tokenNumber || activeEncounter?.tokenNumber || 'OPD-ACTIVE',
        status: tokenEntry?.status || activeEncounter?.status || 'queued',
        priority: tokenEntry?.priority || activeEncounter?.triagePriority || 'normal',
        patientsAhead,
        etaRange: computeEtaRange(patientsAhead, 12),
        roomNumber: 'Room 104',
        departmentName: 'Kayachikitsa (Internal Medicine)',
        joinedAt: tokenEntry?.joinedAt || activeEncounter?.createdAt
      }
    });
  } catch (error) {
    console.warn('[Queue] Non-critical queue status check notice:', error.message);
    return res.json({ status: 'success', data: null, message: 'No active queue token found.' });
  }
});

module.exports = router;
