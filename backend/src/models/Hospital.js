const mongoose = require('mongoose');
const {
  SYSTEMS_OF_MEDICINE,
  FACILITY_STATUSES,
  SUPPORTED_LANGUAGES
} = require('../constants/facility');
const {
  AddressSchema,
  GeoPointSchema,
  ContactSchema,
  WorkingHoursSchema,
  HolidaySchema,
  defaultWorkingHours
} = require('./shared/facilitySchemas');

/**
 * HOSPITAL — MediKiosk §53, §54, §59
 *
 * The root of the facility configuration tree:
 *
 *   Hospital
 *    ├── Departments  (→ Doctors, Rooms, Working hours, Queue policy)
 *    ├── Laboratories
 *    ├── Kiosks
 *    └── Services
 *
 * §54 is the governing rule: **do not hard-code hospital structure.** Nothing in
 * the platform may assume "every hospital has three doctors" or that every
 * facility practises the same system of medicine, opens the same hours, or runs
 * its queue the same way. Everything that varies between institutions lives on
 * this record or on its children.
 *
 * Before this model existed, the hospital was the literal string
 * 'All India Institute of Ayurveda (AIIA)' and the HIP id 'IN-DL-AIIA-001'
 * scattered across eleven files. Those become one seeded row.
 */

/** A service line the hospital offers (§54 "Services"). */
const ServiceSchema = new mongoose.Schema({
  code: { type: String, trim: true, required: true },
  name: { type: String, trim: true, required: true },
  description: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true }
}, { _id: false });

/**
 * ABDM linkage (§63) — deliberately a self-contained block so the integration
 * layer stays isolated and a change in the external ecosystem does not ripple
 * through the core.
 *
 * §55: `enabled` describes whether this facility is *registered* with ABDM. It
 * does not imply the ecosystem is reachable right now. Callers must still handle
 * being offline rather than assuming ABDM works without connectivity.
 */
const AbdmConfigSchema = new mongoose.Schema({
  /** Health Information Provider id issued by ABDM. */
  hipId: { type: String, trim: true, default: '' },
  /** Health Facility Registry id. */
  hfrId: { type: String, trim: true, default: '' },
  /** Facility name exactly as registered with ABDM — may differ from `name`. */
  registeredName: { type: String, trim: true, default: '' },
  enabled: { type: Boolean, default: false },
  /**
   * Prefix for generated care-context identifiers, e.g. 'AIIA-OPD' produces
   * 'AIIA-OPD-<token>'. Previously hard-coded in kioskRoutes.
   */
  careContextPrefix: { type: String, trim: true, default: '' },
  /**
   * Base URI this facility uses as the `system` when it mints identifiers in a
   * FHIR bundle, e.g. 'https://aiia.gov.in'. Token and encounter systems are
   * derived from it.
   */
  identifierSystemUri: { type: String, trim: true, default: '' },
  /**
   * 'simulated' until a real ABDM gateway is wired up. Kept explicit so nothing
   * downstream can mistake a simulated sync for a real one.
   */
  mode: { type: String, enum: ['simulated', 'sandbox', 'production'], default: 'simulated' }
}, { _id: false });

/**
 * Hospital-wide queue defaults (§18). A department may override any of these;
 * these are the fallback so a newly created department is never left without a
 * policy.
 */
const QueueDefaultsSchema = new mongoose.Schema({
  /** Starting estimate for one consultation, before live speed is known. */
  averageConsultationMinutes: { type: Number, default: 12, min: 1, max: 180 },
  /**
   * §18 — the patient is shown a RANGE ("15–25 minutes"), never false precision.
   * This is the ± spread applied to the point estimate, as a percentage.
   */
  etaSpreadPercent: { type: Number, default: 30, min: 0, max: 100 },
  /** Consultation slots held back for emergency/triaged patients (§15). */
  emergencyReservedSlots: { type: Number, default: 2, min: 0 },
  /** Length of a follow-up time window in minutes (§34). */
  followUpWindowMinutes: { type: Number, default: 30, min: 5, max: 240 },
  /** How many follow-up patients may be placed in one window (§34). */
  followUpWindowCapacity: { type: Number, default: 4, min: 1 },
  allowWalkIn: { type: Boolean, default: true }
}, { _id: false });

const HospitalSchema = new mongoose.Schema({
  /**
   * Stable human-readable identifier used in tokens, QR payloads and referrals.
   * Conventionally 'IN-<STATE>-<FACILITY>-<NNN>'.
   */
  hospitalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  /** Short form for token slips and kiosk headers where space is tight. */
  shortName: { type: String, trim: true, default: '' },
  type: {
    type: String,
    enum: ['government', 'private', 'trust', 'teaching', 'other'],
    default: 'government'
  },
  /**
   * Which systems of medicine this facility practises. Drives which clinical
   * intake modes its departments may use (§12 modern, §13 AYUSH).
   */
  systemsOfMedicine: {
    type: [{ type: String, enum: SYSTEMS_OF_MEDICINE }],
    default: ['Allopathy']
  },
  address: { type: AddressSchema, default: () => ({}) },
  /** Optional — only set when the facility's location is actually known (§5). */
  location: { type: GeoPointSchema, default: undefined },
  contact: { type: ContactSchema, default: () => ({}) },

  /** Languages this facility's kiosks and portals offer (§44, §45). */
  supportedLanguages: {
    type: [{ type: String, enum: SUPPORTED_LANGUAGES }],
    default: ['en', 'hi']
  },

  services: { type: [ServiceSchema], default: [] },
  workingHours: { type: [WorkingHoursSchema], default: defaultWorkingHours },
  holidays: { type: [HolidaySchema], default: [] },
  queueDefaults: { type: QueueDefaultsSchema, default: () => ({}) },
  abdm: { type: AbdmConfigSchema, default: () => ({}) },

  /**
   * Emergency handling policy (§15, §16). Note `neverBlockEmergencyAccess` is
   * intentionally not configurable to `false`: §16 states a patient must never
   * lose emergency evaluation because of an automated misuse score. It is stored
   * as an explicit invariant so the rule is visible where the policy lives.
   */
  emergencyPolicy: {
    hasEmergencyDepartment: { type: Boolean, default: true },
    triageContactNumber: { type: String, trim: true, default: '' },
    /** §16 — automated misuse scoring may warn and escalate to a human, never lock out. */
    neverBlockEmergencyAccess: { type: Boolean, default: true, immutable: true }
  },

  status: { type: String, enum: FACILITY_STATUSES, default: 'active', index: true },
  notes: { type: String, trim: true, default: '' }
}, { timestamps: true });

/** §9 — "nearby hospitals" for a patient registering from home. */
HospitalSchema.index({ location: '2dsphere' });
HospitalSchema.index({ status: 1, 'address.state': 1, 'address.district': 1 });

/** Name shown on token slips and kiosk chrome. */
HospitalSchema.virtual('displayName').get(function () {
  return this.shortName || this.name;
});

HospitalSchema.set('toObject', { virtuals: true });
HospitalSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Hospital', HospitalSchema);
