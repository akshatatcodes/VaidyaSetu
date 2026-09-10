const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const FamilyMember = require('../models/FamilyMember');
const User = require('../models/User');

/**
 * @route POST /api/patients
 * @desc Direct creation of patient profile
 */
router.post('/', async (req, res) => {
  try {
    const { basicInfo, userId, abhaId } = req.body;
    const patient = await Patient.create({
      userId: userId || null,
      abhaId: abhaId || undefined,
      basicInfo: basicInfo || { fullName: 'Unknown Patient', age: 30, gender: 'Male' }
    });
    return res.status(201).json({
      status: 'success',
      message: 'Patient profile created cleanly',
      data: patient
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

const handleFamilyMember = async (req, res) => {
  try {
    const { userId, caregiverUserId, fullName, relation, age, gender, bloodGroup, contactNumber, address, isPrimary, basicInfo, healthProfile } = req.body;

    const effUserId = userId || caregiverUserId;
    const effFullName = fullName || basicInfo?.fullName;
    const effAge = age !== undefined ? age : basicInfo?.age;
    const effGender = gender || basicInfo?.gender;
    const effContact = contactNumber || basicInfo?.contactNumber;

    if (!effUserId || !effFullName || !relation || effAge === undefined || !effGender) {
      return res.status(400).json({
        status: 'error',
        message: 'userId, fullName, relation, age, and gender are required'
      });
    }

    let user;
    if (String(effUserId).match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(effUserId);
    }
    
    const patientData = {
      userId: user ? user._id : null,
      basicInfo: {
        fullName: String(effFullName).trim(),
        age: Number(effAge),
        gender: effGender,
        bloodGroup: bloodGroup || 'Unknown',
        contactNumber: effContact || '',
        address: address || ''
      }
    };

    if (healthProfile) {
      patientData.healthProfile = healthProfile;
    }

    const patient = await Patient.create(patientData);

    const familyMember = await FamilyMember.create({
      userId: user ? user._id : effUserId,
      patientId: patient._id,
      relation,
      isPrimary: Boolean(isPrimary)
    });

    return res.status(201).json({
      status: 'success',
      message: 'Family member registered cleanly with distinct Patient identity',
      data: {
        familyMemberId: familyMember._id,
        relation: familyMember.relation,
        isPrimary: familyMember.isPrimary,
        patient,
        beneficiaryPatient: patient
      }
    });
  } catch (error) {
    console.error('Error adding family member:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @route POST /api/patients/family-member
 * @route POST /api/patients/beneficiaries
 * @desc Add a beneficiary profile linked to a mobile account head-of-account (§2)
 */
router.post('/family-member', handleFamilyMember);
router.post('/beneficiaries', handleFamilyMember);

/**
 * @route GET /api/patients/family-members/:userId
 * @desc List all family members linked to a mobile account (§2)
 */
router.get('/family-members/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let query = {};
    let matchedUser = null;

    if (String(userId).match(/^[0-9a-fA-F]{24}$/)) {
      query.userId = userId;
    } else {
      // Treat as phone number or generic identifier
      matchedUser = await User.findOne({ phone: userId });
      if (matchedUser) {
        query.userId = matchedUser._id;
      }
    }

    let familyMembers = [];
    if (query.userId) {
      familyMembers = await FamilyMember.find(query).populate('patientId');
    }

    if (familyMembers.length > 0) {
      return res.json({
        status: 'success',
        count: familyMembers.length,
        data: familyMembers.map(fm => ({
          familyMemberId: fm._id,
          relation: fm.relation,
          isPrimary: fm.isPrimary,
          patient: fm.patientId
        }))
      });
    }

    // Fallback: search Patient directly by mobile number or userId
    const patientQuery = matchedUser
      ? { $or: [{ userId: matchedUser._id }, { mobileNumber: userId }, { 'basicInfo.contactNumber': userId }] }
      : { $or: [{ mobileNumber: userId }, { 'basicInfo.contactNumber': userId }] };

    const patients = await Patient.find(patientQuery);
    return res.json({
      status: 'success',
      count: patients.length,
      data: patients.map((p, idx) => ({
        familyMemberId: p._id,
        relation: p.relationshipToHead || (idx === 0 ? 'Self' : 'Family Member'),
        isPrimary: idx === 0,
        patient: p
      }))
    });
  } catch (error) {
    console.error('Error listing family members:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/patients/:patientId
 * @desc Fetch Patient health profile details
 */
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const cleanDigits = String(patientId).replace(/\D/g, '').slice(-10);
    let patient = null;

    if (String(patientId).match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      patient = await Patient.findOne({ abhaId: patientId }) ||
        await Patient.findOne({ userId: patientId }) ||
        (cleanDigits.length === 10 ? (
          await Patient.findOne({ mobileNumber: cleanDigits }) ||
          await Patient.findOne({ 'basicInfo.contactNumber': new RegExp(cleanDigits) })
        ) : null);
    }

    if (!patient) {
      // Auto-create Patient document to ensure zero data orphans (§4)
      patient = await Patient.create({
        basicInfo: {
          fullName: 'Ayush Patient',
          age: 30,
          gender: 'Male',
          contactNumber: cleanDigits.length === 10 ? `+91 ${cleanDigits}` : ''
        },
        abhaId: String(patientId).includes('-') ? patientId : undefined
      });
    }

    return res.json({
      status: 'success',
      data: patient
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route PUT /api/patients/:patientId/health-profile
 * @desc Update Patient Health Profile & AYUSH Profile with source tagging (§4, §5, §66)
 */
router.put('/:patientId/health-profile', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { basicInfo, healthProfile, ayushProfile, sourceTag } = req.body;

    const defaultSource = sourceTag || 'Patient reported';

    let patient = null;
    if (String(patientId).match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }

    if (!patient) {
      patient = new Patient({
        basicInfo: basicInfo || { fullName: 'Unknown Patient', age: 30, gender: 'Male' }
      });
    }

    // Merge basic info cleanly
    if (basicInfo) {
      const existing = patient.basicInfo ? (patient.basicInfo.toObject ? patient.basicInfo.toObject() : patient.basicInfo) : {};
      patient.basicInfo = {
        fullName: basicInfo.fullName || existing.fullName || 'Unknown Patient',
        age: basicInfo.age !== undefined ? Number(basicInfo.age) : (existing.age || 30),
        gender: basicInfo.gender || existing.gender || 'Male',
        bloodGroup: basicInfo.bloodGroup || existing.bloodGroup || 'Unknown',
        contactNumber: basicInfo.contactNumber || existing.contactNumber || '',
        address: basicInfo.address || existing.address || '',
        emergencyContact: {
          name: basicInfo.emergencyContact?.name || existing.emergencyContact?.name || '',
          relation: basicInfo.emergencyContact?.relation || existing.emergencyContact?.relation || '',
          phone: basicInfo.emergencyContact?.phone || existing.emergencyContact?.phone || ''
        }
      };
    }

    // Process health profile with source tagging
    if (healthProfile) {
      const processedAllergies = (healthProfile.allergies || []).map(item => {
        if (typeof item === 'string') {
          return { substance: item, sourceTag: defaultSource, status: 'Confirmed' };
        }
        return {
          substance: item.substance || item.name || '',
          sourceTag: item.sourceTag || defaultSource,
          status: item.status || 'Confirmed'
        };
      });

      const processedDiseases = (healthProfile.existingDiseases || healthProfile.medicalHistory || []).map(item => {
        if (typeof item === 'string') {
          return { condition: item, sourceTag: defaultSource };
        }
        return {
          condition: item.condition || item.name || '',
          sourceTag: item.sourceTag || defaultSource,
          diagnosedAt: item.diagnosedAt || null
        };
      });

      patient.healthProfile = {
        allergies: processedAllergies,
        existingDiseases: processedDiseases,
        surgeries: healthProfile.surgeries || [],
        hospitalizations: healthProfile.hospitalizations || [],
        familyHistory: healthProfile.familyHistory || [],
        personalHistory: {
          smoking: healthProfile.personalHistory?.smoking || 'Not reported',
          alcohol: healthProfile.personalHistory?.alcohol || 'Not reported',
          diet: healthProfile.personalHistory?.diet || 'Not reported'
        }
      };
    }

    // Merge AYUSH profile
    if (ayushProfile) {
      patient.ayushProfile = {
        prakriti: ayushProfile.prakriti || 'Not reported',
        vikriti: ayushProfile.vikriti || 'Not reported',
        ahara: ayushProfile.ahara || 'Not reported',
        vihara: ayushProfile.vihara || 'Not reported',
        agni: ayushProfile.agni || 'Not reported',
        koshtha: ayushProfile.koshtha || 'Not reported'
      };
    }

    await patient.save();

    return res.json({
      status: 'success',
      message: 'Health profile updated with source provenance tags',
      data: patient
    });
  } catch (error) {
    console.error('Error updating health profile:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/patients/:patientId/timeline
 * @desc Aggregate longitudinal timeline events across Encounters, Vitals, Documents, Labs, Referrals & Follow-ups (§40, Phase 23)
 */
router.get('/:patientId/timeline', async (req, res) => {
  try {
    const { patientId } = req.params;

    const Encounter = require('../models/Encounter');
    const Vital = require('../models/Vital');
    const Document = require('../models/Document');
    const InvestigationOrder = require('../models/InvestigationOrder');
    const LabResult = require('../models/LabResult');
    const Referral = require('../models/Referral');
    const FollowUp = require('../models/FollowUp');

    let query = {};
    if (String(patientId).match(/^[0-9a-fA-F]{24}$/)) {
      query.patientId = patientId;
    }

    const [encounters, vitals, docs, orders, labResults, referrals, followups] = await Promise.all([
      Encounter.find(query).lean(),
      Vital.find(query).lean(),
      Document.find(query).lean(),
      InvestigationOrder.find(query).lean(),
      LabResult.find(query).lean(),
      Referral.find(query).lean(),
      FollowUp.find(query).lean()
    ]);

    const events = [];

    encounters.forEach(e => {
      events.push({
        id: `enc_${e._id}`,
        type: 'Visit',
        title: `OPD Consultation (${e.type || 'opd'})`,
        timestamp: e.openedAt || e.createdAt,
        details: e.structuredComplaint?.chiefComplaint || 'Consultation visit',
        status: e.status
      });
    });

    vitals.forEach(v => {
      events.push({
        id: `vit_${v._id}`,
        type: 'Vital',
        title: `Vitals Recorded (${v.source || 'Kiosk'})`,
        timestamp: v.capturedAt || v.createdAt,
        details: `BP: ${v.values?.systolicBP || '--'}/${v.values?.diastolicBP || '--'}, HR: ${v.values?.heartRate || '--'} bpm, SpO2: ${v.values?.spo2 || '--'}%`,
        status: 'recorded'
      });
    });

    docs.forEach(d => {
      events.push({
        id: `doc_${d._id}`,
        type: 'Document',
        title: d.title || `Document (${d.type})`,
        timestamp: d.uploadedAt || d.createdAt,
        details: `Verification: ${d.verificationStatus || 'pending'}`,
        fileUrl: d.originalFileUrl
      });
    });

    orders.forEach(o => {
      events.push({
        id: `ord_${o._id}`,
        type: 'Lab order',
        title: `Investigation Ordered: ${o.testName}`,
        timestamp: o.createdAt,
        details: `Priority: ${o.priority}, Status: ${o.status}`,
        status: o.status
      });
    });

    labResults.forEach(r => {
      events.push({
        id: `res_${r._id}`,
        type: 'Lab result',
        title: `Lab Result Verified: ${r.testName}`,
        timestamp: r.verifiedAt || r.createdAt,
        details: `Value: ${r.resultValue} ${r.unit || ''} (Ref: ${r.referenceRange || 'N/A'})`,
        status: r.verified ? 'verified' : 'unverified'
      });
    });

    referrals.forEach(ref => {
      events.push({
        id: `ref_${ref._id}`,
        type: 'Referral',
        title: `Clinical Referral (${ref.referralScope})`,
        timestamp: ref.createdAt,
        details: `Reason: ${ref.reason}, Priority: ${ref.priority}`,
        status: ref.status
      });
    });

    followups.forEach(f => {
      events.push({
        id: `fol_${f._id}`,
        type: 'Follow-up',
        title: `Follow-up Slot (${f.reason})`,
        timestamp: f.createdAt,
        details: `Window: ${f.scheduledWindow?.date || 'Pending'} (${f.scheduledWindow?.startTime || ''}-${f.scheduledWindow?.endTime || ''})`,
        status: f.status
      });
    });

    // Sort chronologically descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({
      status: 'success',
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching longitudinal timeline:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
