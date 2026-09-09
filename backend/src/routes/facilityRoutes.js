const express = require('express');
const router = express.Router();

const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const facilityService = require('../services/facilityService');

/**
 * FACILITY DISCOVERY — /api/facilities  (MediKiosk §9, §17, §54)
 *
 * The read-only, patient-facing view of hospital configuration. This is what
 * powers the §9 registration path:
 *
 *   Select hospital → nearby hospitals → departments → available doctors
 *                                                    → queue / estimated time
 *
 * Everything here is public configuration — a hospital's name, its departments,
 * its clinic timings, a doctor's professional profile. No patient data passes
 * through these routes, so they are unauthenticated by design; a patient must be
 * able to see where they can go before they have an account.
 *
 * §23 — doctor records are returned through `toPublicProfile()` only. Contact
 * details, registration validity and account linkage never appear here.
 */

/** Consistent error shape, and never leak a stack trace to a public caller. */
function fail(res, code, message, error) {
  if (error) console.error(`[Facilities] ${message}:`, error.message);
  return res.status(code).json({ status: 'error', message });
}

/**
 * GET /api/facilities/hospitals
 *
 * Query:
 *   lat, lng, radiusKm   → §9 "nearby hospitals", sorted by true distance
 *   state, district, city
 *   system               → filter by system of medicine, e.g. 'Ayurveda'
 *   q                    → name search
 *   limit                → default 25, max 100
 */
router.get('/hospitals', async (req, res) => {
  try {
    const { lat, lng, radiusKm, state, district, city, system, q } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);

    const filter = { status: 'active' };
    if (state) filter['address.state'] = new RegExp(`^${escapeRegex(state)}$`, 'i');
    if (district) filter['address.district'] = new RegExp(`^${escapeRegex(district)}$`, 'i');
    if (city) filter['address.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i');
    if (system) filter.systemsOfMedicine = system;
    if (q) filter.name = new RegExp(escapeRegex(q), 'i');

    let hospitals;
    let searchMode = 'list';

    const hasCoords = lat !== undefined && lng !== undefined &&
      !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng));

    if (hasCoords) {
      // $nearSphere sorts by distance for us, so the nearest hospital is first.
      const metres = (parseFloat(radiusKm) || 25) * 1000;
      filter.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: metres
        }
      };
      searchMode = 'nearby';
      hospitals = await Hospital.find(filter).limit(limit).lean();
    } else {
      hospitals = await Hospital.find(filter).sort({ name: 1 }).limit(limit).lean();
    }

    res.json({
      status: 'success',
      searchMode,
      count: hospitals.length,
      data: hospitals.map(toPublicHospital)
    });
  } catch (error) {
    return fail(res, 500, 'Could not load hospitals', error);
  }
});

/** GET /api/facilities/hospitals/:hospitalId — one hospital's public profile. */
router.get('/hospitals/:hospitalId', async (req, res) => {
  try {
    const hospital = await facilityService.getHospital(req.params.hospitalId);
    if (!hospital) return fail(res, 404, 'Hospital not found');
    res.json({ status: 'success', data: toPublicHospital(hospital) });
  } catch (error) {
    return fail(res, 500, 'Could not load hospital', error);
  }
});

/**
 * GET /api/facilities/hospitals/:hospitalId/departments
 *
 * The §9 department picker. This is the single source the kiosk, the admin
 * dashboard and the queue board should all read from — replacing the five
 * hard-coded department lists that used to disagree with each other.
 */
router.get('/hospitals/:hospitalId/departments', async (req, res) => {
  try {
    const hospital = await facilityService.getHospital(req.params.hospitalId);
    if (!hospital) return fail(res, 404, 'Hospital not found');

    const departments = await facilityService.listDepartments(hospital._id);

    res.json({
      status: 'success',
      count: departments.length,
      data: departments.map((d) => ({
        code: d.code,
        name: d.name,
        localName: d.localName,
        description: d.description,
        systemOfMedicine: d.systemOfMedicine,
        clinicalMode: d.clinicalMode,
        displayOrder: d.displayOrder,
        rooms: (d.rooms || []).filter((r) => r.isActive).map((r) => r.roomNumber),
        acceptsWalkIn: d.queuePolicy?.allowWalkIn ?? hospital.queueDefaults?.allowWalkIn ?? true
      }))
    });
  } catch (error) {
    return fail(res, 500, 'Could not load departments', error);
  }
});

/**
 * GET /api/facilities/hospitals/:hospitalId/departments/:code
 * Includes the intake configuration, so a kiosk knows which question sets to run
 * before it starts the interview (§13).
 */
router.get('/hospitals/:hospitalId/departments/:code', async (req, res) => {
  try {
    const hospital = await facilityService.getHospital(req.params.hospitalId);
    if (!hospital) return fail(res, 404, 'Hospital not found');

    const department = await facilityService.resolveDepartment(hospital._id, req.params.code);
    if (!department) return fail(res, 404, 'Department not found at this hospital');

    const [intakeConfig, queuePolicy] = await Promise.all([
      facilityService.getIntakeConfig(hospital._id, department.code),
      facilityService.getQueuePolicy(hospital._id, department.code)
    ]);

    res.json({
      status: 'success',
      data: {
        code: department.code,
        name: department.name,
        localName: department.localName,
        description: department.description,
        systemOfMedicine: department.systemOfMedicine,
        clinicalMode: department.clinicalMode,
        rooms: (department.rooms || []).filter((r) => r.isActive),
        workingHours: department.workingHours,
        intakeConfig,
        // Timings only — the live wait comes from the queue service (§18).
        queuePolicy: {
          averageConsultationMinutes: queuePolicy.averageConsultationMinutes,
          etaSpreadPercent: queuePolicy.etaSpreadPercent,
          allowWalkIn: queuePolicy.allowWalkIn,
          tokenPrefix: queuePolicy.tokenPrefix
        }
      }
    });
  } catch (error) {
    return fail(res, 500, 'Could not load department', error);
  }
});

/**
 * GET /api/facilities/hospitals/:hospitalId/departments/:code/doctors
 *
 * §17 — the "available doctors" list the patient chooses from. Only verified,
 * active clinicians appear (§21), and only their public profile (§23).
 *
 * Note this endpoint does NOT return queue counts or wait estimates. Those are
 * live values owned by the queue engine and are joined in by the caller — mixing
 * them into the configuration read would make a cached response look live.
 */
router.get('/hospitals/:hospitalId/departments/:code/doctors', async (req, res) => {
  try {
    const hospital = await facilityService.getHospital(req.params.hospitalId);
    if (!hospital) return fail(res, 404, 'Hospital not found');

    const department = await facilityService.resolveDepartment(hospital._id, req.params.code);
    if (!department) return fail(res, 404, 'Department not found at this hospital');

    const doctors = await facilityService.listDoctors(hospital._id, department._id);

    res.json({
      status: 'success',
      count: doctors.length,
      department: { code: department.code, name: department.name },
      data: doctors
    });
  } catch (error) {
    return fail(res, 500, 'Could not load doctors', error);
  }
});

/** GET /api/facilities/hospitals/:hospitalId/laboratories — §28 lab directory. */
router.get('/hospitals/:hospitalId/laboratories', async (req, res) => {
  try {
    const hospital = await facilityService.getHospital(req.params.hospitalId);
    if (!hospital) return fail(res, 404, 'Hospital not found');

    const labs = await facilityService.listLaboratories(hospital._id);

    res.json({
      status: 'success',
      count: labs.length,
      data: labs.map((l) => ({
        labId: l.labId,
        name: l.name,
        shortName: l.shortName,
        sections: (l.sections || []).filter((s) => s.isActive).map((s) => s.code),
        location: l.location,
        workingHours: l.workingHours,
        // Names only — the full catalogue with ranges is a lab-portal concern.
        testCount: (l.testCatalog || []).filter((t) => t.isActive).length
      }))
    });
  } catch (error) {
    return fail(res, 500, 'Could not load laboratories', error);
  }
});

/**
 * GET /api/facilities/context
 *
 * Everything a terminal needs to render itself, in one call.
 * Query: `kioskId` (a physical kiosk) or `hospitalId` (web/app).
 *
 * §9 — when the patient is physically at the hospital, the kiosk supplies the
 * hospital context automatically instead of asking them to pick it.
 */
router.get('/context', async (req, res) => {
  try {
    const { hospitalId, kioskId } = req.query;
    const context = await facilityService.getFacilityContext({ hospitalId, kioskId });

    if (!context.hospital) {
      return fail(res, 404, 'No hospital configuration found. Has the facility been set up?');
    }

    res.json({
      status: 'success',
      data: {
        hospital: toPublicHospital(context.hospital),
        departments: context.departments.map((d) => ({
          code: d.code,
          name: d.name,
          localName: d.localName,
          description: d.description,
          clinicalMode: d.clinicalMode,
          displayOrder: d.displayOrder
        })),
        laboratories: context.laboratories.map((l) => ({ labId: l.labId, name: l.name })),
        // §52 — the terminal's own session-hygiene and accessibility policy.
        kiosk: context.kiosk ? {
          kioskId: context.kiosk.kioskId,
          label: context.kiosk.label,
          location: context.kiosk.location,
          department: context.kiosk.department || null,
          languages: context.kiosk.languages,
          defaultLanguage: context.kiosk.defaultLanguage,
          capabilities: context.kiosk.capabilities,
          sessionPolicy: context.kiosk.sessionPolicy,
          accessibility: context.kiosk.accessibility,
          offline: {
            enabled: context.kiosk.offline?.enabled,
            cacheInterface: context.kiosk.offline?.cacheInterface,
            cacheLanguagePacks: context.kiosk.offline?.cacheLanguagePacks,
            cacheQueueState: context.kiosk.offline?.cacheQueueState
          }
        } : null
      }
    });
  } catch (error) {
    return fail(res, 500, 'Could not load facility context', error);
  }
});

/**
 * Public projection of a hospital. Deliberately drops `abdm` (an integration
 * secret surface, §63) and internal notes.
 */
function toPublicHospital(h) {
  return {
    hospitalId: h.hospitalId,
    name: h.name,
    shortName: h.shortName || h.name,
    type: h.type,
    systemsOfMedicine: h.systemsOfMedicine,
    address: h.address,
    location: h.location || null,
    contact: h.contact,
    supportedLanguages: h.supportedLanguages,
    services: (h.services || []).filter((s) => s.isActive),
    workingHours: h.workingHours,
    hasEmergencyDepartment: h.emergencyPolicy?.hasEmergencyDepartment ?? false,
    emergencyContact: h.emergencyPolicy?.triageContactNumber || h.contact?.phone || ''
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = router;
