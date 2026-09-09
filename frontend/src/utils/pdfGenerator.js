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
 * NOTE (MediKiosk refactor):
 * `generateDashboardPDF` — which exported AI disease risk scores and per-disease
 * mitigation tables — was removed along with the rest of the wellness/risk product.
 * It had no remaining callers once the risk dashboard was replaced by the §3
 * patient home screen, and §15 forbids the system scoring or declaring disease.
 * Clinical PDF export is rebuilt in a later phase around Encounter → Diagnosis →
 * LabResult, using the §66 confidence states.
 */

/**
 * Generate Vitals PDF — latest readings only (no backlog history)
 */
export function generateVitalsPDF(userName, currentVitals, formatValue, getStatus) {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Current Vitals Report', userName, 'Latest Recorded Readings');

  // Current vitals
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

    // Flag abnormal readings for clinical attention. Per §15 an out-of-range
    // reading is a triage trigger — we list what needs review, we do not
    // prescribe self-care. (The old per-vital mitigation sections were removed
    // with the wellness module.)
    const abnormalVitals = currentVitals.filter(v => {
      const status = (v.status || 'normal').toLowerCase();
      return status !== 'normal';
    });

    if (abnormalVitals.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      y = addSection(doc, y, 'Readings Outside The Usual Range');

      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text('These readings need review by a clinician. They are not a diagnosis.', 20, y);
      y += 8;

      abnormalVitals.forEach((vital) => {
        if (y > 265) { doc.addPage(); y = 20; }
        const vitalName = vital.type.replace(/_/g, ' ').toUpperCase();
        const value = typeof formatValue === 'function'
          ? formatValue(vital.type, vital.value)
          : String(vital.value);
        doc.setFontSize(10);
        doc.setTextColor(...RED);
        doc.text(`${vitalName}: ${value} (${String(vital.status).toUpperCase()})`, 25, y);
        y += 6;
        if (vital.normalRange) {
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          doc.text(`Usual range: ${vital.normalRange}`, 30, y);
          y += 6;
        }
      });
      y += 4;
    } else {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setTextColor(...EMERALD);
      doc.text('All recorded vitals are within the usual range.', 20, y);
      y += 10;
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text('Keep monitoring as advised by your doctor.', 20, y);
      y += 15;
    }
  }

  // General precautions
  y = addSection(doc, y, 'General Health Precautions');
  const precautions = [
    'Monitor your vitals regularly as advised by your healthcare provider',
    'Report any unusual symptoms or readings to your doctor immediately',
    'Take prescribed medications on time and do not skip doses',
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

  // Clinical summary (the risk-score table that used to follow was removed \u2014
  // see the note above `generateVitalsPDF`).
  if (data.report?.summary) {
    if (y > 200) { doc.addPage(); y = 20; }
    y = addSection(doc, y, 'Clinical Summary');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(data.report.summary, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 8;
  }

  addDisclaimer(doc);
  doc.save(`VaidyaSetu-Health-Archive-${Date.now()}.pdf`);
}
