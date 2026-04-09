async function fetchPubChemData(medicineName) {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(medicineName)}/JSON`;
    const response = await fetch(url);
    if (response.ok) {
      return { 
        id: `PUBCHEM_${Math.floor(Math.random()*10000)}`,
        name: medicineName, 
        category: 'Allopathy (Verified via PubChem)', 
        usage: 'Chemical Compound',
        isVerified: true 
      };
    }
    return null;
  } catch (error) {
    console.error(`PubChem API Error for ${medicineName}:`, error.message);
    return null;
  }
}

module.exports = { fetchPubChemData };
