/**
 * Phase 10: Enhanced Admin & Lab Modules
 * - JWT-protected admin routes (requireAuth + requireRole)
 * - Operational KPI stats with real-time queue data
 * - Department questionnaire toggles
 * - Lab order tracking & status updates
 * - Lab result upload and "resulted" workflow
 */
const express = require('express');
const router = express.Router();
const IntakeSession = require('../models/IntakeSession');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// ─── In-memory department config (prototype — swap for DB collection in prod) ───
const departmentConfig = {
  Kayachikitsa:          { enabled: true, dashavidhaEnabled: true,  ayurvedaProbeEnabled: true  },
  Panchakarma:           { enabled: true, dashavidhaEnabled: true,  ayurvedaProbeEnabled: true  },
  Shalya:                { enabled: true, dashavidhaEnabled: true,  ayurvedaProbeEnabled: true  },
  Shalakya:              { enabled: true, dashavidhaEnabled: true,  ayurvedaProbeEnabled: true  },
  'Prasuti & Stri Roga': { enabled: true, dashavidhaEnabled: true,  ayurvedaProbeEnabled: true  },
  Prasuti:               { enabled: true, dashavidhaEnabled: true,  ayurvedaProbeEnabled: true  },
  Kaumarbhritya:         { enabled: true, dashavidhaEnabled: false, ayurvedaProbeEnabled: true  },
  Swasthavritta:         { enabled: true, dashavidhaEnabled: true,  ayurvedaProbeEnabled: true  },
  'General Medicine':    { enabled: true, dashavidhaEnabled: false, ayurvedaProbeEnabled: false }
};

// ─── Admin-only guard: JWT auth + requireRole('admin') ──────────────────────────
const adminOnly = [requireAuth, requireRole('admin')];

// ─── DEPARTMENT ROUTES ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/departments
 * Returns all department configurations
 */
router.get('/departments', ...adminOnly, (req, res) => {
  res.json({ status: 'success', data: departmentConfig });
});

/**
 * PATCH /api/admin/departments/:name
 * Toggle department feature flags (enabled, dashavidhaEnabled, ayurvedaProbeEnabled)
 */
router.patch('/departments/:name', ...adminOnly, (req, res) => {
  const name = decodeURIComponent(req.params.name);
  if (!departmentConfig[name]) {
    return res.status(404).json({ status: 'error', message: 'Unknown department: ' + name });
  }
  const { enabled, dashavidhaEnabled, ayurvedaProbeEnabled } = req.body;
  if (enabled !== undefined) departmentConfig[name].enabled = Boolean(enabled);
  if (dashavidhaEnabled !== undefined) departmentConfig[name].dashavidhaEnabled = Boolean(dashavidhaEnabled);
  if (ayurvedaProbeEnabled !== undefined) departmentConfig[name].ayurvedaProbeEnabled = Boolean(ayurvedaProbeEnabled);
  res.json({ status: 'success', data: { [name]: departmentConfig[name] } });
});

/**
 * GET /api/admin/questionnaire-flags/:department
 * Returns feature flags for a specific department
 */
router.get('/questionnaire-flags/:department', ...adminOnly, (req, res) => {
  const name = decodeURIComponent(req.params.department);
  const cfg = departmentConfig[name] || { enabled: true, dashavidhaEnabled: true, ayurvedaProbeEnabled: true };
  res.json({ status: 'success', data: cfg });
});

// ─── OPERATIONAL STATS ────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Real-time OPD operational KPI dashboard statistics
 */
router.get('/stats', ...adminOnly, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySessions = await IntakeSession.find({
      createdAt: { $gte: startOfToday },
      tokenNumber: { $not: /^OPD-DEMO/ }
    });

    const redFlagCount = todaySessions.filter(
      s => (s.redFlags && s.redFlags.length) || s.queueStatus === 'flagged_emergency'
    ).length;

    const completed = todaySessions.filter(
      s => s.doctorReview?.approved || s.queueStatus === 'completed'
    );
    const inConsultation = todaySessions.filter(s => s.queueStatus === 'in_consultation').length;
    const waitingIntake  = todaySessions.filter(s => s.queueStatus === 'waiting_intake').length;
    const intakeCompleted = todaySessions.filter(s => s.queueStatus === 'intake_completed').length;

    const editedByDoctor = completed.filter(s => {
      const notes = s.doctorReview?.doctorNotes;
      const accessEdits = (s.accessLog || []).some(a => a.action === 'verify_edit');
      return Boolean(notes) || accessEdits;
    });

    const intakeDurations = todaySessions
      .filter(s => s.createdAt && s.updatedAt && s.queueStatus !== 'waiting_intake')
      .map(s => (new Date(s.updatedAt) - new Date(s.createdAt)) / 60000);

    const avgIntakeMinutes = intakeDurations.length
      ? Math.round((intakeDurations.reduce((a, b) => a + b, 0) / intakeDurations.length) * 10) / 10
      : 0;

    // Lab stats
    const allLabOrders = todaySessions.flatMap(s => s.labOrders || []);
    const pendingLabs   = allLabOrders.filter(lo => lo.status === 'ordered' || lo.status === 'collected').length;
    const resultedLabs  = allLabOrders.filter(lo => lo.status === 'resulted').length;
    const urgentLabs    = allLabOrders.filter(lo => lo.urgency === 'stat').length;

    // Per-department counts
    const byDepartment = Object.keys(departmentConfig).reduce((acc, d) => {
      acc[d] = todaySessions.filter(s => s.department === d).length;
      return acc;
    }, {});

    // Red-flag detail list (latest 5)
    const recentRedFlags = todaySessions
      .filter(s => s.redFlags && s.redFlags.length)
      .slice(-5)
      .map(s => ({
        tokenNumber: s.tokenNumber,
        patientName: s.patientName,
        department: s.department,
        flags: s.redFlags.map(f => f.flag),
        triagePriority: s.triagePriority
      }));

    res.json({
      status: 'success',
      data: {
        sessionsToday: todaySessions.length,
        redFlagCount,
        avgIntakeMinutes,
        pctAiSummariesEditedByDoctor: completed.length
          ? Math.round((editedByDoctor.length / completed.length) * 100)
          : 0,
        completedConsultations: completed.length,
        emergencyInQueue: todaySessions.filter(s => s.triagePriority === 'emergency').length,
        queueSummary: { waitingIntake, intakeCompleted, inConsultation, completed: completed.length },
        labStats: { pendingLabs, resultedLabs, urgentLabs, totalOrdered: allLabOrders.length },
        byDepartment,
        recentRedFlags
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─── QUEUE MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/queue
 * Full OPD queue with optional status and department filters
 */
router.get('/queue', ...adminOnly, async (req, res) => {
  try {
    const { status, department, limit = 50 } = req.query;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const query = { createdAt: { $gte: startOfToday } };
    if (status) query.queueStatus = status;
    if (department) query.department = department;

    const sessions = await IntakeSession.find(query)
      .select('tokenNumber patientName age gender department queueStatus triagePriority redFlags vitals createdAt labOrders voiceNotes')
      .sort({ triagePriority: -1, createdAt: 1 })
      .limit(parseInt(limit));

    res.json({
      status: 'success',
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * PATCH /api/admin/queue/:tokenOrId/status
 * Update queue status and triage priority (admin/doctor only)
 */
router.patch('/queue/:tokenOrId/status', ...adminOnly, async (req, res) => {
  try {
    const { tokenOrId } = req.params;
    const { queueStatus, triagePriority } = req.body;

    const session = await IntakeSession.findOne({ tokenNumber: tokenOrId }) ||
                    await IntakeSession.findById(tokenOrId).catch(() => null);

    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    if (queueStatus)    session.queueStatus    = queueStatus;
    if (triagePriority) session.triagePriority = triagePriority;
    await session.save();

    res.json({
      status: 'success',
      message: `Queue status updated to ${queueStatus || session.queueStatus}`,
      data: { tokenNumber: session.tokenNumber, queueStatus: session.queueStatus, triagePriority: session.triagePriority }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─── LAB MODULE ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/lab-orders
 * Retrieve all pending lab orders across today's sessions (Lab Technician view)
 */
router.get('/lab-orders', ...adminOnly, async (req, res) => {
  try {
    const { status = 'ordered', urgency } = req.query;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sessions = await IntakeSession.find({
      createdAt: { $gte: startOfToday },
      'labOrders.0': { $exists: true }
    }).select('tokenNumber patientName age gender department labOrders');

    const flatOrders = [];
    sessions.forEach(s => {
      (s.labOrders || []).forEach((lo, idx) => {
        if (status && lo.status !== status) return;
        if (urgency && lo.urgency !== urgency) return;
        flatOrders.push({
          sessionId: s._id.toString(),
          tokenNumber: s.tokenNumber,
          patientName: s.patientName,
          age: s.age,
          gender: s.gender,
          department: s.department,
          orderIndex: idx,
          orderId: lo._id?.toString() || idx,
          testName: lo.testName,
          urgency: lo.urgency,
          status: lo.status,
          orderedBy: lo.orderedBy,
          orderedAt: lo.orderedAt,
          notes: lo.notes
        });
      });
    });

    // Sort: stat → urgent → routine
    const urgencyOrder = { stat: 0, urgent: 1, routine: 2 };
    flatOrders.sort((a, b) => (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2));

    res.json({ status: 'success', count: flatOrders.length, data: flatOrders });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * PATCH /api/admin/lab-orders/:sessionId/:orderId/status
 * Update lab order status (collected → resulted) and attach result values
 */
router.patch('/lab-orders/:sessionId/:orderId/status', ...adminOnly, async (req, res) => {
  try {
    const { sessionId, orderId } = req.params;
    const { status, resultValue, resultUnit, referenceRange, labTechnicianId, notes } = req.body;

    const session = await IntakeSession.findById(sessionId).catch(() => null) ||
                    await IntakeSession.findOne({ tokenNumber: sessionId });

    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const labOrder = session.labOrders?.id?.(orderId) || session.labOrders?.[parseInt(orderId)];
    if (!labOrder) return res.status(404).json({ status: 'error', message: 'Lab order not found' });

    const validTransitions = {
      ordered: ['collected', 'cancelled'],
      collected: ['resulted', 'cancelled'],
      resulted: []
    };

    if (status && !validTransitions[labOrder.status]?.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot transition lab order from '${labOrder.status}' to '${status}'.`
      });
    }

    if (status) labOrder.status = status;
    if (notes) labOrder.notes = notes;

    // Attach lab result data when marking as 'resulted'
    if (status === 'resulted' && resultValue !== undefined) {
      labOrder.result = {
        value: resultValue,
        unit: resultUnit || '',
        referenceRange: referenceRange || '',
        resultedAt: new Date(),
        resultedBy: labTechnicianId || 'LAB-TECH-01'
      };
    }

    await session.save();

    res.json({
      status: 'success',
      message: `Lab order updated to '${labOrder.status}'.`,
      data: labOrder
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /api/admin/lab-orders/:sessionId/bulk-result
 * Bulk mark lab orders as resulted (lab technician batch workflow)
 */
router.post('/lab-orders/:sessionId/bulk-result', ...adminOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { results = [], labTechnicianId = 'LAB-TECH-01' } = req.body;
    // results: [{ testName, resultValue, resultUnit, referenceRange }]

    const session = await IntakeSession.findById(sessionId).catch(() => null) ||
                    await IntakeSession.findOne({ tokenNumber: sessionId });

    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });

    const updated = [];
    results.forEach(r => {
      const order = (session.labOrders || []).find(lo => lo.testName === r.testName && lo.status !== 'cancelled');
      if (!order) return;
      order.status = 'resulted';
      order.result = {
        value: r.resultValue,
        unit: r.resultUnit || '',
        referenceRange: r.referenceRange || '',
        resultedAt: new Date(),
        resultedBy: labTechnicianId
      };
      updated.push(order.testName);
    });

    await session.save();

    res.json({
      status: 'success',
      message: `${updated.length} lab order(s) marked as resulted.`,
      updatedTests: updated
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─── AUDIT LOG VIEWER ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/audit-log
 * View access log entries across today's sessions for compliance tracking
 */
router.get('/audit-log', ...adminOnly, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sessions = await IntakeSession.find({
      createdAt: { $gte: startOfToday },
      'accessLog.0': { $exists: true }
    }).select('tokenNumber patientName accessLog');

    const logs = [];
    sessions.forEach(s => {
      (s.accessLog || []).forEach(entry => {
        logs.push({
          tokenNumber: s.tokenNumber,
          patientName: s.patientName,
          ...entry.toObject?.() || entry
        });
      });
    });

    logs.sort((a, b) => new Date(b.at) - new Date(a.at));

    res.json({ status: 'success', count: logs.length, data: logs.slice(0, 100) });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
module.exports.departmentConfig = departmentConfig;
