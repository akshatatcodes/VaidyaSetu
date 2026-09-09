const mongoose = require('mongoose');
const {
  KIOSK_PERIPHERALS,
  SUPPORTED_LANGUAGES,
  FACILITY_STATUSES
} = require('../constants/facility');
const {
  WorkingHoursSchema,
  defaultWorkingHours
} = require('./shared/facilitySchemas');

/**
 * KIOSK — MediKiosk §14, §45, §52, §54, §55, §57, §59
 *
 * A physical self-service terminal inside a hospital.
 *
 * This entity did not exist before: the codebase had no kiosk identifier at all.
 * That was a real gap, not just missing configuration — §50 requires an audit
 * trail recording *who* did *what*, and an intake produced at a shared public
 * terminal could not say which terminal produced it. Every kiosk-originated
 * session and audit entry should now carry a `kioskId`.
 *
 * Three rules shape this record:
 *
 *   §52 — a shared public device must not retain the previous patient's data.
 *         `sessionPolicy` makes the reset behaviour explicit and configurable
 *         only in the safe direction.
 *   §51 — device authentication. A kiosk holds a registration secret, stored
 *         `select: false` so it is never returned by an ordinary query.
 *   §55 — local operational continuity is not the same as the ABDM ecosystem
 *         being available. `offline` describes what this terminal may cache to
 *         keep working; it deliberately cannot cache health-record exchange.
 */

/** A peripheral attached to this terminal (§14). */
const PeripheralSchema = new mongoose.Schema({
  kind: { type: String, enum: KIOSK_PERIPHERALS, required: true },
  make: { type: String, trim: true, default: '' },
  model: { type: String, trim: true, default: '' },
  /** Serial or port identifier, for the maintenance log. */
  identifier: { type: String, trim: true, default: '' },
  isConnected: { type: Boolean, default: true },
  lastCheckedAt: { type: Date, default: null },
  /**
   * §14 — automatic capture is safer than a human retyping a reading. When a
   * device supports it, readings land straight on the encounter.
   */
  autoCapture: { type: Boolean, default: true }
}, { _id: false });

/**
 * §52 — session hygiene on a shared public device.
 *
 * `resetOnSubmit` and `clearTemporaryCacheOnReset` are immutable and true: the
 * spec does not offer these as options. Only the timing is configurable.
 */
const SessionPolicySchema = new mongoose.Schema({
  /** Idle time before an abandoned session is wiped and the kiosk returns home. */
  idleTimeoutSeconds: { type: Number, default: 120, min: 30, max: 900 },
  /** Warning shown before the idle timeout fires, so nobody loses work silently. */
  idleWarningSeconds: { type: Number, default: 30, min: 10, max: 300 },
  /** §52 — Patient A submits → sync → session reset → Patient B starts clean. */
  resetOnSubmit: { type: Boolean, default: true, immutable: true },
  /** §52 — temporary cache (images, transcripts, drafts) cleared on every reset. */
  clearTemporaryCacheOnReset: { type: Boolean, default: true, immutable: true },
  /** Maximum life of one intake session regardless of activity. */
  maxSessionMinutes: { type: Number, default: 45, min: 5, max: 180 }
}, { _id: false });

/**
 * §55 — what this terminal may keep working with when the network is poor.
 *
 * Note what is *absent*: there is no option to cache ABDM record exchange or
 * consent artefacts. Local operational continuity and external health-information
 * synchronisation are different things and the spec is explicit that we must not
 * pretend the ABDM ecosystem works offline.
 */
const OfflinePolicySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  /** UI shell, icons and workflow definitions. */
  cacheInterface: { type: Boolean, default: true },
  /** Language packs and audio prompts, so §45 low-literacy mode still works. */
  cacheLanguagePacks: { type: Boolean, default: true },
  /** Queue state, so the board keeps showing something sensible. */
  cacheQueueState: { type: Boolean, default: true },
  /**
   * Completed intakes held locally until connectivity returns. Encrypted at rest
   * (§51) and flushed on successful sync.
   */
  queueSubmissionsWhileOffline: { type: Boolean, default: true },
  maxQueuedSubmissions: { type: Number, default: 25, min: 0 },
  lastSyncAt: { type: Date, default: null },
  pendingSubmissionCount: { type: Number, default: 0, min: 0 }
}, { _id: false });

/** §45, §57 — how this terminal presents itself by default. */
const AccessibilityDefaultsSchema = new mongoose.Schema({
  /** §45 — icon-driven, audio-led operation. Should be on for public terminals. */
  lowLiteracyMode: { type: Boolean, default: true },
  largeText: { type: Boolean, default: true },
  highContrast: { type: Boolean, default: false },
  /** §45 — every screen can be read aloud. */
  audioPromptsEnabled: { type: Boolean, default: true },
  /** §57 — a physical or on-screen call for staff help. */
  attendantCallEnabled: { type: Boolean, default: true },
  /** §58 — the terminal asks whether a caregiver is answering on the patient's behalf. */
  caregiverModePrompt: { type: Boolean, default: true }
}, { _id: false });

const KioskSchema = new mongoose.Schema({
  kioskId: {
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
  /**
   * Optional. A kiosk parked outside one department pre-selects it (§9 — when
   * the patient is physically at the hospital, the kiosk supplies the context).
   * Null = a general-purpose terminal that asks.
   */
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
    index: true
  },

  label: { type: String, required: true, trim: true },
  location: {
    building: { type: String, trim: true, default: '' },
    floor: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' }
  },

  /**
   * §51 device authentication. Hashed, never the raw secret, and `select: false`
   * so it cannot leak through a forgotten projection.
   */
  deviceSecretHash: { type: String, default: '', select: false },
  deviceFingerprint: { type: String, trim: true, default: '', select: false },
  registeredAt: { type: Date, default: null },
  registeredBy: { type: String, trim: true, default: '' },

  peripherals: { type: [PeripheralSchema], default: [] },

  /** Languages offered on this terminal. Subset of the hospital's list (§44). */
  languages: {
    type: [{ type: String, enum: SUPPORTED_LANGUAGES }],
    default: ['en', 'hi']
  },
  defaultLanguage: { type: String, enum: SUPPORTED_LANGUAGES, default: 'hi' },

  sessionPolicy: { type: SessionPolicySchema, default: () => ({}) },
  offline: { type: OfflinePolicySchema, default: () => ({}) },
  accessibility: { type: AccessibilityDefaultsSchema, default: () => ({}) },

  /** What this terminal is allowed to do. A check-in post is not a full intake. */
  capabilities: {
    opdRegistration: { type: Boolean, default: true },
    clinicalIntake: { type: Boolean, default: true },
    documentUpload: { type: Boolean, default: true },
    vitalsCapture: { type: Boolean, default: true },
    tokenPrinting: { type: Boolean, default: true },
    queueDisplay: { type: Boolean, default: false },
    /** §27 — scanning a lab order QR at the lab counter. */
    labOrderScan: { type: Boolean, default: false }
  },

  operatingHours: { type: [WorkingHoursSchema], default: defaultWorkingHours },

  /** Health monitoring — a dead kiosk should be visible to the admin (§53). */
  lastHeartbeatAt: { type: Date, default: null },
  softwareVersion: { type: String, trim: true, default: '' },

  status: { type: String, enum: FACILITY_STATUSES, default: 'active', index: true },
  maintenanceNote: { type: String, trim: true, default: '' }
}, { timestamps: true });

KioskSchema.index({ hospital: 1, status: 1 });

/** True when the terminal has checked in recently enough to be trusted as live. */
KioskSchema.methods.isOnline = function (staleAfterSeconds = 300) {
  if (!this.lastHeartbeatAt) return false;
  return (Date.now() - this.lastHeartbeatAt.getTime()) / 1000 < staleAfterSeconds;
};

/** Peripherals that are attached, connected and set to capture automatically (§14). */
KioskSchema.methods.availableCaptureDevices = function () {
  return (this.peripherals || []).filter((p) => p.isConnected && p.autoCapture);
};

module.exports = mongoose.model('Kiosk', KioskSchema);
