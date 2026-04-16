const Alert = require('../models/Alert');
const AlertPreference = require('../models/AlertPreference');

class AlertService {
  /**
   * Process a new vital reading and trigger alerts if thresholds are exceeded.
   */
  async processNewReading(vital) {
    try {
      const { clerkId, type, value } = vital;
      const prefs = await AlertPreference.findOne({ clerkId });
      
      if (!prefs || !prefs.customThresholds) return;

      const thresholds = prefs.customThresholds;
      let title = '';
      let description = '';
      let priority = 'medium';

      if (type === 'blood_pressure') {
        const { systolic, diastolic } = value;
        if (systolic > thresholds.systolicBP?.high) {
          title = 'Critical Blood Pressure (Systolic)';
          description = `Your systolic blood pressure reading of ${systolic} mmHg is above your high threshold.`;
          priority = 'critical';
        } else if (diastolic > thresholds.diastolicBP?.high) {
          title = 'Critical Blood Pressure (Diastolic)';
          description = `Your diastolic blood pressure reading of ${diastolic} mmHg is above your high threshold.`;
          priority = 'critical';
        }
      } else if (type === 'blood_glucose') {
        if (value > thresholds.fastingGlucose?.high) {
          title = 'High Blood Glucose';
          description = `Your glucose reading of ${value} mg/dL is above your target.`;
          priority = 'high';
        }
      } else if (type === 'heart_rate') {
        if (value > thresholds.heartRate?.high) {
          title = 'High Heart Rate';
          description = `Your heart rate of ${value} BPM is above your high threshold.`;
          priority = 'high';
        }
      }

      if (title) {
        await this.createAlert({
          clerkId,
          type: 'vital_out_of_range',
          priority,
          title,
          description,
          actionUrl: '/vitals',
          actionText: 'View Vitals'
        });
      }
    } catch (error) {
      console.error('Error processing vital alert:', error);
    }
  }

  /**
   * Trigger alert for high-severity drug interaction.
   */
  async triggerInteractionAlert(clerkId, findings) {
    try {
      // Find critical/high interactions
      const critical = findings.filter(f => f.severity === 'Major' || f.severity === 'Critical');
      
      for (const interaction of critical) {
        await this.createAlert({
          clerkId,
          type: 'interaction_detected',
          priority: 'critical',
          title: '🚨 Severe Interaction Detected',
          description: `Dangerous interaction between ${interaction.med1} and ${interaction.med2}. ${interaction.effect}`,
          actionUrl: '/prescriptions',
          actionText: 'View Safety Details'
        });
      }
    } catch (error) {
      console.error('Error triggering interaction alert:', error);
    }
  }

  /**
   * Generic alert creation.
   */
  async createAlert(alertData) {
    try {
      const alert = new Alert(alertData);
      return await alert.save();
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }
}

module.exports = new AlertService();
