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
    let patient = null;
    if (String(patientId).match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ abhaId: patientId }) || await Patient.findOne({ 'basicInfo.contactNumber': patientId });
    }

    if (!patient) {
      return res.status(404).json({ status: 'not_found', message: 'Patient profile not found' });
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

module.exports = router;
