/**
 * Phase 12 — Hospital Admin & Configuration Engine (§53, §54)
 * DB-Backed Administration for Hospitals, Departments, Doctors, Kiosks, Laboratories, Queues & Audit.
 * Every department's doctor count, room list, working hours, and queue policy comes from MongoDB documents (§54).
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Mongoose Models
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Kiosk = require('../models/Kiosk');
const Laboratory = require('../models/Laboratory');
const Encounter = require('../models/Encounter');
const AuditLog = require('../models/AuditLog');
const { logAuditEvent } = require('../middleware/auditMiddleware');

const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
  if (process.env.REQUIRE_ADMIN_AUTH === 'true') {
    return requireAuth(req, res, () => {
      return requireRole('admin')(req, res, next);
    });
  }
  next();
};
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

// ─── 1. HOSPITALS CRUD ────────────────────────────────────────────────────────
router.get('/hospitals', async (req, res) => {
  try {
    const hospitals = await Hospital.find().lean();
    return res.json({ status: 'success', count: hospitals.length, data: hospitals });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/hospitals', async (req, res) => {
  try {
    const { hospitalId, name, code, address, contact } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'Hospital name is required' });

    const hospital = await Hospital.create({
      hospitalId: hospitalId || `HOSP-${Date.now()}`,
      name,
      code: code || name.substring(0, 3).toUpperCase(),
      address: address || { state: 'Delhi', district: 'New Delhi' },
      contact: contact || {}
    });

    await logAuditEvent({ action: 'create_hospital', targetType: 'hospital', targetId: hospital._id });
    return res.status(201).json({ status: 'success', data: hospital });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── 2. DEPARTMENTS CRUD (§54) ────────────────────────────────────────────────
router.get('/departments/live', async (req, res) => {
  try {
    const departments = await Department.find().populate('hospital', 'name code').lean();
    return res.json({ status: 'success', count: departments.length, data: departments });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/departments/live', async (req, res) => {
  try {
    const { hospitalId, code, name, systemOfMedicine, rooms = [] } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'Department name is required' });

    let hospId = hospitalId;
    if (!hospId || !mongoose.Types.ObjectId.isValid(hospId)) {
      let defaultHosp = await Hospital.findOne();
      if (!defaultHosp) {
        defaultHosp = await Hospital.create({
          hospitalId: 'IN-DL-AIIA-001',
          name: 'All India Institute of Ayurveda',
          code: 'AIIA'
        });
      }
      hospId = defaultHosp._id;
    }

    const deptCode = code || name.substring(0, 4).toUpperCase() + `-${Date.now()}`;

    const dept = await Department.create({
      hospital: hospId,
      code: deptCode,
      name,
      systemOfMedicine: systemOfMedicine || 'Allopathy',
      rooms: rooms.length > 0 ? rooms : [{ roomNumber: '101', name: 'General OPD Room 1' }]
    });

    await logAuditEvent({ action: 'create_department', targetType: 'department', targetId: dept._id });
    return res.status(201).json({ status: 'success', data: dept });
  } catch (err) {
    console.error('Error creating department:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Legacy department feature flag endpoints
router.get('/departments', (req, res) => {
  return res.json({ status: 'success', data: departmentConfig });
});

router.patch('/departments/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  if (!departmentConfig[name]) {
    return res.status(404).json({ status: 'error', message: 'Unknown department: ' + name });
  }
  const { enabled, dashavidhaEnabled, ayurvedaProbeEnabled } = req.body;
  if (enabled !== undefined) departmentConfig[name].enabled = Boolean(enabled);
  if (dashavidhaEnabled !== undefined) departmentConfig[name].dashavidhaEnabled = Boolean(dashavidhaEnabled);
  if (ayurvedaProbeEnabled !== undefined) departmentConfig[name].ayurvedaProbeEnabled = Boolean(ayurvedaProbeEnabled);
  return res.json({ status: 'success', data: { [name]: departmentConfig[name] } });
});

router.get('/questionnaire-flags/:department', (req, res) => {
  const name = decodeURIComponent(req.params.department);
  const cfg = departmentConfig[name] || { enabled: true, dashavidhaEnabled: true, ayurvedaProbeEnabled: true };
  return res.json({ status: 'success', data: cfg });
});

// ─── 3. DOCTORS CRUD ─────────────────────────────────────────────────────────
router.get('/doctors/live', async (req, res) => {
  try {
    const doctors = await Doctor.find().lean();
    return res.json({ status: 'success', count: doctors.length, data: doctors });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/doctors/live', async (req, res) => {
  try {
    const { doctorId, fullName, hospital, department, specialities = [] } = req.body;
    if (!fullName) return res.status(400).json({ status: 'error', message: 'Doctor fullName is required' });

    let hospId = hospital;
    if (!hospId || !mongoose.Types.ObjectId.isValid(hospId)) {
      const defaultHosp = await Hospital.findOne();
      hospId = defaultHosp?._id || new mongoose.Types.ObjectId();
    }

    let deptId = department;
    if (!deptId || !mongoose.Types.ObjectId.isValid(deptId)) {
      const defaultDept = await Department.findOne();
      deptId = defaultDept?._id || new mongoose.Types.ObjectId();
    }

    const doctor = await Doctor.create({
      doctorId: doctorId || `DOC-${Date.now()}`,
      fullName,
      hospital: hospId,
      department: deptId,
      specialities: specialities.length > 0 ? specialities : ['Kayachikitsa'],
      verification: { status: 'verified', method: 'hospital_admin' }
    });

    await logAuditEvent({ action: 'create_doctor', targetType: 'doctor', targetId: doctor._id });
    return res.status(201).json({ status: 'success', data: doctor });
  } catch (err) {
    console.error('Error creating doctor:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── 4. KIOSKS CRUD ──────────────────────────────────────────────────────────
router.get('/kiosks/live', async (req, res) => {
  try {
    const kiosks = await Kiosk.find().lean();
    return res.json({ status: 'success', count: kiosks.length, data: kiosks });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/kiosks/live', async (req, res) => {
  try {
    const { kioskId, hospital, label, location } = req.body;
    let hospId = hospital;
    if (!hospId || !mongoose.Types.ObjectId.isValid(hospId)) {
      const defaultHosp = await Hospital.findOne();
      hospId = defaultHosp?._id || new mongoose.Types.ObjectId();
    }

    const kiosk = await Kiosk.create({
      kioskId: kioskId || `KIOSK-${Date.now()}`,
      hospital: hospId,
      label: label || 'OPD Reception MediKiosk 1',
      location: location || 'Main Entrance Gate 1'
    });

    return res.status(201).json({ status: 'success', data: kiosk });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── 5. LABS CRUD ────────────────────────────────────────────────────────────
router.get('/labs/live', async (req, res) => {
  try {
    const labs = await Laboratory.find().lean();
    return res.json({ status: 'success', count: labs.length, data: labs });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/labs/live', async (req, res) => {
  try {
    const { laboratoryId, name, code, hospital } = req.body;
    let hospId = hospital;
    if (!hospId || !mongoose.Types.ObjectId.isValid(hospId)) {
      let defaultHosp = await Hospital.findOne();
      if (!defaultHosp) {
        defaultHosp = await Hospital.create({
          hospitalId: 'IN-DL-AIIA-001',
          name: 'All India Institute of Ayurveda',
          code: 'AIIA'
        });
      }
      hospId = defaultHosp._id;
    }

    const lab = await Laboratory.create({
      labId: laboratoryId || `LAB-${Date.now()}`,
      hospital: hospId,
      name: name || 'Central Pathology & Biochemistry Lab'
    });

    return res.status(201).json({ status: 'success', data: lab });
  } catch (err) {
    console.error('Error creating lab:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── 6. AUDIT & STATS ROUTES ─────────────────────────────────────────────────
router.get('/audit-log', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ at: -1 }).limit(100).lean();
    return res.json({ status: 'success', count: logs.length, data: logs });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/stats', adminOnly, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySessions = await Encounter.find({ createdAt: { $gte: startOfToday } });
    return res.json({
      status: 'success',
      data: {
        sessionsToday: todaySessions.length,
        redFlagCount: todaySessions.filter(s => s.redFlags?.length > 0).length,
        avgIntakeMinutes: 4.5,
        completedConsultations: todaySessions.filter(s => s.queueStatus === 'completed').length,
        emergencyInQueue: todaySessions.filter(s => s.triagePriority === 'emergency').length
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
module.exports.departmentConfig = departmentConfig;
