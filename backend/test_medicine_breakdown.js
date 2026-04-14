require('dotenv').config();
const { generateMedicineBreakdown } = require('./src/services/medicineInfoService');

async function testMedicineBreakdown() {
  const testMedicines = ['Amdocal', 'Paricel', 'Eltroxin', 'Vare'];
  
  console.log('Testing medicine breakdown with real API data...\n');
  console.log('Medicines:', testMedicines.join(', '));
  console.log('\n' + '='.repeat(80) + '\n');
  
  try {
    const result = await generateMedicineBreakdown(testMedicines, 'English');
    
    console.log('SUCCESS! Result:\n');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if composition data is present
    if (result.medicines && result.medicines.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('VERIFICATION:');
      console.log('='.repeat(80));
      
      result.medicines.forEach((med, idx) => {
        console.log(`\n${idx + 1}. ${med.name}`);
        console.log(`   Composition: ${med.composition}`);
        console.log(`   Dosage: ${med.dosage}`);
        
        if (med.composition === 'Information not available' || 
            med.composition === 'Not found in RxNav database') {
          console.log('   ⚠️  WARNING: Composition data not found');
        } else {
          console.log('   ✓ Composition data retrieved successfully');
        }
      });
    }
  } catch (error) {
    console.error('Error testing medicine breakdown:', error.message);
    console.error(error.stack);
  }
}

testMedicineBreakdown();
