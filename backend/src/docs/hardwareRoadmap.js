/**
 * Hardware integration roadmap (SIH slide / architecture note)
 * Certified devices write into IntakeSession.vitals — not custom DIY sensors.
 *
 * USB / Bluetooth path (documented, not required for software-category demo):
 * 1. Certified BP monitor (e.g. Omron HEM series) → Web Bluetooth / vendor USB HID
 * 2. Pulse oximeter → SpO2 + heartRate fields
 * 3. Infrared thermometer → temperature
 * 4. Values validated against vitalRanges.js thresholds → red-flag escalation
 *
 * Regulatory: only CDSCO / BIS certified clinical devices; kiosk never invents
 * readings from phone cameras or uncertified DIY boards.
 */
module.exports = {
  supportedVitalsFields: [
    'systolicBP', 'diastolicBP', 'heartRate', 'spo2',
    'temperature', 'respiratoryRate', 'heightCm', 'weightKg', 'bmi'
  ],
  principle: 'certified_devices_only'
};
