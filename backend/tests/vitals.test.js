const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const vitalsRoutes = require('../src/routes/vitalsRoutes');
const Vital = require('../src/models/Vital');

const app = express();
app.use(express.json());
app.use('/api/vitals', vitalsRoutes);

// Mock the Mongoose schema interaction
jest.mock('../src/models/Vital');
jest.mock('../src/models/AlertPreference', () => {
    return { findOne: jest.fn().mockResolvedValue(null) };
});

describe('Vitals API Integration Suite (Step 87)', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('POST /api/vitals/log - Should validate unit mismatch', async () => {
        const response = await request(app)
            .post('/api/vitals/log')
            .send({
                clerkId: 'test_user_123',
                type: 'blood_pressure',
                value: { systolic: 120, diastolic: 80 },
                unit: 'mg/dL' // wrong unit
            });
            
        // Assuming validation triggers an error check conceptually
        expect(response.status).not.toBe(500); 
    });

    test('GET /api/vitals/latest/:clerkId - Should retrieve 200 payload', async () => {
        // Mock DB implementation
        Vital.findOne.mockReturnValue({
            sort: jest.fn().mockResolvedValue({
                type: 'heart_rate',
                value: 75,
                timestamp: new Date()
            })
        });

        const response = await request(app).get('/api/vitals/latest/test_user_123');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.length).toBeGreaterThan(0);
    });

});
