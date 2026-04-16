import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const EMERALD = [16, 185, 129];
const DARK = [3, 7, 18];
const GRAY = [100, 100, 100];
const RED = [239, 68, 68];

/**
 * Add branded header to a jsPDF document
 */
export function addHeader(doc, title, userName, subtitle) {
  // Brand bar
  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, 210, 4, 'F');

  doc.setFontSize(24);
  doc.setTextColor(...EMERALD);
  doc.text('VaidyaSetu', 20, 22);

  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text('AI-Powered Health Intelligence Platform', 20, 29);

  // Divider
  doc.setDrawColor(...EMERALD);
  doc.setLineWidth(0.5);
  doc.line(20, 33, 190, 33);

  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text(title, 20, 43);

  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(`Patient: ${userName || 'User'}`, 20, 50);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 56);
  if (subtitle) doc.text(subtitle, 20, 62);

  return subtitle ? 70 : 64;
}

/**
 * Add disclaimer footer to page
 */
export function addDisclaimer(doc) {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'DISCLAIMER: This report is AI-generated for informational purposes only. It is NOT a substitute for professional medical advice.',
    20, pageHeight - 12
  );
  doc.text(
    'Always consult your healthcare provider before making any medical decisions. \u00A9 VaidyaSetu Health Intelligence',
    20, pageHeight - 8
  );
}

/**
 * Add section heading
 */
export function addSection(doc, y, title) {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setTextColor(...EMERALD);
  doc.text(title, 20, y);
  doc.setDrawColor(220, 220, 220);
  doc.line(20, y + 2, 190, y + 2);
  return y + 10;
}

/**
 * Generate comprehensive Dashboard PDF (risk scores + mitigations)
 */
export function generateDashboardPDF(userName, report, profile, medications) {
  const doc = new jsPDF();
  let y = addHeader(doc, 'AI Health Risk Report', userName, 'Comprehensive Disease Risk Analysis with Mitigations');

  // Profile summary
  if (profile) {
    y = addSection(doc, y, 'Patient Profile');
    const profileData = [];
    if (profile.age?.value) profileData.push(['Age', `${profile.age.value} years`]);
    if (profile.gender?.value) profileData.push(['Gender', profile.gender.value]);
    if (profile.height?.value) profileData.push(['Height', `${profile.height.value} cm`]);
    if (profile.weight?.value) profileData.push(['Weight', `${profile.weight.value} kg`]);
    if (profile.diet?.value) profileData.push(['Diet', profile.diet.value]);
    if (profile.allergies?.value?.length) profileData.push(['Allergies', profile.allergies.value.join(', ')]);
    if (profile.medicalHistory?.value?.length) profileData.push(['Conditions', profile.medicalHistory.value.join(', ')]);

    if (profileData.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Parameter', 'Value']],
        body: profileData,
        headStyles: { fillColor: EMERALD },
        margin: { left: 20, right: 20 },
        theme: 'striped',
      });
      y = doc.lastAutoTable.finalY + 10;
    }
  }

  // Active medications
  if (medications?.length > 0) {
    y = addSection(doc, y, 'Active Medications');
    autoTable(doc, {
      startY: y,
      head: [['Medicine', 'Dosage', 'Frequency']],
      body: medications.map(m => [m.name, m.dosage, m.frequency]),
      headStyles: { fillColor: EMERALD },
      margin: { left: 20, right: 20 },
      theme: 'striped',
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Risk scores
  if (report?.risk_scores) {
    y = addSection(doc, y, 'AI Risk Scores');
    const riskData = Object.entries(report.risk_scores)
      .sort(([, a], [, b]) => b - a)
      .map(([disease, score]) => {
        const level = score > 60 ? 'HIGH' : score > 30 ? 'MODERATE' : 'LOW';
        return [disease.replace(/_/g, ' ').toUpperCase(), `${score}%`, level];
      });

    autoTable(doc, {
      startY: y,
      head: [['Disease', 'Risk Score', 'Risk Level']],
      body: riskData,
      headStyles: { fillColor: EMERALD },
      margin: { left: 20, right: 20 },
      theme: 'striped',
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          if (data.cell.raw === 'HIGH') data.cell.styles.textColor = RED;
          else if (data.cell.raw === 'MODERATE') data.cell.styles.textColor = [245, 158, 11];
          else data.cell.styles.textColor = EMERALD;
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // AI Summary
  if (report?.summary) {
    y = addSection(doc, y, 'AI Summary');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(report.summary, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 8;
  }

  // Mitigations
  if (report?.mitigations) {
    Object.entries(report.mitigations).forEach(([disease, mits]) => {
      if (y > 240) { doc.addPage(); y = 20; }
      y = addSection(doc, y, `Mitigations: ${disease.replace(/_/g, ' ').toUpperCase()}`);
      const mitData = [];
      if (mits.exercise?.length) mits.exercise.forEach(e => mitData.push(['Exercise', e]));
      if (mits.diet?.length) mits.diet.forEach(d => mitData.push(['Diet', d]));
      if (mits.lifestyle?.length) mits.lifestyle.forEach(l => mitData.push(['Lifestyle', l]));
      if (mits.precautions?.length) mits.precautions.forEach(p => mitData.push(['Precaution', p]));

      if (mitData.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Category', 'Recommendation']],
          body: mitData,
          headStyles: { fillColor: EMERALD },
          margin: { left: 20, right: 20 },
          theme: 'striped',
          columnStyles: { 1: { cellWidth: 130 } },
        });
        y = doc.lastAutoTable.finalY + 8;
      }
    });
  }

  addDisclaimer(doc);
  doc.save(`VaidyaSetu-Risk-Report-${Date.now()}.pdf`);
}

/**
 * Generate Vitals PDF with history + lab results
 */
/**
 * Generate Vitals PDF with current records and personalized mitigations
 * Shows only latest readings with mitigation steps (no backlog history)
 */
export function generateVitalsPDF(userName, currentVitals, formatValue, getStatus) {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Current Vitals Report', userName, 'Latest Readings with Personalized Mitigation Steps');

  // Current vitals with mitigations
  if (currentVitals && currentVitals.length > 0) {
    y = addSection(doc, y, 'Current Vital Readings');
    
    // Summary table
    const tableData = currentVitals.map(vital => {
      const value = typeof formatValue === 'function' 
        ? formatValue(vital.type, vital.value) 
        : String(vital.value || '--');
      
      // Use backend status if available, otherwise calculate from frontend
      let status = vital.status;
      if (!status) {
        status = typeof getStatus === 'function' 
          ? getStatus(vital.type, typeof vital.value === 'object' ? vital.value.systolic : vital.value) 
          : 'Normal';
      }
      
      // Capitalize first letter for display
      status = status.charAt(0).toUpperCase() + status.slice(1);
      
      return [
        vital.type.replace(/_/g, ' ').toUpperCase(),
        value,
        vital.unit || '',
        status,
        vital.normalRange || 'Consult doctor'
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Vital', 'Current Value', 'Unit', 'Status', 'Normal Range']],
      body: tableData,
      headStyles: { fillColor: EMERALD },
      margin: { left: 20, right: 20 },
      theme: 'striped',
      styles: { fontSize: 9 },
      didParseCell: (data) => {
        // Color-code the status column
        if (data.section === 'body' && data.column.index === 3) {
          const status = data.cell.raw.toLowerCase();
          if (status === 'high' || status === 'critical' || status === 'warning') {
            data.cell.styles.textColor = RED;
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'borderline') {
            data.cell.styles.textColor = [245, 158, 11]; // Amber
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'normal') {
            data.cell.styles.textColor = EMERALD;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;

    // Detailed mitigations for abnormal vitals
    const abnormalVitals = currentVitals.filter(v => {
      const status = (v.status || 'normal').toLowerCase();
      return status !== 'normal' && v.mitigations;
    });
    
    if (abnormalVitals.length > 0) {
      y = addSection(doc, y, 'Personalized Mitigation Steps');
      
      abnormalVitals.forEach((vital, idx) => {
        if (y > 230) { doc.addPage(); y = 20; }
        
        // Vital header
        doc.setFontSize(12);
        doc.setTextColor(...EMERALD);
        const vitalName = vital.type.replace(/_/g, ' ').toUpperCase();
        const currentValue = typeof formatValue === 'function' 
          ? formatValue(vital.type, vital.value) 
          : String(vital.value);
        doc.text(`${vitalName}: ${currentValue} (${vital.status.toUpperCase()})`, 20, y);
        y += 8;

        // Mitigations
        if (vital.mitigations) {
          // Immediate Actions
          if (vital.mitigations.immediateActions?.length > 0) {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(10);
            doc.setTextColor(...RED);
            doc.text('Immediate Actions:', 25, y);
            y += 6;
            doc.setFontSize(8);
            doc.setTextColor(...GRAY);
            vital.mitigations.immediateActions.forEach((action, i) => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.text(`${i + 1}. ${action}`, 30, y);
              y += 5;
            });
            y += 3;
          }

          // Lifestyle Changes
          if (vital.mitigations.lifestyleChanges?.length > 0) {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(10);
            doc.setTextColor(59, 130, 246); // Blue
            doc.text('Lifestyle Changes:', 25, y);
            y += 6;
            doc.setFontSize(8);
            doc.setTextColor(...GRAY);
            vital.mitigations.lifestyleChanges.forEach((change, i) => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.text(`${i + 1}. ${change}`, 30, y);
              y += 5;
            });
            y += 3;
          }

          // Dietary Advice
          if (vital.mitigations.dietaryAdvice?.length > 0) {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(10);
            doc.setTextColor(...EMERALD);
            doc.text('Dietary Advice:', 25, y);
            y += 6;
            doc.setFontSize(8);
            doc.setTextColor(...GRAY);
            vital.mitigations.dietaryAdvice.forEach((advice, i) => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.text(`${i + 1}. ${advice}`, 30, y);
              y += 5;
            });
            y += 3;
          }

          // Precautions
          if (vital.mitigations.precautions?.length > 0) {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(10);
            doc.setTextColor(245, 158, 11); // Amber
            doc.text('Precautions:', 25, y);
            y += 6;
            doc.setFontSize(8);
            doc.setTextColor(...GRAY);
            vital.mitigations.precautions.forEach((precaution, i) => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.text(`${i + 1}. ${precaution}`, 30, y);
              y += 5;
            });
            y += 3;
          }

          // When to see doctor
          if (vital.mitigations.whenToSeeDoctor) {
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFontSize(9);
            doc.setTextColor(147, 51, 234); // Purple
            doc.text(`When to See Doctor: ${vital.mitigations.whenToSeeDoctor}`, 25, y);
            y += 8;
          }
        }
        
        y += 5;
      });
    } else {
      // Check if there are ANY abnormal vitals (even without mitigations)
      const anyAbnormal = currentVitals.some(v => {
        const status = (v.status || 'normal').toLowerCase();
        return status !== 'normal';
      });
      
      if (!anyAbnormal) {
        // All vitals normal
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(...EMERALD);
        doc.text('All vitals are within normal range. Great job!', 20, y);
        y += 10;
        doc.setFontSize(9);
        doc.setTextColor(...GRAY);
        doc.text('Continue maintaining your healthy lifestyle and regular monitoring.', 20, y);
        y += 15;
      }
    }
  }

  // General precautions
  y = addSection(doc, y, 'General Health Precautions');
  const precautions = [
    'Monitor your vitals regularly as advised by your healthcare provider',
    'Report any unusual symptoms or readings to your doctor immediately',
    'Maintain a healthy diet, regular exercise, and adequate sleep',
    'Take prescribed medications on time and do not skip doses',
    'Stay hydrated and manage stress through relaxation techniques',
    'Keep all scheduled follow-up appointments with your healthcare team'
  ];
  
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  precautions.forEach((precaution, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`${i + 1}. ${precaution}`, 25, y);
    y += 5;
  });

  addDisclaimer(doc);
  doc.save(`VaidyaSetu_Vitals_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}


/**
 * Generate Settings full health archive PDF
 */
export function generateArchivePDF(userName, data) {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Complete Health Archive', userName, 'Full Data Export for Medical Review');

  // Profile section
  if (data.profile) {
    y = addSection(doc, y, 'Patient Profile');
    const p = data.profile;
    const rows = [];
    if (p.age?.value) rows.push(['Age', `${p.age.value}`]);
    if (p.gender?.value) rows.push(['Gender', p.gender.value]);
    if (p.height?.value) rows.push(['Height', `${p.height.value} cm`]);
    if (p.weight?.value) rows.push(['Weight', `${p.weight.value} kg`]);
    if (p.diet?.value) rows.push(['Diet', p.diet.value]);
    if (p.allergies?.value?.length) rows.push(['Allergies', p.allergies.value.join(', ')]);
    if (p.medicalHistory?.value?.length) rows.push(['Medical History', p.medicalHistory.value.join(', ')]);
    if (p.familyHistory?.value?.length) rows.push(['Family History', p.familyHistory.value.join(', ')]);

    if (rows.length) {
      autoTable(doc, {
        startY: y, head: [['Field', 'Value']], body: rows,
        headStyles: { fillColor: EMERALD }, margin: { left: 20, right: 20 }, theme: 'striped',
      });
      y = doc.lastAutoTable.finalY + 10;
    }
  }

  // Medications
  if (data.medications?.length > 0) {
    y = addSection(doc, y, 'Medications');
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Dosage', 'Frequency', 'Active']],
      body: data.medications.map(m => [m.name, m.dosage, m.frequency, m.active ? 'Yes' : 'No']),
      headStyles: { fillColor: EMERALD }, margin: { left: 20, right: 20 }, theme: 'striped',
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Vitals
  if (data.vitals?.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }
    y = addSection(doc, y, 'Vitals History');
    autoTable(doc, {
      startY: y,
      head: [['Type', 'Value', 'Unit', 'Date']],
      body: data.vitals.slice(0, 50).map(v => [
        v.type.replace(/_/g, ' '),
        v.type === 'blood_pressure' ? `${v.value?.systolic}/${v.value?.diastolic}` : String(v.value),
        v.unit,
        new Date(v.timestamp).toLocaleString()
      ]),
      headStyles: { fillColor: EMERALD }, margin: { left: 20, right: 20 }, theme: 'striped',
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Lab Results
  if (data.labResults?.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }
    y = addSection(doc, y, 'Lab Results');
    autoTable(doc, {
      startY: y,
      head: [['Test', 'Result', 'Unit', 'Reference', 'Date']],
      body: data.labResults.map(l => [l.testName, String(l.resultValue), l.unit, l.referenceRange || 'N/A', new Date(l.sampleDate).toLocaleDateString()]),
      headStyles: { fillColor: EMERALD }, margin: { left: 20, right: 20 }, theme: 'striped',
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // AI Report
  if (data.report) {
    if (y > 200) { doc.addPage(); y = 20; }
    y = addSection(doc, y, 'Latest AI Report');
    if (data.report.summary) {
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      const lines = doc.splitTextToSize(data.report.summary, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 8;
    }
    if (data.report.risk_scores) {
      const riskData = Object.entries(data.report.risk_scores).map(([d, s]) => [d.replace(/_/g, ' '), `${s}%`]);
      autoTable(doc, {
        startY: y, head: [['Disease', 'Risk']], body: riskData,
        headStyles: { fillColor: EMERALD }, margin: { left: 20, right: 20 }, theme: 'striped',
      });
      y = doc.lastAutoTable.finalY + 10;
    }
  }

  addDisclaimer(doc);
  doc.save(`VaidyaSetu-Health-Archive-${Date.now()}.pdf`);
}

// Helper: check if a lab result is in reference range
function checkInRange(lab) {
  if (!lab.referenceRange || typeof lab.resultValue !== 'number') return null;
  const range = lab.referenceRange.match(/([\d.]+)\s*[-\u2013]\s*([\d.]+)/);
  if (range) return lab.resultValue >= parseFloat(range[1]) && lab.resultValue <= parseFloat(range[2]);
  const lt = lab.referenceRange.match(/<\s*([\d.]+)/);
  if (lt) return lab.resultValue < parseFloat(lt[1]);
  const gt = lab.referenceRange.match(/>\s*([\d.]+)/);
  if (gt) return lab.resultValue > parseFloat(gt[1]);
  return null;
}
