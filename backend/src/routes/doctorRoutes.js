const express = require('express');
const router = express.Router();
const axios = require('axios');
const SavedDoctor = require('../models/SavedDoctor');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// @route   GET /api/doctors/nearby
// @desc    Get nearby doctors based on disease and location
router.get('/nearby', async (req, res) => {
  try {
    const { diseaseId, lat, lng, radius, specialtyOverride } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'Latitude and Longitude are required' });
    }

    // Determine the specialty to search for
    let specialty = specialtyOverride;
    if (!specialty && diseaseId) {
      // Typically we'd fetch from DiseaseMetadata, but for speed we can map some common ones
      const diseaseToSpecialty = {
        'diabetes': 'Endocrinologist',
        'hypertension': 'Cardiologist',
        'heart_disease': 'Cardiologist',
        'ckd': 'Nephrologist',
        'pcos': 'Gynecologist',
        'thyroid': 'Endocrinologist',
        'asthma': 'Pulmonologist',
        'depression': 'Psychiatrist'
      };
      specialty = diseaseToSpecialty[diseaseId] || 'General Physician';
    }

    if (!GOOGLE_MAPS_API_KEY) {
      // Fallback/Mock behavior if no API key is provided
      console.warn('GOOGLE_MAPS_API_KEY missing - returning mock data');
      const mockDoctors = [
        {
          name: `Dr. Amit Sharma (${specialty})`,
          specialty,
          clinicName: 'Vaishnavi Clinic',
          address: '123 MG Road, Bengaluru',
          phone: '+91 9876543210',
          distance: '1.2 km',
          placeId: 'mock_place_1',
          rating: 4.5
        },
        {
          name: `Dr. Priya Singh`,
          specialty,
          clinicName: 'City Hospital',
          address: '456 Indiranagar, Bengaluru',
          phone: '+91 9123456789',
          distance: '2.5 km',
          placeId: 'mock_place_2',
          rating: 4.8
        }
      ];
      return res.json({ status: 'success', source: 'mock', data: mockDoctors });
    }

    // Real Google Places API Call
    const searchText = `${specialty} in this area`;
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: searchText,
        location: `${lat},${lng}`,
        radius: radius || 5000,
        type: 'doctor|hospital|health',
        key: GOOGLE_MAPS_API_KEY
      }
    });

    const doctors = response.data.results.map(place => ({
      name: place.name,
      specialty: specialty,
      clinicName: place.name,
      address: place.formatted_address,
      phone: 'N/A', // Text search doesn't always return phone, need Place Details for more
      distance: 'Live Distance Calculated',
      placeId: place.place_id,
      rating: place.rating
    }));

    res.json({
      status: 'success',
      source: 'google_places',
      data: doctors
    });

  } catch (error) {
    console.error('Nearby doctors error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   POST /api/doctors/save
// @desc    Save doctor to user profile
router.post('/save', async (req, res) => {
  try {
    const { clerkId, doctor } = req.body;

    if (!clerkId || !doctor) {
      return res.status(400).json({ status: 'error', message: 'clerkId and doctor object are required' });
    }

    const newSavedDoctor = new SavedDoctor({
      clerkId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      clinicName: doctor.clinicName,
      address: doctor.address,
      phone: doctor.phone,
      placeId: doctor.placeId,
      notes: doctor.notes || ''
    });

    await newSavedDoctor.save();

    res.json({
      status: 'success',
      message: 'Doctor saved successfully',
      data: newSavedDoctor
    });
  } catch (error) {
    console.error('Save doctor error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
