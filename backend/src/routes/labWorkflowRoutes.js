/**
 * Phase 10: Lab Workflow Routes (critical-result pipeline)
 * - Role-guarded: requireAuth + requireRole('lab','admin')
 * - Operates on IntakeSession.labOrders (order → collected → resulted → verified)
 * - Critical results (stat/urgent or flagged) can be pushed to the record
 *
 * State machine:
 *   ordered → collected → resulted → verified
 *   any     → cancelled (terminal)
 */
const express = require('express');
const router = express.Router();
const IntakeSession = require('../models/IntakeSession');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const labGuard = [requireAuth, requireRole('lab', 'admin')];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a session by Mongo _id OR by tokenNumber (QR token). */
async function findSession(identifier) {
  if (!identifier) return null;
  return (await IntakeSession.findById(identifier).catch(() => null)) ||
         (await IntakeSession.findOne({ tokenNumber: identifier })) ||
         (await IntakeSession.findOne({ qrPayload: identifier }));
}

/** Mark a critical value against a referenceRange if present. */
function flagCritical(order) {
  if (order.critical !== undefined) return;
  order.critical = order.urgency === 'stat';
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

/**
 * GET /api/lab/pending
 * All lab orders that need attention (ordered/collected), sorted stat → urgent → routine.
 */
router.get('/pending', ...labGuard, async (req, res) => {
  try {
    const { status, urgency } = req.query;
    const sessions = await IntakeSession.find({ 'labOrders.0': { $exists: true } })
      .select('tokenNumber patientName age gender department labOrders createdAt');

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
          orderId: lo._id?.toString() || idx,
          orderIndex: idx,
          testName: lo.testName,
          urgency: lo.urgency,
          status: lo.status,
          critical: !!lo.critical,
          orderedBy: lo.orderedBy,
          orderedAt: lo.orderedAt,
          notes: lo.notes,
          result: lo.result || null
        });
      });
    });

    const urgencyOrder = { stat: 0, urgent: 1, routine: 2 };
    flatOrders.sort((a, b) => (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2) || new Date(a.orderedAt) - new Date(b.orderedAt));

    res.json({ status: 'success', count: flatOrders.length, data: flatOrders });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * PATCH /api/lab/orders/:sessionId/:orderId/status
 * Transition an order through the state machine and attach result values on 'resulted'.
 */
router.patch('/orders/:sessionId/:orderId/status', ...labGuard, async (req, res) => {
  try {
    const { sessionId, orderId } = req.params;
    const { status, resultValue, resultUnit, referenceRange, critical, notes, labTechnicianId } = req.body;

    const session = await findSession(sessionId);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session/order not found' });

    const labOrder = session.labOrders?.id?.(orderId) || session.labOrders?.[parseInt(orderId)];
    if (!labOrder) return res.status(404).json({ status: 'error', message: 'Lab order not found' });

    const validTransitions = {
      ordered: ['collected', 'cancelled'],
      collected: ['resulted', 'cancelled'],
      resulted: ['verified', 'cancelled'],
      verified: [],
      cancelled: []
    };

    if (status && !validTransitions[labOrder.status]?.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot transition lab order from '${labOrder.status}' to '${status}'.`
      });
    }

    if (status) labOrder.status = status;
    if (notes !== undefined) labOrder.notes = notes;

    if (status === 'resulted' && resultValue !== undefined) {
      labOrder.result = {
        value: resultValue,
        unit: resultUnit || '',
        referenceRange: referenceRange || '',
        resultedAt: new Date(),
        resultedBy: labTechnicianId || req.user?.id || 'LAB-TECH-01'
      };
      if (critical !== undefined) labOrder.critical = Boolean(critical);
      else flagCritical(labOrder);
    }

    // Verified = result signed off by a lab supervisor, now visible in the record.
    if (status === 'verified') {
      labOrder.verified = true;
      labOrder.verifiedAt = new Date();
      labOrder.verifiedBy = labTechnicianId || req.user?.id || 'LAB-SUPERVISOR';
      session.accessLog?.push?.({
        actorId: req.user?.id || labTechnicianId,
        actorRole: 'lab',
        action: 'verified_lab_result',
        field: labOrder.testName,
        at: new Date()
      });
    }
    // Log collection for traceability
    if (status === 'collected') {
      session.accessLog?.push?.({
        actorId: req.user?.id || labTechnicianId,
        actorRole: 'lab',
        action: 'collected_sample',
        field: labOrder.testName,
        at: new Date()
      });
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
 * POST /api/lab/orders/:sessionId/bulk-result
 * Batch-result multiple tests for one session, flagging criticals.
 */
router.post('/orders/:sessionId/bulk-result', ...labGuard, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { results = [], labTechnicianId } = req.body; // [{ testName, resultValue, resultUnit, referenceRange, critical? }]

    const session = await findSession(sessionId);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session/order not found' });

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
        resultedBy: labTechnicianId || req.user?.id || 'LAB-TECH-01'
      };
      if (r.critical !== undefined) order.critical = Boolean(r.critical);
      else flagCritical(order);
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

/**
 * GET /api/lab/critical
 * All critical results awaiting clinician attention — the "critical result" surfacing path.
 */
router.get('/critical', ...labGuard, async (req, res) => {
  try {
    const sessions = await IntakeSession.find({ 'labOrders.critical': true })
      .select('tokenNumber patientName age gender department labOrders createdAt');

    const criticals = [];
    sessions.forEach(s => {
      (s.labOrders || []).forEach(lo => {
        if (!lo.critical) return;
        criticals.push({
          sessionId: s._id.toString(),
          tokenNumber: s.tokenNumber,
          patientName: s.patientName,
          age: s.age,
          gender: s.gender,
          department: s.department,
          orderId: lo._id?.toString(),
          testName: lo.testName,
          urgency: lo.urgency,
          status: lo.status,
          verified: !!lo.verified,
          result: lo.result || null,
          orderedAt: lo.orderedAt
        });
      });
    });

    criticals.sort((a, b) => (a.status === 'verified' ? 1 : 0) - (b.status === 'verified' ? 1 : 0) || new Date(a.orderedAt) - new Date(b.orderedAt));

    res.json({ status: 'success', count: criticals.length, data: criticals });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
