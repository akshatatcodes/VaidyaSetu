const mongoose = require('mongoose');
const {
  LAB_SECTIONS,
  FACILITY_STATUSES
} = require('../constants/facility');
const {
  ContactSchema,
  WorkingHoursSchema,
  HolidaySchema,
  defaultWorkingHours
} = require('./shared/facilitySchemas');

/**
 * LABORATORY — MediKiosk §28, §29, §30, §54, §59
 *
 * A laboratory attached to a hospital, and the catalogue of tests it can
 * actually perform.
 *
 * Why the catalogue lives here rather than in code: §30 requires every result to
 * be recorded against its parameter, unit and **reference range**, and reference
 * ranges are lab-specific — they depend on the analyser and the assay, and they
 * legitimately differ between two labs measuring the same thing. A hard-coded
 * global range table would silently mis-flag results. So the range is a property
 * of *this lab's* test definition, and §5 applies: where a lab has not supplied a
 * range, the value is reported as "not compared" rather than assumed normal.
 *
 * Before this model existed a "laboratory" was the string
 * 'AIIA Central Diagnostic Laboratory' inside a demo login array.
 */

/**
 * A reference range for one parameter, optionally narrowed by sex and age.
 * Multiple entries per parameter are expected — e.g. haemoglobin differs by sex.
 */
const ReferenceRangeSchema = new mongoose.Schema({
  /** Free text exactly as the lab prints it, e.g. '13.0-17.0' or '< 200'. */
  range: { type: String, required: true, trim: true },
  /** Null = applies to any sex. */
  sex: { type: String, enum: ['Male', 'Female', 'Other', null], default: null },
  /** Null bounds = unbounded on that side. */
  ageMinYears: { type: Number, default: null, min: 0 },
  ageMaxYears: { type: Number, default: null, min: 0 },
  notes: { type: String, trim: true, default: '' }
}, { _id: false });

/** One reportable parameter within a test — a CBC has many. */
const TestParameterSchema = new mongoose.Schema({
  code: { type: String, trim: true, default: '' },
  name: { type: String, required: true, trim: true },
  unit: { type: String, trim: true, default: '' },
  /** Numeric results can be range-compared; qualitative ones cannot. */
  resultType: {
    type: String,
    enum: ['numeric', 'qualitative', 'text', 'image'],
    default: 'numeric'
  },
  referenceRanges: { type: [ReferenceRangeSchema], default: [] },
  /** Values beyond these bounds are a critical result requiring escalation (§29). */
  criticalLow: { type: Number, default: null },
  criticalHigh: { type: Number, default: null },
  displayOrder: { type: Number, default: 100 }
}, { _id: false });

/** A test this laboratory offers. */
const TestDefinitionSchema = new mongoose.Schema({
  testCode: { type: String, required: true, trim: true, uppercase: true },
  testName: { type: String, required: true, trim: true },
  /** Common shorthand a doctor might search by, e.g. 'CBC', 'Haemogram'. */
  aliases: { type: [String], default: [] },
  section: { type: String, enum: LAB_SECTIONS, default: 'Pathology' },
  sampleType: {
    type: String,
    enum: ['blood', 'serum', 'plasma', 'urine', 'stool', 'sputum', 'swab', 'tissue', 'imaging', 'other'],
    default: 'blood'
  },
  /** Preparation the patient must do, e.g. '12 hours fasting'. Shown at ordering. */
  patientPreparation: { type: String, trim: true, default: '' },
  /** Turnaround time in hours — feeds the §34 follow-up window calculation. */
  turnaroundHours: { type: Number, default: 24, min: 0 },
  parameters: { type: [TestParameterSchema], default: [] },
  isActive: { type: Boolean, default: true }
}, { _id: false });

/** An operational section of the lab (§28). */
const LabSectionSchema = new mongoose.Schema({
  code: { type: String, enum: LAB_SECTIONS, required: true },
  name: { type: String, trim: true, default: '' },
  roomNumber: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const LaboratorySchema = new mongoose.Schema({
  labId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  shortName: { type: String, trim: true, default: '' },

  sections: { type: [LabSectionSchema], default: [] },
  testCatalog: { type: [TestDefinitionSchema], default: [] },

  location: {
    building: { type: String, trim: true, default: '' },
    floor: { type: String, trim: true, default: '' },
    roomNumber: { type: String, trim: true, default: '' },
    /** Free-text wayfinding for the token slip, e.g. 'Ground floor, past OPD 3'. */
    directions: { type: String, trim: true, default: '' }
  },

  contact: { type: ContactSchema, default: () => ({}) },
  workingHours: { type: [WorkingHoursSchema], default: defaultWorkingHours },
  holidays: { type: [HolidaySchema], default: [] },

  /** Sample collection may close before the lab itself does. */
  sampleCollectionHours: { type: [WorkingHoursSchema], default: [] },

  /**
   * §30 — a verified result is never silently overwritten. A correction creates
   * an amendment that preserves the original. Stored as an explicit invariant so
   * the rule is visible where the lab is configured; it is not switchable off.
   */
  resultPolicy: {
    requiresVerification: { type: Boolean, default: true },
    /** Who may move a result from 'resulted' to 'verified' (§29). */
    verifierRole: {
      type: String,
      enum: ['lab_supervisor', 'pathologist', 'any_lab_staff'],
      default: 'lab_supervisor'
    },
    /** §30 — originals are retained; corrections are amendments, not edits. */
    preserveOriginalOnAmendment: { type: Boolean, default: true, immutable: true },
    /** Critical results are escalated to the ordering doctor immediately (§29). */
    escalateCriticalImmediately: { type: Boolean, default: true }
  },

  status: { type: String, enum: FACILITY_STATUSES, default: 'active', index: true }
}, { timestamps: true });

LaboratorySchema.index({ hospital: 1, status: 1 });
LaboratorySchema.index({ 'testCatalog.testCode': 1 });

/**
 * Find a test definition by code or by any of its aliases, case-insensitively.
 * Returns null when this lab does not offer it — the caller must not fall back
 * to a guessed definition (§5).
 */
LaboratorySchema.methods.findTest = function (query) {
  if (!query) return null;
  const needle = String(query).trim().toLowerCase();
  return (this.testCatalog || []).find((t) => {
    if (!t.isActive) return false;
    if (t.testCode?.toLowerCase() === needle) return true;
    if (t.testName?.toLowerCase() === needle) return true;
    return (t.aliases || []).some((a) => a.toLowerCase() === needle);
  }) || null;
};

/**
 * The reference range this lab applies to one parameter for one patient.
 * Returns null when no range is configured — the caller must then report the
 * result as "not compared", never as normal (§5).
 *
 * @param {object} parameter - a TestParameter subdocument
 * @param {{sex?: string, ageYears?: number}} patient
 */
LaboratorySchema.methods.resolveReferenceRange = function (parameter, patient = {}) {
  const ranges = parameter?.referenceRanges || [];
  if (ranges.length === 0) return null;

  const matches = ranges.filter((r) => {
    if (r.sex && patient.sex && r.sex !== patient.sex) return false;
    if (r.ageMinYears !== null && r.ageMinYears !== undefined &&
        patient.ageYears !== undefined && patient.ageYears < r.ageMinYears) return false;
    if (r.ageMaxYears !== null && r.ageMaxYears !== undefined &&
        patient.ageYears !== undefined && patient.ageYears > r.ageMaxYears) return false;
    return true;
  });

  // Prefer the most specific match (one that actually names a sex or an age
  // band) over a catch-all row.
  const specific = matches.find((r) => r.sex || r.ageMinYears !== null || r.ageMaxYears !== null);
  return specific || matches[0] || null;
};

module.exports = mongoose.model('Laboratory', LaboratorySchema);
