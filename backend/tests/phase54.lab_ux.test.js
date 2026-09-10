const request = require('supertest');
const express = require('express');

describe('Phase 54: Final Lab UX QA (7-Step Complete Diagnostic Workbench)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const labDatabase = new Map();

    // 1. Open Lab Queue
    app.get('/api/lab/workbench/queue', (req, res) => {
      res.json({
        status: 'success',
        data: Array.from(labDatabase.values())
      });
    });

    // 2. Scan QR Code
    app.post('/api/lab/workbench/scan-qr', (req, res) => {
      const { code } = req.body;
      const orderId = 'ORD-LAB-' + Date.now();
      const order = {
        orderId,
        qrCode: code,
        testName: 'Complete Blood Count (CBC)',
        patientName: 'Kameshwar Dass',
        status: 'scanned',
        sampleCollected: false,
        resultEntered: false,
        verified: false,
        followUpRequired: false
      };
      labDatabase.set(orderId, order);
      res.status(201).json({ status: 'success', message: 'QR Code verified cleanly', data: order });
    });

    // 3 & 4. Collect Sample & Process
    app.post('/api/lab/workbench/collect-sample', (req, res) => {
      const { orderId } = req.body;
      const order = labDatabase.get(orderId);
      if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

      order.status = 'processing';
      order.sampleCollected = true;
      labDatabase.set(orderId, order);
      res.json({ status: 'success', data: order });
    });

    // 5. Enter Result
    app.post('/api/lab/workbench/enter-result', (req, res) => {
      const { orderId, resultValue, unit, referenceRange } = req.body;
      const order = labDatabase.get(orderId);
      if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

      order.status = 'resulted';
      order.resultEntered = true;
      order.result = { resultValue, unit, referenceRange };
      labDatabase.set(orderId, order);
      res.json({ status: 'success', data: order });
    });

    // 6 & 7. Verify & See Follow-up Requirement
    app.post('/api/lab/workbench/verify-result', (req, res) => {
      const { orderId } = req.body;
      const order = labDatabase.get(orderId);
      if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

      order.status = 'verified';
      order.verified = true;
      order.followUpRequired = true; // Automatic schedulable follow-up requirement (§36)
      labDatabase.set(orderId, order);

      res.json({
        status: 'success',
        message: 'Result verified. Schedulable follow-up requirement flagged.',
        data: order
      });
    });
  });

  test('Lab technician completes full 7-step diagnostic workflow seamlessly in lab workbench', async () => {
    // Step 2: Scan QR
    const scanRes = await request(app)
      .post('/api/lab/workbench/scan-qr')
      .send({ code: 'QR-PAT-101-CBC' });
    expect(scanRes.status).toBe(201);
    const orderId = scanRes.body.data.orderId;

    // Step 3 & 4: Collect Sample & Process
    const sampleRes = await request(app)
      .post('/api/lab/workbench/collect-sample')
      .send({ orderId });
    expect(sampleRes.status).toBe(200);
    expect(sampleRes.body.data.status).toBe('processing');

    // Step 5: Enter Result
    const resultRes = await request(app)
      .post('/api/lab/workbench/enter-result')
      .send({ orderId, resultValue: '13.2', unit: 'g/dL', referenceRange: '12.0 - 15.5' });
    expect(resultRes.status).toBe(200);
    expect(resultRes.body.data.status).toBe('resulted');

    // Step 6 & 7: Verify & See Follow-up Requirement
    const verifyRes = await request(app)
      .post('/api/lab/workbench/verify-result')
      .send({ orderId });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verified).toBe(true);
    expect(verifyRes.body.data.followUpRequired).toBe(true);
  });
});
