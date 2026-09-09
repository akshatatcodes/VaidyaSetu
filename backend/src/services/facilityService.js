const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Laboratory = require('../models/Laboratory');
const Kiosk = require('../models/Kiosk');

/**
 * FACILITY SERVICE — MediKiosk §53, §54
 *
 * The one place the platform asks "how is this hospital actually set up?".
 *
 * Everything that used to be hard-coded — the department list, the questionnaire
 * flags, the queue timings, the hospital name and HIP id — is resolved through
 * here. Callers never read a literal.
 *
 * Two behaviours worth knowing about:
 *
 * 1. **Short-lived cache.** Facility configuration is read on nearly every
 *    request (every intake, every queue poll) but changes rarely, so lookups are
 *    memoised for a few seconds. Any write through the admin routes calls
 *    `invalidate()`. This is deliberately a cache and not a source of truth —
 *    unlike the in-memory `departmentConfig` object it replaces, losing it costs
 *    nothing.
 *
 * 2. **Legacy-tolerant department resolution.** Existing Encounter rows store
 *    the department as a free-text string ('Kayachikitsa', 'Prasuti & Stri Roga').
 *    `resolveDepartment` matches those against `code`, `name` and `localName`
 *    case-insensitively so historical data keeps resolving while Phase 4 migrates
 *    it to a reference.
 */

const CACHE_TTL_MS = 15_000;
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** Drop cached configuration. Called after every admin write. */
function invalidate() {
  cache.clear();
}

/**
 * Resolve a hospital by its `hospitalId`, its Mongo `_id`, or — when nothing is
 * supplied — the single active hospital this deployment serves.
 *
 * The no-argument case exists because most of the platform is currently
 * single-tenant: the kiosk, the queue board and the token slip all need "this
 * hospital" without being told which. It returns null rather than inventing one
 * when the facility table has not been seeded (§5).
 */
async function getHospital(idOrHospitalId) {
  const key = `hospital:${idOrHospitalId || '__default__'}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  let hospital = null;

  if (idOrHospitalId) {
    const asId = String(idOrHospitalId);
    hospital = await Hospital.findOne({
      $or: [
        { hospitalId: asId.toUpperCase() },
        ...(asId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: asId }] : [])
      ]
    }).lean();
  } else {
    // Default tenant: the oldest active hospital, so the answer is stable.
    hospital = await Hospital.findOne({ status: 'active' }).sort({ createdAt: 1 }).lean();
  }

  return cacheSet(key, hospital);
}

/** All active departments of a hospital, in display order. */
async function listDepartments(hospitalObjectId, { includeInactive = false } = {}) {
  const key = `depts:${hospitalObjectId}:${includeInactive}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const query = { hospital: hospitalObjectId };
  if (!includeInactive) query.status = 'active';

  const departments = await Department.find(query)
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return cacheSet(key, departments);
}

/**
 * Resolve a department from whatever the caller has — an ObjectId, a code, a
 * display name, or a legacy free-text string from an old Encounter.
 *
 * Returns null when it genuinely cannot be resolved. Callers must treat that as
 * "department not recorded" and must not substitute a default; guessing a
 * department is a clinical routing error (§17).
 */
async function resolveDepartment(hospitalObjectId, departmentRef) {
  if (!departmentRef) return null;

  const raw = String(departmentRef).trim();
  if (!raw) return null;

  const key = `dept:${hospitalObjectId}:${raw.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  if (raw.match(/^[0-9a-fA-F]{24}$/)) {
    const byId = await Department.findById(raw).lean();
    if (byId) return cacheSet(key, byId);
  }

  const departments = await listDepartments(hospitalObjectId, { includeInactive: true });
  const needle = raw.toLowerCase();
  const match = departments.find((d) => (
    d.code?.toLowerCase() === needle ||
    d.name?.toLowerCase() === needle ||
    d.localName?.toLowerCase() === needle
  )) || null;

  return cacheSet(key, match);
}

/**
 * The intake question sets enabled for a department (§13).
 *
 * Replaces `GET /api/admin/questionnaire-flags/:department`, which read an
 * in-memory object and fell back to all-true for unknown departments — that
 * fallback would have switched on the Dashavidha ten-fold examination for a
 * modern-medicine department. This one derives its fallback from the clinical
 * mode instead, and says so.
 */
async function getIntakeConfig(hospitalObjectId, departmentRef) {
  const department = await resolveDepartment(hospitalObjectId, departmentRef);

  if (!department) {
    // Unknown department: enable only what is safe in any setting. AYUSH-specific
    // sections stay off, because running Dashavidha on a department we cannot
    // identify would be asserting a clinical framework we have no basis for.
    return {
      resolved: false,
      departmentCode: null,
      clinicalMode: null,
      dashavidhaEnabled: false,
      ayurvedaProbeEnabled: false,
      reviewOfSystemsEnabled: true,
      bodyMapEnabled: true,
      voiceIntakeEnabled: true,
      vitalsCaptureEnabled: true,
      additionalQuestionSets: []
    };
  }

  const cfg = department.intakeConfig || {};
  const isAyush = department.clinicalMode === 'ayush';

  return {
    resolved: true,
    departmentCode: department.code,
    departmentName: department.name,
    clinicalMode: department.clinicalMode,
    // AYUSH sections can only be on in an AYUSH-mode department (§13).
    dashavidhaEnabled: Boolean(cfg.dashavidhaEnabled) && isAyush,
    ayurvedaProbeEnabled: Boolean(cfg.ayurvedaProbeEnabled) && isAyush,
    reviewOfSystemsEnabled: cfg.reviewOfSystemsEnabled !== false,
    bodyMapEnabled: cfg.bodyMapEnabled !== false,
    voiceIntakeEnabled: cfg.voiceIntakeEnabled !== false,
    vitalsCaptureEnabled: cfg.vitalsCaptureEnabled !== false,
    additionalQuestionSets: cfg.additionalQuestionSets || []
  };
}

/**
 * Effective queue policy for a department: its own overrides layered on the
 * hospital defaults (§18). Returns the hospital defaults alone when the
 * department cannot be resolved.
 */
async function getQueuePolicy(hospitalObjectId, departmentRef) {
  const [hospital, department] = await Promise.all([
    getHospital(hospitalObjectId),
    resolveDepartment(hospitalObjectId, departmentRef)
  ]);

  const defaults = hospital?.queueDefaults || {};

  if (!department) {
    return {
      averageConsultationMinutes: defaults.averageConsultationMinutes ?? 12,
      etaSpreadPercent: defaults.etaSpreadPercent ?? 30,
      emergencyReservedSlots: defaults.emergencyReservedSlots ?? 2,
      followUpWindowMinutes: defaults.followUpWindowMinutes ?? 30,
      followUpWindowCapacity: defaults.followUpWindowCapacity ?? 4,
      allowWalkIn: defaults.allowWalkIn ?? true,
      dailyTokenCapacity: null,
      tokenPrefix: 'OPD'
    };
  }

  // `department` is a lean object, so rehydrate to reach the instance method.
  return Department.hydrate(department).effectiveQueuePolicy(defaults);
}

/** Clinicians a patient may choose from in a department (§17). Public shapes only. */
async function listDoctors(hospitalObjectId, departmentObjectId, { publicOnly = true } = {}) {
  const query = { hospital: hospitalObjectId, status: 'active' };
  if (departmentObjectId) {
    query.$or = [
      { department: departmentObjectId },
      { additionalDepartments: departmentObjectId }
    ];
  }
  if (publicOnly) query['verification.status'] = 'verified';

  const doctors = await Doctor.find(query).sort({ fullName: 1 });
  return publicOnly ? doctors.map((d) => d.toPublicProfile()) : doctors;
}

/** Active laboratories of a hospital (§28). */
async function listLaboratories(hospitalObjectId) {
  return Laboratory.find({ hospital: hospitalObjectId, status: 'active' })
    .sort({ name: 1 })
    .lean();
}

/**
 * Resolve the terminal a request came from (§52). Returns null when the caller
 * did not identify itself as a kiosk — a web or app session legitimately has no
 * kiosk, and that must stay distinguishable from an unregistered device.
 */
async function getKiosk(kioskId) {
  if (!kioskId) return null;
  const key = `kiosk:${String(kioskId).toUpperCase()}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const kiosk = await Kiosk.findOne({ kioskId: String(kioskId).toUpperCase() }).lean();
  return cacheSet(key, kiosk);
}

/**
 * ABDM settings for a hospital (§63). Isolated behind this call so nothing in
 * the core reaches for a hard-coded HIP id.
 *
 * §55 — `enabled` means the facility is *registered*, not that the ecosystem is
 * reachable. Callers must still handle failure and must not present a simulated
 * sync as a real one.
 */
async function getAbdmConfig(hospitalObjectId) {
  const hospital = await getHospital(hospitalObjectId);
  if (!hospital) return null;

  const abdm = hospital.abdm || {};
  return {
    hipId: abdm.hipId || hospital.hospitalId,
    hfrId: abdm.hfrId || '',
    registeredName: abdm.registeredName || hospital.name,
    enabled: Boolean(abdm.enabled),
    mode: abdm.mode || 'simulated',
    careContextPrefix: abdm.careContextPrefix || hospital.hospitalId,
    identifierSystemUri: abdm.identifierSystemUri || ''
  };
}

/**
 * Everything a kiosk or portal needs to render itself for one hospital, in a
 * single call: identity, departments, labs and the terminal's own policy.
 */
async function getFacilityContext({ hospitalId = null, kioskId = null } = {}) {
  const kiosk = await getKiosk(kioskId);
  const hospital = await getHospital(hospitalId || kiosk?.hospital);

  if (!hospital) {
    return { hospital: null, departments: [], laboratories: [], kiosk: null };
  }

  const [departments, laboratories] = await Promise.all([
    listDepartments(hospital._id),
    listLaboratories(hospital._id)
  ]);

  return { hospital, departments, laboratories, kiosk };
}

module.exports = {
  getHospital,
  listDepartments,
  resolveDepartment,
  getIntakeConfig,
  getQueuePolicy,
  listDoctors,
  listLaboratories,
  getKiosk,
  getAbdmConfig,
  getFacilityContext,
  invalidate
};
