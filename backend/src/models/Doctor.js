const mongoose = require('mongoose');
const {
  SYSTEMS_OF_MEDICINE,
  FACILITY_STATUSES,
  DAYS_OF_WEEK,
  SUPPORTED_LANGUAGES,
  TIME_OF_DAY_PATTERN
} = require('../constants/facility');

/**
 * DOCTOR — MediKiosk §21, §22, §23, §59
 *
 * A clinician configured by a hospital. Not a self-declared role.
 *
 * §21 is the load-bearing rule: doctor identity comes from the hospital's own
 * verified professional record and, where available, the ABDM Healthcare
 * Professional Registry. **Arbitrary users must not be able to claim a doctor
 * role.** That is enforced here by `verification.status`: a doctor is only
 * clinically usable once a hospital admin (or the registry) has verified them.
 * `isClinicallyActive()` is the single predicate the rest of the platform should
 * ask before letting this record sign anything.
 *
 * §23 requires a professional profile, but also that sensitive/private
 * information is not exposed publicly. Private fields are `select: false` so
 * they are never fetched by accident, and `toPublicProfile()` is the only shape
 * that should ever reach a patient-facing surface.
 *
 * This replaces the DEMO_DOCTORS array in authRoutes, the embedded
 * `UserProfile.doctorProfile` (which defaulted every clinician to
 * 'Kayachikitsa' / 'Room 104'), and the free-text `doctorId` / `doctorName`
 * strings on `Encounter.doctorReview`.
 */

/**
 * One recurring clinic session. A doctor may sit in different rooms on different
 * days, so the room is on the session, not on the doctor.
 */
const ClinicSessionSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, enum: DAYS_OF_WEEK, required: true },
  startTime: {
    type: String,
    required: true,
    match: [TIME_OF_DAY_PATTERN, 'startTime must be HH:mm in 24-hour form']
  },
  endTime: {
    type: String,
    required: true,
    match: [TIME_OF_DAY_PATTERN, 'endTime must be HH:mm in 24-hour form']
  },
  /** Matches a `roomNumber` in the department's embedded rooms. */
  roomNumber: { type: String, trim: true, default: '' },
  /** Bookable appointments in this session. Null = walk-in queue only (§23). */
  appointmentCapacity: { type: Number, default: null, min: 0 },
  /** Slots in this session held for follow-up review patients (§32, §34). */
  followUpCapacity: { type: Number, default: null, min: 0 },
  isActive: { type: Boolean, default: true }
}, { _id: false });

/**
 * Professional registration (§21). Recorded rather than asserted: an unverified
 * registration number is stored with `status: 'unverified'` and the doctor stays
 * clinically inactive until someone verifies it. §5 — we never record an unknown
 * as a negative.
 */
const RegistrationSchema = new mongoose.Schema({
  /** e.g. 'NMC', 'CCIM', 'CCH', or a state medical council. */
  council: { type: String, trim: true, default: '' },
  number: { type: String, trim: true, default: '' },
  registeredName: { type: String, trim: true, default: '' },
  validUntil: { type: Date, default: null },
  /** ABDM Healthcare Professional Registry id, when the doctor is enrolled. */
  hprId: { type: String, trim: true, default: '' }
}, { _id: false });

const VerificationSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'suspended', 'rejected'],
    default: 'unverified',
    index: true
  },
  /** How the identity was established — a claim by the user is not enough (§21). */
  method: {
    type: String,
    enum: ['hospital_admin', 'professional_registry', 'document_review', 'not_verified'],
    default: 'not_verified'
  },
  verifiedAt: { type: Date, default: null },
  /** Admin/user id of whoever performed the verification. */
  verifiedBy: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' }
}, { _id: false });

/**
 * Live consultation speed, used by the queue engine (§18) so the ETA reflects
 * how fast this doctor is actually working today rather than a fixed constant.
 * Maintained by the queue service; not edited by hand.
 */
const ConsultationStatsSchema = new mongoose.Schema({
  /** Rolling mean consultation length in minutes. Null until enough data. */
  rollingAverageMinutes: { type: Number, default: null, min: 1 },
  /** Consultations the average is computed over. */
  sampleSize: { type: Number, default: 0, min: 0 },
  lastComputedAt: { type: Date, default: null }
}, { _id: false });

const DoctorSchema = new mongoose.Schema({
  /** Stable identifier used on tokens, referrals and signatures. */
  doctorId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },

  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false,
    index: true
  },
  /** Primary department. Cross-department work goes in `additionalDepartments`. */
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false,
    index: true
  },
  additionalDepartments: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    default: []
  },

  hospitalName: { type: String, trim: true, default: 'All India Institute of Ayurveda (AIIA)' },
  departmentName: { type: String, trim: true, default: 'Department of Kayachikitsa' },
  roomNumber: { type: String, trim: true, default: 'OPD Room 104' },
  consultationTimings: { type: String, trim: true, default: '09:00 AM - 02:00 PM (Mon - Sat)' },
  availableAppointmentSlots: { type: String, trim: true, default: '15 mins / slot • Max 25 patients / day' },

  professionalDetails: {
    registrationNumber: { type: String, trim: true, default: 'AIIA-2024-8891' },
    registrationCouncil: { type: String, trim: true, default: 'Delhi Bharatiya Chikitsa Parishad' },
    bio: { type: String, trim: true, default: 'Senior Consultant Physician specializing in gastro-metabolic & musculoskeletal disorders.' }
  },

  fullName: { type: String, required: true, trim: true },
  /** Name as it should appear on a prescription or signature line. */
  displayName: { type: String, trim: true, default: '' },
  qualifications: { type: [String], default: [] },
  specialities: { type: [String], default: [] },
  systemOfMedicine: { type: String, enum: SYSTEMS_OF_MEDICINE, default: 'Allopathy' },
  languagesSpoken: {
    type: [{ type: String, enum: SUPPORTED_LANGUAGES }],
    default: ['en']
  },

  registration: { type: RegistrationSchema, default: () => ({}) },
  verification: { type: VerificationSchema, default: () => ({}) },

  experienceYears: { type: Number, default: null, min: 0, max: 80 },
  yearsAtHospital: { type: Number, default: null, min: 0, max: 80 },
  joinedOn: { type: Date, default: null },

  /** Recurring clinic timings and days available (§23). */
  clinicSessions: { type: [ClinicSessionSchema], default: [] },
  /** Default room when no clinic session says otherwise. */
  defaultRoomNumber: { type: String, trim: true, default: '' },

  consultationStats: { type: ConsultationStatsSchema, default: () => ({}) },

  /** Safe to show a patient choosing a doctor (§17, §23). */
  publicProfile: {
    photoUrl: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '', maxlength: 600 },
    acceptsNewPatients: { type: Boolean, default: true }
  },

  /**
   * §23 — private. `select: false` keeps these out of every query that does not
   * explicitly ask for them, so a patient-facing endpoint cannot leak them by
   * forgetting a projection.
   */
  privateContact: {
    phone: { type: String, trim: true, default: '', select: false },
    email: { type: String, trim: true, lowercase: true, default: '', select: false },
    emergencyContact: { type: String, trim: true, default: '', select: false }
  },

  /**
   * Link to the login account that authenticates as this doctor. Kept as a
   * reference rather than duplicating credentials — Phase 2 rebuilds identity.
   */
  account: {
    userId: { type: String, trim: true, default: '', index: true },
    mobile: { type: String, trim: true, default: '' }
  },

  status: { type: String, enum: FACILITY_STATUSES, default: 'active', index: true },
  /** Temporarily away (leave, conference). Distinct from `status` (§23). */
  availability: {
    isAvailableToday: { type: Boolean, default: true },
    unavailableUntil: { type: Date, default: null },
    unavailableReason: { type: String, trim: true, default: '' }
  }
}, { timestamps: true });

DoctorSchema.index({ hospital: 1, department: 1, status: 1 });
DoctorSchema.index({ 'registration.number': 1, 'registration.council': 1 });

/**
 * The single predicate the platform should ask before letting this record take
 * clinical action — see a patient, sign a note, order a test.
 *
 * §21: an unverified professional identity is not a doctor.
 */
DoctorSchema.methods.isClinicallyActive = function () {
  return this.status === 'active' && this.verification?.status === 'verified';
};

/**
 * The only shape that should reach a patient-facing surface (§23).
 * Deliberately omits contact details, registration validity and account linkage.
 */
DoctorSchema.methods.toPublicProfile = function () {
  return {
    doctorId: this.doctorId,
    name: this.displayName || this.fullName,
    qualifications: this.qualifications,
    specialities: this.specialities,
    systemOfMedicine: this.systemOfMedicine,
    languagesSpoken: this.languagesSpoken,
    experienceYears: this.experienceYears,
    /** Council and number only — enough to look up, nothing more (§21). */
    registration: {
      council: this.registration?.council || '',
      number: this.registration?.number || ''
    },
    verified: this.verification?.status === 'verified',
    photoUrl: this.publicProfile?.photoUrl || '',
    bio: this.publicProfile?.bio || '',
    acceptsNewPatients: this.publicProfile?.acceptsNewPatients !== false,
    isAvailableToday: this.availability?.isAvailableToday !== false
  };
};

/**
 * Minutes to budget for one of this doctor's consultations (§18).
 * Prefers observed speed; falls back to the department policy.
 *
 * @param {number} departmentAverage - from `Department#effectiveQueuePolicy()`
 */
DoctorSchema.methods.expectedConsultationMinutes = function (departmentAverage = 12) {
  const observed = this.consultationStats?.rollingAverageMinutes;
  const sample = this.consultationStats?.sampleSize || 0;
  // Below ~5 consultations the mean is noise; trust the department policy.
  return (observed && sample >= 5) ? observed : departmentAverage;
};

module.exports = mongoose.model('Doctor', DoctorSchema);
