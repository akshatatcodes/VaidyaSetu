require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testLisinoprilTulsi() {
  const medicines = ['Lisinopril', 'Tulsi'];
  
  console.log('='.repeat(80));
  console.log('TESTING: Lisinopril + Tulsi Interaction');
  console.log('='.repeat(80));
  console.log('\n⚠️  REAL DATA FROM DATABASE:');
  console.log('   Severity: MODERATE');
  console.log('   Effect: Additive Hypotension (Excessive drop in blood pressure)');
  console.log('   Mechanism: Tulsi has mild ACE-inhibitor like properties.');
  console.log('              Combined with Lisinopril, it can cause dizziness and fainting.');
  console.log('   Recommendation: Monitor blood pressure regularly.');
  console.log('                   Avoid large quantities of Tulsi extracts.');
  console.log('   Source: IMPPAT / DrugBank / AYUSH');
  console.log('\n' + '='.repeat(80));
  
  try {
    // Test 1: Safety Bridge (RAG System)
    console.log('\n1️⃣  TESTING SAFETY BRIDGE (RAG System)...');
    console.log('-'.repeat(80));
    
    const safetyRes = await axios.post(`${API_URL}/rag/check-safety`, {
      medicines: medicines,
      language: 'English'
    });
    
    console.log('\n✅ SAFETY BRIDGE RESPONSE:');
    console.log('Status:', safetyRes.data.status);
    
    const report = safetyRes.data.report;
    if (report) {
      console.log('Has Interaction:', report.hasInteraction);
      console.log('Severity:', report.severity);
      console.log('Summary:', report.summary?.substring(0, 200));
      console.log('\nInteractions Found:', report.interactions?.length || 0);
      
      if (report.interactions && report.interactions.length > 0) {
        console.log('\n⚠️  Interactions from Safety Bridge:');
        report.interactions.forEach((interaction, idx) => {
          console.log(`\n${idx + 1}. Drug A: ${interaction.drugA || 'N/A'}`);
          console.log(`   Drug B: ${interaction.drugB || 'N/A'}`);
          console.log('   Severity:', interaction.severity);
          console.log('   Description:', interaction.description?.substring(0, 200));
          console.log('   Source:', interaction.source);
        });
      }
      
      console.log('\n📚 Evidence Sources:', safetyRes.data.debug?.evidenceCount || 0);
      console.log('Model Used:', safetyRes.data.modelUsed);
      console.log('Is Fallback:', safetyRes.data.isFallback);
      console.log('Latency:', safetyRes.data.debug?.latency, 'ms');
    } else {
      console.log('⚠️  No report data found');
      console.log('Full response:', JSON.stringify(safetyRes.data, null, 2).substring(0, 500));
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Test 2: Medicine Breakdown API
    console.log('\n2️⃣  TESTING MEDICINE BREAKDOWN API...');
    console.log('-'.repeat(80));
    
    const breakdownRes = await axios.post(`${API_URL}/rag/medicine-breakdown`, {
      medicines: medicines,
      language: 'English'
    });
    
    console.log('\n✅ MEDICINE BREAKDOWN RESPONSE:');
    console.log('Status:', breakdownRes.data.status);
    
    if (breakdownRes.data.data && breakdownRes.data.data.safetyAnalysis) {
      const analysis = breakdownRes.data.data.safetyAnalysis;
      console.log('Overall Risk:', analysis.overallRisk);
      console.log('Summary:', analysis.summary?.substring(0, 200));
      console.log('\nInteractions Found:', analysis.interactions?.length || 0);
      
      if (analysis.interactions && analysis.interactions.length > 0) {
        console.log('\n⚠️  Interactions Detected:');
        analysis.interactions.forEach((interaction, idx) => {
          console.log(`\n${idx + 1}. ${interaction.medicine1} + ${interaction.medicine2}`);
          console.log('   Severity:', interaction.severity);
          console.log('   Description:', interaction.description?.substring(0, 200));
        });
      } else {
        console.log('\n❌ NO interactions detected by Medicine Breakdown API');
      }
      
      if (analysis.alternatives && analysis.alternatives.length > 0) {
        console.log('\n💡 Suggested Alternatives:');
        analysis.alternatives.slice(0, 2).forEach((alt, idx) => {
          console.log(`\n${idx + 1}. ${alt.originalMedicine} → ${alt.alternative}`);
          console.log('   Type:', alt.type);
          console.log('   Reason:', alt.reason?.substring(0, 150));
        });
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPARISON & VERDICT');
    console.log('='.repeat(80));
    
    console.log('\n🔍 REAL DATABASE DATA:');
    console.log('   ✓ Interaction EXISTS (MODERATE severity)');
    console.log('   ✓ Effect: Additive Hypotension');
    console.log('   ✓ Risk: Dizziness and fainting');
    
    console.log('\n🤖 SAFETY BRIDGE (RAG):');
    if (report && (report.status === 'CAUTION' || report.status === 'DANGEROUS' || report.total_risks_found > 0)) {
      console.log('   ✅ CORRECTLY detected the interaction');
      console.log('   Status:', report.status);
      console.log('   Risks Found:', report.total_risks_found);
      if (report.interactions && report.interactions.length > 0) {
        console.log('   Interactions:', report.interactions.length);
        report.interactions.forEach((inter, idx) => {
          console.log(`   ${idx + 1}. ${inter.medicines_involved?.join(' + ')}`);
          console.log(`      Severity: ${inter.severity}`);
          console.log(`      Source: ${inter.source_citation || 'N/A'}`);
        });
      }
    } else {
      console.log('   ❌ FAILED to detect the interaction');
      console.log('   ⚠️  Shows "Clinical Synergy Cleared" but interaction EXISTS in database');
      console.log('   Report:', JSON.stringify(report, null, 2).substring(0, 300));
    }
    
    console.log('\n💊 MEDICINE BREAKDOWN:');
    if (breakdownRes.data.data?.safetyAnalysis?.interactions?.length > 0) {
      console.log('   ✅ Detected interactions via AI analysis');
    } else {
      console.log('   ❌ No interactions detected');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 RECOMMENDATION:');
    console.log('='.repeat(80));
    console.log('\nFor Lisinopril + Tulsi:');
    console.log('• This is a REAL interaction (MODERATE severity)');
    console.log('• Tulsi has ACE-inhibitor properties (like Lisinopril)');
    console.log('• Combined use can cause EXCESSIVE blood pressure drop');
    console.log('• Patient should monitor BP regularly');
    console.log('• Avoid large quantities of Tulsi extracts');
    console.log('\nIf Safety Bridge shows "Cleared" but database shows interaction,');
    console.log('there may be an issue with the RAG retrieval or prompt.');
    
  } catch (error) {
    console.error('\n❌ Error testing APIs:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testLisinoprilTulsi();
