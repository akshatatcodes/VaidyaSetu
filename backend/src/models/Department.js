const mongoose = require('mongoose');
const {
  SYSTEMS_OF_MEDICINE,
  CLINICAL_MODES,
  FACILITY_STATUSES
} = require('../constants/facility');
const {
  WorkingHoursSchema,
  HolidaySchema,
  defaultWorkingHours
} = require('./shared/facilitySchemas');

/**
 * DEPARTMENT — MediKiosk §53, §54, §59
 *
 * A department inside one hospital, carrying everything §54 says belongs to it:
 *
 *   Department
 *    ├── Doctors        (separate collection, refs this record)
 *    ├── Rooms          (embedded — rooms have no life outside their department)
 *    ├── Working hours
 *    └── Queue policy
 *
 * This record replaces five disagreeing hard-coded department lists:
 *   - the `department` string enum on IntakeSession
 *   - `departmentConfig` in adminRoutes (an in-memory object, lost on restart)
 *   - AYURVEDA_DEPARTMENTS in dashavidhaService
 *   - DEPARTMENTS in KioskIntake.jsx
 *   - DEPT_LABELS in AdminDashboard.jsx
 *
 * `clinicalMode` is what makes §12 / §13 work: it selects whether intake runs the
 * modern history framework or the AYUSH one. §13 also requires the exact question
 * set to be configurable per hospital rather than universal — that detail lives
 * in `intakeConfig`, not in code.
 */

/**
 * A consultation or procedure room (§54). Embedded because a room is meaningless
 * outside its department, and §19/§20 only ever need to print its number.
 */
const RoomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, trim: true },
  name: { type: String, trim: true, default: '' },
  floor: { type: String, trim: true, default: '' },
  building: { type: String, trim: true, default: '' },
  purpose: {
    type: String,
    enum: ['consultation', 'procedure', 'examination', 'counselling', 'sample_collection', 'other'],
    default: 'consultation'
  },
  isActive: { type: Boolean, default: true }
}, { _id: false });

/**
 * Per-department queue policy (§18). Any field left null inherits the hospital's
 * `queueDefaults` — null means "not configured here", never "zero".
 */
const QueuePolicySchema = new mongoose.Schema({
  averageConsultationMinutes: { type: Number, default: null, min: 1, max: 180 },
  /** §18 — ETA is always shown as a range; this is the ± spread. */
  etaSpreadPercent: { type: Number, default: null, min: 0, max: 100 },
  emergencyReservedSlots: { type: Number, default: null, min: 0 },
  followUpWindowMinutes: { type: Number, default: null, min: 5, max: 240 },
  followUpWindowCapacity: { type: Number, default: null, min: 1 },
  allowWalkIn: { type: Boolean, default: null },
  /** Tokens this department will issue in a single OPD day. Null = uncapped. */
  dailyTokenCapacity: { type: Number, default: null, min: 1 },
  /** Token prefix, e.g. 'OR' for Orthopaedics → OR-127 (§20). */
  tokenPrefix: { type: String, trim: true, uppercase: true, default: '' }
}, { _id: false });

/**
 * Which intake sections this department runs (§13 — configurable per hospital
 * and clinical protocol, not hard-coded universally).
 *
 * This is the persistent replacement for `adminRoutes.departmentConfig`, which
 * was an in-memory object: its edits vanished on restart and were never shared
 * between server instances.
 */
const IntakeConfigSchema = new mongoose.Schema({
  /** §13 — the ten-fold examination. Only meaningful in AYUSH mode. */
  dashavidhaEnabled: { type: Boolean, default: false },
  /** §13 — Ahara / Vihara / Agni / Koshtha probing. AYUSH mode only. */
  ayurvedaProbeEnabled: { type: Boolean, default: false },
  /** §12 — Review of Systems sweep. Modern mode. */
  reviewOfSystemsEnabled: { type: Boolean, default: true },
  /** §10 — offer the body map as a symptom-capture method. */
  bodyMapEnabled: { type: Boolean, default: true },
  /** §10, §44 — offer voice capture. */
  voiceIntakeEnabled: { type: Boolean, default: true },
  /** §14 — pull vitals from kiosk peripherals for this department. */
  vitalsCaptureEnabled: { type: Boolean, default: true },
  /**
   * Extra question sets this hospital has enabled for the department, by
   * identifier. Kept open-ended so a facility can add its own protocol without
   * a schema migration — §13.
   */
  additionalQuestionSets: { type: [String], default: [] }
}, { _id: false });

const DepartmentSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  /**
   * Stable slug, unique within the hospital. Used in URLs, queue boards and
   * token prefixes. Legacy records use the department's English name as its
   * code so existing IntakeSession strings still resolve.
   */
  code: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  /** Name in the local script, e.g. 'कायचिकित्सा'. Shown alongside `name` (§45). */
  localName: { type: String, trim: true, default: '' },
  /** One line the patient can understand, e.g. 'Internal Medicine & General Care'. */
  description: { type: String, trim: true, default: '' },

  systemOfMedicine: {
    type: String,
    enum: SYSTEMS_OF_MEDICINE,
    default: 'Allopathy'
  },
  /** §12 vs §13 — which history framework this department's intake runs. */
  clinicalMode: {
    type: String,
    enum: CLINICAL_MODES,
    default: 'modern',
    index: true
  },

  rooms: { type: [RoomSchema], default: [] },
  workingHours: { type: [WorkingHoursSchema], default: defaultWorkingHours },
  holidays: { type: [HolidaySchema], default: [] },
  queuePolicy: { type: QueuePolicySchema, default: () => ({}) },
  intakeConfig: { type: IntakeConfigSchema, default: () => ({}) },

  /** §17 — hints the routing engine uses to suggest this department. */
  routingKeywords: { type: [String], default: [] },

  /** Appointment slots bookable per day. Null = walk-in only. */
  appointmentCapacityPerDay: { type: Number, default: null, min: 0 },

  /** Ordering on the patient-facing department picker. Lower shows first. */
  displayOrder: { type: Number, default: 100 },

  status: { type: String, enum: FACILITY_STATUSES, default: 'active', index: true }
}, { timestamps: true });

/** A department code identifies exactly one department within a hospital. */
DepartmentSchema.index({ hospital: 1, code: 1 }, { unique: true });
DepartmentSchema.index({ hospital: 1, status: 1, displayOrder: 1 });

/**
 * Resolve the effective queue policy by layering the department's overrides on
 * the hospital's defaults. `null` on the department means "not configured" and
 * falls through; it never means zero.
 *
 * @param {object} hospitalDefaults - `Hospital.queueDefaults`
 */
DepartmentSchema.methods.effectiveQueuePolicy = function (hospitalDefaults = {}) {
  const policy = this.queuePolicy || {};
  const pick = (key, fallback) => (
    policy[key] === null || policy[key] === undefined
      ? (hospitalDefaults[key] !== undefined ? hospitalDefaults[key] : fallback)
      : policy[key]
  );

  return {
    averageConsultationMinutes: pick('averageConsultationMinutes', 12),
    etaSpreadPercent: pick('etaSpreadPercent', 30),
    emergencyReservedSlots: pick('emergencyReservedSlots', 2),
    followUpWindowMinutes: pick('followUpWindowMinutes', 30),
    followUpWindowCapacity: pick('followUpWindowCapacity', 4),
    allowWalkIn: pick('allowWalkIn', true),
    dailyTokenCapacity: policy.dailyTokenCapacity ?? null,
    tokenPrefix: policy.tokenPrefix || this.code.slice(0, 3).toUpperCase()
  };
};

/** Active consultation rooms, in the order they were configured. */
DepartmentSchema.methods.activeRooms = function () {
  return (this.rooms || []).filter((r) => r.isActive);
};

module.exports = mongoose.model('Department', DepartmentSchema);
