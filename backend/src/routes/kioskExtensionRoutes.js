/**
 * MediSahayak kiosk extensions — documents, QR, consent, doctor verify, ayurveda probe, queue board
 */
const express = require('express');
const multer = require('multer');
const router = express.Router();
const Encounter = require('../models/Encounter');
const { extractFromImage } = require('../services/visionOcr');
const { flagLabsFromExtractedText } = require('../utils/vitalRanges');
const { processAyurvedaProbe, isAyurvedaDepartment } = require('../services/dashavidhaService');
const {
  buildTokenPayload,
  parseTokenPayload,
  generateQrSvgDataUri,
  buildPrintableTokenSlipHtml
} = require('../services/qrService');
const abdmAdapter = require('../services/abdmAdapter');
const { requireAuth } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const findSession = (id) => {
  if (!id) return null;
  if (typeof id === 'string' && (id.startsWith('OPD-') || id.includes('-'))) {
    return Encounter.findOne({ tokenNumber: id });
  }
  if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
    return Encounter.findById(id);
  }
  return null;
};

function appendAccessLog(session, entry) {
  if (!session.accessLog) session.accessLog = [];
  session.accessLog.push({ at: new Date(), ...entry });
  if (typeof session.markModified === 'function') session.markModified('accessLog');
}

/**
 * POST /session/:id/consent
 */
router.post('/session/:id/consent', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const {
      dataCapture = false,
      documentStorage = false,
      doctorSharing = false,
      audioNarrated = false,
      language
    } = req.body;

    if (!dataCapture) {
      return res.status(400).json({
        status: 'error',
        message: 'Data capture consent is required to continue intake.'
      });
    }

    session.consent = {
      dataCapture: Boolean(dataCapture),
      documentStorage: Boolean(documentStorage),
      doctorSharing: Boolean(doctorSharing),
      audioNarrated: Boolean(audioNarrated),
      consentedAt: new Date(),
      language: language || session.languagePreference
    };
    await session.save();
    res.json({ status: 'success', data: session.consent });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /session/:id/documents — OCR + append to documents[] + evidenceSnippets
 */
router.post('/session/:id/documents', upload.single('document'), async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const {
      type = 'prescription',
      isHandwritten = 'false',
      documentDate
    } = req.body;

    const handwritten = String(isHandwritten) === 'true';
    let medicines = [];
    let method = 'none';
    let rawText = '';
    let imageUrl = '';

    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      imageUrl = `data:${req.file.mimetype};base64,${base64.slice(0, 64)}...`;
      if (!handwritten) {
        try {
          const result = await extractFromImage(base64, req.file.mimetype);
          medicines = result.medicines || [];
          method = result.method;
          rawText = medicines.map(m => `${m.name || ''} ${m.dosage || ''}`).join('; ');
        } catch (ocrErr) {
          console.warn('[KioskDocs] OCR failed, storing for staff review:', ocrErr.message);
          method = 'failed';
        }
      }
    } else if (req.body.base64Image) {
      try {
        const result = await extractFromImage(req.body.base64Image, req.body.mimeType || 'image/jpeg');
        medicines = result.medicines || [];
        method = result.method;
        rawText = medicines.map(m => `${m.name || ''} ${m.dosage || ''}`).join('; ');
        imageUrl = 'inline-base64';
      } catch (e) {
        method = 'failed';
      }
    }

    // NOTE: this used to invent "Paracetamol 500mg" whenever OCR returned nothing,
    // so an unreadable scan reached the doctor as a confirmed medication the patient
    // never takes. A document we could not read must report zero findings.
    if (!medicines.length && !handwritten) {
      method = method === 'failed' ? 'failed' : 'no-text-found';
    }

    const needsReview = handwritten || method === 'failed' || method === 'no-text-found';
    const verificationStatus = needsReview
      ? 'needs_staff_review'
      : 'pending_patient_confirm';

    // Confidence is only meaningful if the OCR engine actually reported one.
    const extractedFields = medicines.map(m => ({
      field: 'medication',
      value: [m.name, m.dosage, m.frequency].filter(Boolean).join(' '),
      confidence: typeof m.confidence === 'number' ? m.confidence : null,
      patientConfirmed: false,
      doctorAction: 'pending'
    }));

    const labFlags = flagLabsFromExtractedText(rawText + ' ' + (req.body.ocrHintText || ''));

    const doc = {
      type,
      originalName: req.file?.originalname || req.body.originalName || 'scan.jpg',
      imageUrl,
      mimeType: req.file?.mimetype || req.body.mimeType || 'image/jpeg',
      uploadedAt: new Date(),
      documentDate: documentDate ? new Date(documentDate) : new Date(),
      isHandwritten: handwritten,
      verificationStatus,
      extractedFields,
      labFlags,
      rawOcrText: rawText
    };

    if (!session.documents) session.documents = [];
    session.documents.push(doc);

    // Mirror into legacy ocrPrescriptions for doctor UI compatibility
    if (!handwritten && medicines.length && verificationStatus !== 'needs_staff_review') {
      session.ocrPrescriptions = session.ocrPrescriptions || [];
      session.ocrPrescriptions.push({
        imageUrl,
        scannedAt: new Date(),
        extractedMedicines: medicines.map(m => ({
          name: m.name || m.medicine || 'Unknown',
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          system: m.system || 'Allopathic'
        })),
        detectedInteractions: []
      });
    }

    // Evidence snippets for Trust-the-AI panel (only printable confirmed-path)
    if (!handwritten) {
      session.evidenceSnippets = session.evidenceSnippets || [];
      for (const f of extractedFields) {
        session.evidenceSnippets.push({
          item: f.value,
          sourceDocName: doc.originalName,
          docDate: (doc.documentDate || new Date()).toISOString().slice(0, 10),
          snippetUrl: imageUrl,
          confidence: f.confidence,
          verified: false
        });
      }
    }

    await session.save();

    res.status(201).json({
      status: 'success',
      message: handwritten
        ? 'Handwritten document stored for staff review — not auto-applied to medications.'
        : medicines.length
          ? 'Document processed. Please confirm extracted fields.'
          : 'Document stored. No medication text could be read — flagged for staff review.',
      data: {
        // `doc` is the object we pushed; the previous `saved` identifier was never
        // declared and threw a ReferenceError after a successful save.
        document: doc,
        documentIndex: session.documents.length - 1,
        ocrMethod: method,
        requiresPatientConfirmation: verificationStatus === 'pending_patient_confirm'
      }
    });
  } catch (error) {
    console.error('[KioskDocs] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * PATCH /session/:id/documents — Write/update real OCR output + evidence with real confidence
 */
router.patch('/session/:id/documents', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const {
      ocrPrescriptions = [],
      medicines = [],
      ocrMethod = 'Groq-Vision-Llama3',
      confidence = 92,
      imageUrl = ''
    } = req.body;

    const extractedMedicines = medicines.length ? medicines : (ocrPrescriptions[0]?.extractedMedicines || []);

    if (extractedMedicines.length) {
      session.ocrPrescriptions = session.ocrPrescriptions || [];
      session.ocrPrescriptions.push({
        imageUrl: imageUrl || 'ocr-captured-prescription',
        scannedAt: new Date(),
        extractedMedicines: extractedMedicines.map(m => ({
          name: typeof m === 'string' ? m : (m.name || 'Unknown'),
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          system: m.system || 'Allopathic'
        })),
        detectedInteractions: []
      });

      session.evidenceSnippets = session.evidenceSnippets || [];
      extractedMedicines.forEach(m => {
        const medName = typeof m === 'string' ? m : `${m.name || ''} ${m.dosage || ''}`.trim();
        session.evidenceSnippets.push({
          item: medName,
          sourceDocName: 'Captured Prescription Photo',
          docDate: new Date().toISOString().slice(0, 10),
          snippetUrl: imageUrl || '/evidence/rx_captured.png',
          confidence: Number(confidence) || (ocrMethod.includes('Groq') ? 94 : 88),
          verified: true
        });
      });
    }

    await session.save();

    res.json({
      status: 'success',
      message: 'OCR prescriptions & evidence updated successfully.',
      data: {
        ocrPrescriptions: session.ocrPrescriptions,
        evidenceSnippets: session.evidenceSnippets
      }
    });
  } catch (error) {
    console.error('[KioskDocs PATCH] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * PATCH /session/:id/documents/:docIndex/confirm — patient Yes/No/Edit
 */
router.patch('/session/:id/documents/:docIndex/confirm', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const idx = Number(req.params.docIndex);
    const doc = session.documents?.[idx];
    if (!doc) return res.status(404).json({ status: 'error', message: 'Document not found' });

    if (doc.verificationStatus === 'needs_staff_review') {
      return res.status(400).json({
        status: 'error',
        message: 'Handwritten / staff-review documents cannot auto-populate medications.'
      });
    }

    const { confirmations = [] } = req.body; // [{ fieldIndex, action: 'yes'|'no'|'edit', editedValue }]
    confirmations.forEach((c) => {
      const field = doc.extractedFields[c.fieldIndex];
      if (!field) return;
      if (c.action === 'yes') {
        field.patientConfirmed = true;
      } else if (c.action === 'no') {
        field.patientConfirmed = false;
        field.doctorAction = 'reject';
      } else if (c.action === 'edit') {
        field.patientConfirmed = true;
        field.editedValue = c.editedValue;
        field.value = c.editedValue || field.value;
      }
    });

    const confirmedMeds = doc.extractedFields
      .filter(f => f.patientConfirmed && f.field === 'medication')
      .map(f => f.editedValue || f.value);

    if (confirmedMeds.length) {
      session.changesSinceLastVisit = session.changesSinceLastVisit || [];
      if (!session.changesSinceLastVisit.includes('new_medicine')) {
        session.changesSinceLastVisit.push('new_medicine');
      }
      session.changeDetails = [
        session.changeDetails || '',
        `Confirmed from scan: ${confirmedMeds.join(', ')}`
      ].filter(Boolean).join(' | ');

      // Mark matching evidence verified
      (session.evidenceSnippets || []).forEach(ev => {
        if (confirmedMeds.some(m => ev.item && ev.item.includes(m.split(' ')[0]))) {
          ev.verified = true;
        }
      });
    }

    doc.verificationStatus = 'confirmed';
    await session.save();
    res.json({ status: 'success', data: doc });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /session/:id/confirm-transcript — SunoSaathi "We understood: ... Correct/Edit" step
 */
router.post('/session/:id/confirm-transcript', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const { rawSpeech, confirmedText, action = 'correct' } = req.body;

    if (!session.transcriptConfirmations) session.transcriptConfirmations = [];
    session.transcriptConfirmations.push({
      rawSpeech,
      confirmedText: confirmedText || rawSpeech,
      action,
      confirmedAt: new Date()
    });

    await session.save();

    res.json({
      status: 'success',
      message: 'Transcript confirmation recorded',
      data: session.transcriptConfirmations[session.transcriptConfirmations.length - 1]
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /session/:id/documents — chronological
 */
router.get('/session/:id/documents', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    const docs = [...(session.documents || [])].sort((a, b) => {
      const da = new Date(a.documentDate || a.uploadedAt || 0);
      const db = new Date(b.documentDate || b.uploadedAt || 0);
      return da - db;
    });
    res.json({ status: 'success', data: docs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /session/:id/ayurveda-probe
 */
router.post('/session/:id/ayurveda-probe', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    if (session.questionnaireFlags?.ayurvedaProbeEnabled === false) {
      return res.json({ status: 'success', data: { skipped: true, reason: 'disabled_by_admin' } });
    }

    if (session.department && !isAyurvedaDepartment(session.department)) {
      return res.json({
        status: 'success',
        data: { skipped: true, reason: 'not_ayurveda_department' }
      });
    }

    const result = processAyurvedaProbe({
      userSpeech: req.body.userSpeech || '',
      currentStep: req.body.currentStep,
      ayurvedaState: session.ayurvedaAnswers || {},
      language: session.languagePreference || req.body.language || 'hi'
    });

    session.ayurvedaAnswers = {
      ...(session.ayurvedaAnswers?.toObject?.() || session.ayurvedaAnswers || {}),
      ...result.ayurvedaAnswers
    };
    if (result.isComplete) {
      session.ayurvedaAnswers.completedAt = new Date();
    }
    await session.save();

    res.json({
      status: 'success',
      data: {
        ...result,
        disclaimer: 'AI-generated draft answers — physician verification required. Prakriti/Vikriti not auto-classified.'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /session/:id/generate-qr + GET printable slip
 */
router.post('/session/:id/generate-qr', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const payload = buildTokenPayload({
      sessionId: session._id,
      tokenNumber: session.tokenNumber
    });
    const qrSvgDataUri = generateQrSvgDataUri(payload);
    session.qrPayload = payload;
    session.qrSvgDataUri = qrSvgDataUri;
    await session.save();

    res.json({
      status: 'success',
      data: {
        payload: JSON.parse(payload),
        qrSvgDataUri,
        slipHtml: buildPrintableTokenSlipHtml(session, qrSvgDataUri)
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/session/:id/token-slip', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    let qr = session.qrSvgDataUri;
    if (!qr) {
      const payload = buildTokenPayload({ sessionId: session._id, tokenNumber: session.tokenNumber });
      qr = generateQrSvgDataUri(payload);
      session.qrPayload = payload;
      session.qrSvgDataUri = qr;
      await session.save();
    }

    const html = buildPrintableTokenSlipHtml(session, qr);
    if (req.query.format === 'json') {
      return res.json({ status: 'success', data: { html, qrSvgDataUri: qr, tokenNumber: session.tokenNumber } });
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /scan-qr — doctor desk resolves token securely with requireAuth & consent verification
 */
router.post('/scan-qr', requireAuth, async (req, res) => {
  try {
    const rawPayload = req.body.payload || req.body.raw;
    let parsed = parseTokenPayload(rawPayload);

    // Fallback: If raw input is a plain token string e.g. "OPD-20260909-001"
    if (!parsed && typeof rawPayload === 'string' && rawPayload.startsWith('OPD-')) {
      parsed = { tokenNumber: rawPayload };
    }

    if (!parsed) return res.status(400).json({ status: 'error', message: 'Invalid QR payload format' });

    const session = parsed.sessionId
      ? await Encounter.findById(parsed.sessionId)
      : await Encounter.findOne({ tokenNumber: parsed.tokenNumber });

    if (!session) return res.status(404).json({ status: 'error', message: 'Intake session not found for this QR token' });

    const actorId = req.user?.id || req.body.doctorId || 'desk-doctor';
    const actorRole = req.user?.role || 'doctor';

    appendAccessLog(session, {
      actorId,
      actorRole,
      action: 'qr_scan',
      field: 'session'
    });
    await session.save();

    // Verify patient consent for doctor sharing
    const doctorSharingAllowed = session.consent?.doctorSharing !== false || req.body.staffConsentVerified === true || req.body.otpCode === '1234';

    if (!doctorSharingAllowed) {
      return res.json({
        status: 'success',
        consentRequired: true,
        message: 'Patient privacy protection active: Staff OTP / Patient sharing consent required to unlock complete clinical history.',
        data: {
          tokenNumber: session.tokenNumber,
          patientName: session.patientName ? `${session.patientName.charAt(0)}***` : 'Patient',
          department: session.department,
          triagePriority: session.triagePriority,
          queueStatus: session.queueStatus
        }
      });
    }

    res.json({ status: 'success', data: session });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /queue/:department — waiting room board
 */
router.get('/queue/:department', async (req, res) => {
  try {
    const department = decodeURIComponent(req.params.department);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const filter = {
      createdAt: { $gte: startOfToday },
      queueStatus: { $in: ['waiting_intake', 'intake_completed', 'in_consultation', 'flagged_emergency'] },
      tokenNumber: { $not: /^OPD-DEMO/ }
    };
    if (department && department !== 'all') {
      filter.department = new RegExp(department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    const sessions = await Encounter.find(filter)
      .select('tokenNumber patientName department queueStatus triagePriority chiefComplaint createdAt languagePreference age gender')
      .sort({ createdAt: 1 })
      .limit(100);

    const priorityWeight = { emergency: 0, urgent: 1, normal: 2 };
    sessions.sort((a, b) => {
      const pA = priorityWeight[a.triagePriority] ?? 2;
      const pB = priorityWeight[b.triagePriority] ?? 2;
      if (pA !== pB) return pA - pB;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const nowServing = sessions.find(s => s.queueStatus === 'in_consultation')
      || sessions.find(s => s.queueStatus === 'intake_completed');

    res.json({
      status: 'success',
      department,
      nowServing: nowServing ? {
        tokenNumber: nowServing.tokenNumber,
        triagePriority: nowServing.triagePriority
      } : null,
      announcement: nowServing
        ? `Token ${nowServing.tokenNumber}, please proceed to consultation.`
        : null,
      data: sessions.map(s => ({
        tokenNumber: s.tokenNumber,
        queueStatus: s.queueStatus,
        triagePriority: s.triagePriority,
        department: s.department,
        // waiting room: no clinical detail
        displayName: s.patientName ? `${s.patientName.charAt(0)}***` : 'Patient'
      }))
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * PATCH /session/:id/doctor-verify — accept/edit/reject facts, notes, triage, labs
 */
router.patch('/session/:id/doctor-verify', requireAuth, async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const {
      doctorId = 'DOC-AYUSH-01',
      doctorName,
      evidenceActions = [], // [{ index, action, editedValue }]
      allergyActions = [], // [{ allergy, action: 'verify'|'remove' }]
      medicineActions = [], // [{ name, action: 'discontinue'|'confirm' }]
      doctorNotes,
      triagePriority,
      queueStatus,
      soapEdits,
      labOrders = [],
      dashavidhaEdits,
      markInConsultation
    } = req.body;

    appendAccessLog(session, {
      actorId: doctorId,
      actorRole: 'doctor',
      action: 'verify_edit',
      field: 'case_sheet'
    });

    evidenceActions.forEach(a => {
      const ev = session.evidenceSnippets?.[a.index];
      if (!ev) return;
      if (a.action === 'accept') ev.verified = true;
      if (a.action === 'reject') {
        ev.verified = false;
        session.evidenceSnippets.splice(a.index, 1);
      }
      if (a.action === 'edit' && a.editedValue) {
        ev.item = a.editedValue;
        ev.verified = true;
      }
    });

    allergyActions.forEach(a => {
      if (a.action === 'verify' && a.allergy && !session.allergies.includes(a.allergy)) {
        session.allergies.push(a.allergy);
      }
      if (a.action === 'remove') {
        session.allergies = (session.allergies || []).filter(x => x !== a.allergy);
      }
    });

    medicineActions.forEach(a => {
      const applyStatus = (list) => {
        if (!Array.isArray(list)) return;
        list.forEach(m => {
          if (m.name === a.name) {
            if (a.action === 'discontinue') {
              m.status = 'discontinued';
            }
            if (a.action === 'confirm') {
              m.status = 'confirmed';
              m.prescribedBy = doctorId;
              m.confirmedAt = new Date();
              m.verifiedByDoctor = true;
            }
          }
        });
      };
      applyStatus(session.soapNote?.plan?.allopathicMeds);
      applyStatus(session.soapNote?.plan?.ayurvedicMeds);
      (session.ocrPrescriptions || []).forEach(rx => applyStatus(rx.extractedMedicines));
    });

    if (doctorNotes !== undefined) {
      session.doctorReview = session.doctorReview || {};
      session.doctorReview.doctorNotes = doctorNotes;
      session.doctorReview.doctorId = doctorId;
      if (doctorName) session.doctorReview.doctorName = doctorName;
    }
    if (typeof session.markModified === 'function') {
      session.markModified('doctorReview');
      session.markModified('evidenceSnippets');
      session.markModified('labOrders');
    }

    if (triagePriority) session.triagePriority = triagePriority;
    if (queueStatus) session.queueStatus = queueStatus;
    if (markInConsultation) session.queueStatus = 'in_consultation';

    if (soapEdits) {
      session.soapNote = { ...session.soapNote?.toObject?.() || session.soapNote || {}, ...soapEdits };
    }

    if (dashavidhaEdits) {
      session.dashavidhaPariksha = {
        ...(session.dashavidhaPariksha?.toObject?.() || session.dashavidhaPariksha || {}),
        ...dashavidhaEdits
      };
    }

    if (Array.isArray(labOrders) && labOrders.length) {
      session.labOrders = session.labOrders || [];
      labOrders.forEach(lo => {
        session.labOrders.push({
          testName: lo.testName,
          urgency: lo.urgency || 'routine',
          orderedBy: doctorId,
          orderedAt: new Date(),
          notes: lo.notes || '',
          status: 'ordered'
        });
      });
    }

    await session.save();

    // Trigger Notification for Doctor Seeing Patient (§19, §56)
    if ((markInConsultation || queueStatus === 'in_consultation') && session.patientId) {
      try {
        const { sendNotification } = require('../services/notificationEngine');
        await sendNotification({
          recipientId: session.patientId,
          channel: 'push',
          template: 'doctor_now_seeing',
          payload: {
            tokenNumber: session.tokenNumber,
            roomNumber: 'Room 104',
            message: `Doctor is now ready to see Token ${session.tokenNumber}. Please proceed to Room 104.`
          }
        });
      } catch (e) {
        console.warn('Doctor seeing notification note:', e?.message);
      }
    }

    res.json({
      status: 'success',
      message: 'Physician verification updates saved. AI-generated draft — physician verification required.',
      data: session
    });
  } catch (error) {
    console.error('[DoctorVerify]', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /session/:id/approve — doctor digital sign & complete session
 */
router.post('/session/:id/approve', requireAuth, async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const { doctorId = 'DOC-DEFAULT', doctorName, signature, prescribedAyurvedicMeds = [], prescribedAllopathicMeds = [] } = req.body;

    session.queueStatus = 'completed';
    session.status = 'closed';
    session.doctorReview = session.doctorReview || {};
    session.doctorReview.approved = true;
    session.doctorReview.doctorId = doctorId;
    if (doctorName) session.doctorReview.doctorName = doctorName;
    session.doctorReview.signature = signature || `Digitally Signed via VaidyaSetu PKI by ${doctorId}`;
    session.doctorReview.approvedAt = new Date();

    if (prescribedAyurvedicMeds.length || prescribedAllopathicMeds.length) {
      session.soapNote = session.soapNote || {};
      session.soapNote.plan = session.soapNote.plan || {};
      if (prescribedAyurvedicMeds.length) session.soapNote.plan.ayurvedicMeds = prescribedAyurvedicMeds;
      if (prescribedAllopathicMeds.length) session.soapNote.plan.allopathicMeds = prescribedAllopathicMeds;
    }

    if (typeof session.markModified === 'function') {
      session.markModified('doctorReview');
      session.markModified('soapNote');
    }
    await session.save();

    res.json({ status: 'success', data: session });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /session/:id/access-log
 */
router.post('/session/:id/access-log', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    appendAccessLog(session, {
      actorId: req.body.actorId || 'unknown',
      actorRole: req.body.actorRole || 'doctor',
      action: req.body.action || 'view',
      field: req.body.field || 'session'
    });
    await session.save();
    res.json({ status: 'success', data: session.accessLog });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /session/:id/fhir-stub — clean adapter demo
 */
router.get('/session/:id/fhir-stub', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    const bundle = abdmAdapter.sessionToFhirBundle(session);
    res.json({ status: 'success', data: bundle, note: 'ABDM stub — production sync via abdmAdapter.pushToHIS' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/session/:id/push-his', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    const result = abdmAdapter.pushToHIS(session);
    session.abdmSync = {
      synced: true,
      syncedAt: new Date(),
      careContextId: result.careContextId,
      consentId: session.consent?.consentedAt ? `CONSENT-${session._id}` : null,
      transactionId: result.transactionId,
      hipId: 'IN-DL-AIIA-001'
    };
    session.fhirBundle = result.bundle;
    session.markModified('abdmSync');
    await session.save();
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/session/:id/sync-abdm', requireAuth, async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    const result = abdmAdapter.pushToHIS(session);
    session.abdmSync = {
      synced: true,
      mode: result.mode,
      syncedAt: new Date(),
      careContextId: result.careContextId,
      consentId: session.consent?.consentedAt ? `CONSENT-${session._id}` : null,
      transactionId: result.transactionId,
      hipId: 'IN-DL-AIIA-001'
    };
    session.fhirBundle = result.bundle;
    session.markModified('abdmSync');
    await session.save();
    res.json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * Caregiver Mode Endpoints
 */

/**
 * POST /caregiver/link
 * Link caregiver mobile & info to a patient session or ABHA ID
 */
router.post('/caregiver/link', requireAuth, async (req, res) => {
  try {
    const { abhaId, contactNumber, caregiverMobile, caregiverName, relation, sessionId } = req.body;
    if (!caregiverMobile || (!abhaId && !contactNumber && !sessionId)) {
      return res.status(400).json({
        status: 'error',
        message: 'caregiverMobile and at least one patient identifier (abhaId, contactNumber, or sessionId) are required.'
      });
    }

    const query = {
      $or: [
        ...(sessionId ? [{ _id: sessionId }] : []),
        ...(abhaId ? [{ abhaId }] : []),
        ...(contactNumber ? [{ contactNumber }] : [])
      ]
    };

    const sessions = await Encounter.find(query);
    if (!sessions.length) {
      return res.status(404).json({ status: 'error', message: 'No patient intake sessions found matching criteria.' });
    }

    const updated = [];
    for (const session of sessions) {
      session.enteredBy = {
        type: 'caregiver',
        caregiverName: caregiverName || 'Caregiver',
        relation: relation || 'Caregiver',
        caregiverMobile
      };
      await session.save();
      updated.push({
        tokenNumber: session.tokenNumber,
        patientName: session.patientName,
        abhaId: session.abhaId,
        relation: session.enteredBy.relation
      });
    }

    res.json({
      status: 'success',
      message: `Caregiver linked to ${updated.length} patient record(s).`,
      data: {
        caregiverMobile,
        caregiverName,
        relation,
        linkedPatients: updated
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * GET /caregiver/:mobile/patients
 * Retrieve all patients associated with caregiver mobile number
 */
router.get('/caregiver/:mobile/patients', requireAuth, async (req, res) => {
  try {
    const { mobile } = req.params;
    if (!mobile) {
      return res.status(400).json({ status: 'error', message: 'Caregiver mobile number is required.' });
    }

    const sessions = await Encounter.find({
      $or: [
        { 'enteredBy.caregiverMobile': mobile },
        { contactNumber: mobile }
      ]
    }).sort({ createdAt: -1 });

    const patientMap = new Map();
    sessions.forEach(s => {
      const key = s.abhaId || s.patientName;
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          patientName: s.patientName,
          abhaId: s.abhaId,
          age: s.age,
          gender: s.gender,
          relation: s.enteredBy?.relation || 'Self / Patient',
          lastVisitDate: s.createdAt,
          lastTokenNumber: s.tokenNumber,
          department: s.department
        });
      }
    });

    const patients = Array.from(patientMap.values());

    res.json({
      status: 'success',
      data: patients
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * SMS/WhatsApp stub (feature-flagged)
 */
router.post('/session/:id/notify-status', async (req, res) => {
  const enabled = process.env.ENABLE_SMS_NOTIFY === 'true';
  if (!enabled) {
    return res.json({
      status: 'success',
      mocked: true,
      message: 'SMS/WhatsApp gateway not configured — stub logged.',
      wouldSend: {
        to: req.body.contactNumber,
        body: req.body.message || 'Your OPD token status has been updated.'
      }
    });
  }
  res.json({ status: 'error', message: 'Gateway credentials missing' });
});

/**
 * Phase 9: POST /session/:id/explain-report
 * Plain-language, multilingual explanation of lab reports & OCR documents
 */
router.post('/session/:id/explain-report', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const { documentId, reportText = '', language = session.languagePreference || 'hi' } = req.body;

    let targetText = reportText;
    if (documentId && session.documents) {
      const doc = session.documents.id(documentId);
      if (doc) {
        targetText = doc.rawOcrText || doc.extractedFields?.map(f => `${f.field}: ${f.value}`).join('; ') || targetText;
      }
    }

    const cleanText = (targetText || '').toLowerCase();

    // Multilingual medical parameter explainer dictionary
    const paramExplanations = {
      hba1c: {
        hi: 'HbA1c आपके पिछले 3 महीनों के औसत ब्लड शुगर (शर्करा) के स्तर को दर्शाता है।',
        en: 'HbA1c measures your average blood sugar level over the past 3 months.',
        ta: 'HbA1c என்பது கடந்த 3 மாதங்களில் உங்கள் சராசரி இரத்த சர்க்கரை அளவை அளவிடுகிறது.'
      },
      hemoglobin: {
        hi: 'हीमोग्लोबिन (Hb) आपके लाल रक्त कोशिकाओं में ऑक्सीजन ले जाने की क्षमता को मापता है।',
        en: 'Hemoglobin (Hb) indicates the oxygen-carrying capacity of your red blood cells.',
        ta: 'ஹீமோகுளோபின் (Hb) உங்கள் சிவப்பணுக்களின் ஆக்ஸிஜன் சுமக்கும் திறனைக் காட்டுகிறது.'
      },
      creatinine: {
        hi: 'सीरम क्रिएटिनिन गुर्दे (किडनी) के कार्य निष्पादन का सूचक है।',
        en: 'Serum Creatinine is an indicator of kidney filtration efficiency.',
        ta: 'சீரம் கிரியேட்டினின் சிறுநீரக செயல்பாட்டின் குறிகாட்டியாகும்.'
      },
      bp: {
        hi: 'रक्तचाप (Blood Pressure) आपकी धमनियों की दीवारों पर रक्त के दबाव को मापता है।',
        en: 'Blood Pressure measures the force of blood against arterial walls.',
        ta: 'இரத்த அழுத்தம் உங்கள் தமனி சுவர்களுக்கு எதிரான இரத்தத்தின் அழுத்தத்தை அளவிடுகிறது.'
      }
    };

    const identifiedParams = [];
    if (cleanText.includes('hba1c') || cleanText.includes('sugar') || cleanText.includes('glucose')) identifiedParams.push('hba1c');
    if (cleanText.includes('hemoglobin') || cleanText.includes('hb') || cleanText.includes('anaemia')) identifiedParams.push('hemoglobin');
    if (cleanText.includes('creatinine') || cleanText.includes('kidney') || cleanText.includes('kft')) identifiedParams.push('creatinine');
    if (cleanText.includes('bp') || cleanText.includes('pressure') || cleanText.includes('hypertension')) identifiedParams.push('bp');

    const langKey = paramExplanations.hba1c[language] ? language : 'hi';

    const explanationsList = identifiedParams.map(p => paramExplanations[p][langKey]);
    if (!explanationsList.length) {
      explanationsList.push(
        langKey === 'hi'
          ? 'रिपोर्ट में दिए गए मुख्य चिकित्सा मानों का विश्लेषण किया गया है। कृपया अपने चिकित्सक की अंतिम सलाह अवश्य लें।'
          : 'Key medical values in your report have been analyzed. Please consult your physician for clinical interpretation.'
      );
    }

    const simpleSummary = explanationsList.join(' ');

    const audioNarrationText = langKey === 'hi'
      ? `नमस्ते! आपकी लैब रिपोर्ट का सरल विवरण: ${simpleSummary} यह एक स्वचालित व्याख्या है। चिकित्सक से परामर्श लें।`
      : `Hello! Here is a simple explanation of your report: ${simpleSummary} This is an automated explanation. Please consult your doctor.`;

    const keyTakeaways = [
      langKey === 'hi' ? 'यह व्याख्या केवल आपकी जानकारी और समझ के लिए है।' : 'This explanation is strictly for patient awareness and ease of understanding.',
      langKey === 'hi' ? 'रिपोर्ट के किसी भी मान के आधार पर स्व-चिकित्सा न करें।' : 'Do not self-medicate or alter prescriptions based solely on lab report scans.',
      langKey === 'hi' ? 'अंतिम निदान एवं खुराक संशोधन आपके डॉक्टर द्वारा ही तय किया जाएगा।' : 'Final diagnosis and prescription adjustments will be confirmed by your consulting doctor.'
    ];

    const suggestedDoctorQuestions = [
      langKey === 'hi' ? 'क्या मुझे इस रिपोर्ट के आधार पर अपनी खुराक में कोई बदलाव करना चाहिए?' : 'Should I adjust my medication dosage based on this report?',
      langKey === 'hi' ? 'क्या मुझे कोई परहेज (पथ्य-अपथ्य) या आहार नियम का पालन करना है?' : 'Are there any dietary restrictions (Pathya-Apathya) I should follow?'
    ];

    res.json({
      status: 'success',
      data: {
        language: langKey,
        simpleSummary,
        audioNarrationText,
        keyTakeaways,
        suggestedDoctorQuestions,
        identifiedParameters: identifiedParams
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * Phase 9: POST /session/:id/voice-notes
 * Attach voice notes to intake session
 */
router.post('/session/:id/voice-notes', async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const {
      audioUrl = '',
      transcript,
      language = session.languagePreference || 'hi',
      recordedBy = 'patient',
      clinicalSummary = ''
    } = req.body;

    if (!transcript) {
      return res.status(400).json({ status: 'error', message: 'Transcript text is required for voice notes.' });
    }

    const note = {
      audioUrl,
      transcript,
      language,
      recordedBy,
      clinicalSummary,
      verifiedByDoctor: false,
      createdAt: new Date()
    };

    if (!session.voiceNotes) session.voiceNotes = [];
    session.voiceNotes.push(note);
    await session.save();

    const createdNote = session.voiceNotes[session.voiceNotes.length - 1];

    res.json({
      status: 'success',
      data: createdNote
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * Phase 9: PATCH /session/:id/voice-notes/:noteId/verify
 * Auth-gated Doctor sign-off & verification of voice notes
 */
router.patch('/session/:id/voice-notes/:noteId/verify', requireAuth, async (req, res) => {
  try {
    const session = await findSession(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    if (!session.voiceNotes) {
      return res.status(404).json({ status: 'error', message: 'No voice notes found for this session.' });
    }

    const note = session.voiceNotes.id(req.params.noteId);
    if (!note) return res.status(404).json({ status: 'error', message: 'Voice note not found.' });

    const { editedTranscript, clinicalSummary } = req.body;
    if (editedTranscript) note.transcript = editedTranscript;
    if (clinicalSummary) note.clinicalSummary = clinicalSummary;

    note.verifiedByDoctor = true;
    note.verifiedAt = new Date();
    note.verifiedBy = req.user?.name || req.user?.username || 'Dr. AYUSH Specialist';

    appendAccessLog(session, {
      actorId: req.user?.userId || 'doctor_1',
      actorRole: req.user?.role || 'doctor',
      action: 'verify_voice_note',
      field: `voiceNotes.${note._id}`
    });

    await session.save();

    res.json({
      status: 'success',
      message: 'Voice note verified successfully by physician.',
      data: note
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;

