const Fuse = require('fuse.js');
const interactionsData = require('../data/interactions.json');

/**
 * Creates a unique flat list of all medicine names/aliases for fuzzy matching
 */
const prepareSearchIndex = () => {
    const names = new Set();
    interactionsData.interactions.forEach(item => {
        if (item.allopathy_drug) names.add(item.allopathy_drug);
        if (item.allopathy_aliases) item.allopathy_aliases.forEach(a => names.add(a));
        if (item.ayurveda_herb) item.ayurveda_herb.forEach(h => names.add(h));
        if (item.homeopathy_remedy) item.homeopathy_remedy.forEach(r => names.add(r));
    });
    return Array.from(names).map(name => ({ name }));
};

const searchIndex = prepareSearchIndex();
const fuse = new Fuse(searchIndex, {
    keys: ['name'],
    threshold: 0.3,
});

/**
 * Matches user input strings against the master medicine list
 */
const matchMedicines = (inputs) => {
    return inputs.map(input => {
        const results = fuse.search(input.trim());
        if (results.length > 0) {
            return {
                original: input,
                matched: results[0].item.name,
                score: results[0].score,
                isMatch: results[0].score < 0.3
            };
        }
        return { original: input, matched: null, isMatch: false };
    });
};

/**
 * Checks a list of confirmed medicines for interactions
 */
const checkInteractions = (confirmedList) => {
    const list = confirmedList.map(m => m.toLowerCase());
    const findings = [];

    interactionsData.interactions.forEach(inter => {
        const alloNameData = [inter.allopathy_drug, ...(inter.allopathy_aliases || [])];
        const ayuNameData = inter.ayurveda_herb || [];
        const homeoNameData = inter.homeopathy_remedy || [];

        const hasAllo = alloNameData.some(name => list.includes(name.toLowerCase()));
        const hasAyu = ayuNameData.some(name => list.includes(name.toLowerCase()));
        const hasHomeo = homeoNameData.some(name => list.includes(name.toLowerCase()));

        // Intersection logic: Allopathy + (Ayurveda OR Homeopathy)
        if (hasAllo && (hasAyu || hasHomeo)) {
            findings.push(inter);
        }
    });

    return findings;
};

module.exports = {
    matchMedicines,
    checkInteractions
};
