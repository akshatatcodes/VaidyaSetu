const request = require('supertest');
const express = require('express');
const alertRoutes = require('../src/routes/alertRoutes');
const Alert = require('../src/models/Alert');

const app = express();
app.use(express.json());
app.use('/api/alerts', alertRoutes);

jest.mock('../src/models/Alert');

describe('Alerts Bridge API Validation (Step 88)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('POST /api/alerts - Should accept Critical Integration Flags', async () => {
        Alert.prototype.save = jest.fn().mockResolvedValue(true);

        const response = await request(app)
            .post('/api/alerts')
            .send({
                clerkId: 'user1',
                type: 'INTERACTION',
                priority: 'critical',
                title: 'High Risk',
                description: 'Severe contraindication',
                source: 'Safety Bridge'
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
    });

    test('PATCH /api/alerts/:id/read - Should mark an alert as read', async () => {
        Alert.findByIdAndUpdate.mockResolvedValue({ _id: 'fake_id', status: 'read' });

        const response = await request(app).patch('/api/alerts/fake_id/read');
        
        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('read');
    });

});
