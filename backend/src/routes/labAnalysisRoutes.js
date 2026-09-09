const express = require('express');
const router = express.Router();
const LabResult = require('../models/LabResult');

/**
 * LAB RESULT FLAGGING — /api/lab-results/analyze
 *
 * NOTE (MediKiosk refactor):
 * This endpoint used to send lab values to an LLM and ask it to produce dietary
 * recommendations, lifestyle changes, severity scores, "immediate actions" and
 * per-test precautions. That was the wellness/risk-coaching product, and it broke
 * two rules of the MediKiosk architecture:
 *
 *   §15 — the system must not autonomously diagnose, score, or issue open-ended
 *         clinical direction. An out-of-range value is a TRIAGE TRIGGER for a
 *         clinician, not a cue for the platform to prescribe.
 *   §43 — the clinical knowledge/ontology layer decides what may be asserted.
 *         The LLM handles language, not clinical judgement.
 *
 * What remains is deterministic and defensible: each result is compared against
 * its own printed reference range and flagged normal / abnormal / unknown. There
 * is no interpretation, no scoring and no advice. Values whose range cannot be
 * parsed are reported as `unknown` — never silently assumed normal (§5: unknown
 * is "Not reported", never "No").
 *
 * Phase 8 replaces this with the full InvestigationOrder → LabSample → LabResult
 * model, where flagging is driven by the knowledge layer and every value carries
 * a §66 confidence state.
 */

/**
 * Compare a numeric result against a printed reference range.
 * Returns { inRange: true|false|null, direction: 'above'|'below'|null }
 * `null` inRange means the range could not be parsed — explicitly unknown.
 */
function evaluateRange(value, referenceRange) {
  const unknown = { inRange: null, direction: null };
  if (!referenceRange || typeof value !== 'number' || Number.isNaN(value)) return unknown;

  const between = referenceRange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (between) {
    const min = parseFloat(between[1]);
    const max = parseFloat(between[2]);
    if (Number.isNaN(min) || Number.isNaN(max)) return unknown;
    if (value < min) return { inRange: false, direction: 'below' };
    if (value > max) return { inRange: false, direction: 'above' };
    return { inRange: true, direction: null };
  }

  const lt = referenceRange.match(/<\s*=?\s*([\d.]+)/);
  if (lt) {
    const max = parseFloat(lt[1]);
    if (Number.isNaN(max)) return unknown;
    return value <= max
      ? { inRange: true, direction: null }
      : { inRange: false, direction: 'above' };
  }

  const gt = referenceRange.match(/>\s*=?\s*([\d.]+)/);
  if (gt) {
    const min = parseFloat(gt[1]);
    if (Number.isNaN(min)) return unknown;
    return value >= min
      ? { inRange: true, direction: null }
      : { inRange: false, direction: 'below' };
  }

  return unknown;
}

/**
 * POST /api/lab-results/analyze
 * Body: { clerkId, labIds?: string[] }
 *
 * Flags each result against its reference range. No interpretation, no advice.
 */
router.post('/analyze', async (req, res) => {
  try {
    const { clerkId, labIds } = req.body;

    if (!clerkId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID required'
      });
    }

    const query = { clerkId };
    if (Array.isArray(labIds) && labIds.length > 0) {
      query._id = { $in: labIds };
    }

    const labResults = await LabResult.find(query)
      .sort({ sampleDate: -1 })
      .limit(Array.isArray(labIds) && labIds.length > 0 ? 0 : 20);

    if (labResults.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No lab results found'
      });
    }

    const evaluated = labResults.map((lab) => {
      const { inRange, direction } = evaluateRange(lab.resultValue, lab.referenceRange);
      return {
        id: String(lab._id),
        testName: lab.testName,
        resultValue: lab.resultValue,
        unit: lab.unit || '',
        referenceRange: lab.referenceRange || null,
        sampleDate: lab.sampleDate,
        inRange,
        direction,
        // 'unknown' is a first-class state (§5) — we do not guess.
        status: inRange === true ? 'normal' : inRange === false ? 'abnormal' : 'unknown'
      };
    });

    const abnormal = evaluated.filter(l => l.status === 'abnormal');
    const normal = evaluated.filter(l => l.status === 'normal');
    const unknown = evaluated.filter(l => l.status === 'unknown');

    // Factual, non-interpretive summary. States counts only.
    const parts = [`${evaluated.length} result${evaluated.length === 1 ? '' : 's'} reviewed.`];
    parts.push(
      abnormal.length === 0
        ? 'None fall outside their reference range.'
        : `${abnormal.length} fall outside their reference range and need a doctor's review.`
    );
    if (unknown.length > 0) {
      parts.push(`${unknown.length} could not be compared because no reference range was recorded.`);
    }

    res.json({
      status: 'success',
      data: {
        totalTests: evaluated.length,
        abnormalCount: abnormal.length,
        normalCount: normal.length,
        unknownCount: unknown.length,
        labResults: evaluated,
        flagged: abnormal.map(l => ({
          testName: l.testName,
          value: `${l.resultValue}${l.unit ? ' ' + l.unit : ''}`,
          referenceRange: l.referenceRange,
          direction: l.direction,
          sampleDate: l.sampleDate
        })),
        summary: parts.join(' '),
        // Fixed text, not model output. Same wording every time, by design.
        guidance: 'Show this report to your doctor. Do not start, stop or change any medicine on your own based on these results.'
      }
    });

  } catch (error) {
    console.error('[Lab Flagging] Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Could not read lab results: ' + error.message
    });
  }
});

module.exports = router;
