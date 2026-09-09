/**
 * Clinical Knowledge Ontology Layer (§43)
 * Static, versioned mapping of chief complaints to required clinical attributes and red-flag triggers.
 * Governs the LLM adaptive questioning engine — prevents hallucinating or inventing new required questions.
 */

const CLINICAL_ONTOLOGY = {
  version: '1.0.0',
  updatedAt: '2026-09-10',

  complaints: {
    chest_pain: {
      id: 'chest_pain',
      name: 'Chest Pain / Pressure',
      bodyRegion: 'Chest',
      requiredAttributes: ['site', 'onset', 'character', 'radiation', 'severity'],
      redFlagTriggers: [
        { condition: 'radiation_left_arm', text: 'Pain radiating to left arm/jaw', severity: 'critical' },
        { condition: 'diaphoresis', text: 'Profuse sweating / cold clammy skin', severity: 'critical' },
        { condition: 'dyspnea', text: 'Severe shortness of breath', severity: 'critical' }
      ],
      mode1Questions: ['site', 'onset', 'character', 'radiation', 'severity'],
      mode2AyushQuestions: ['prakriti', 'agni', 'koshtha', 'ahara_impact']
    },

    knee_pain: {
      id: 'knee_pain',
      name: 'Knee Pain / Joint Stiffness',
      bodyRegion: 'Lower Limb',
      requiredAttributes: ['site', 'onset', 'character', 'severity'],
      redFlagTriggers: [
        { condition: 'inability_to_bear_weight', text: 'Complete inability to bear weight', severity: 'high' },
        { condition: 'fever_with_swelling', text: 'Hot, swollen joint with systemic fever', severity: 'critical' }
      ],
      mode1Questions: ['site', 'onset', 'character', 'severity'],
      mode2AyushQuestions: ['sandhi_shoola', 'sandhi_shotha', 'vihara_habit']
    },

    fever: {
      id: 'fever',
      name: 'Fever / Chills',
      bodyRegion: 'General / Whole Body',
      requiredAttributes: ['onset', 'pattern', 'associated_symptoms', 'severity'],
      redFlagTriggers: [
        { condition: 'altered_sensorium', text: 'Confusion or altered consciousness', severity: 'critical' },
        { condition: 'stiff_neck', text: 'Neck stiffness or photophobia', severity: 'critical' }
      ],
      mode1Questions: ['onset', 'pattern', 'associated_symptoms', 'severity'],
      mode2AyushQuestions: ['jwara_type', 'agni', 'koshtha']
    },

    headache: {
      id: 'headache',
      name: 'Headache / Migraine',
      bodyRegion: 'Head & Neck',
      requiredAttributes: ['site', 'onset', 'character', 'severity'],
      redFlagTriggers: [
        { condition: 'sudden_thunderclap', text: 'Sudden onset "thunderclap" headache', severity: 'critical' },
        { condition: 'focal_deficit', text: 'Facial drooping or slurred speech', severity: 'critical' }
      ],
      mode1Questions: ['site', 'onset', 'character', 'severity'],
      mode2AyushQuestions: ['shiro_shoola', 'prakriti', 'sleep_pattern']
    },

    abdominal_pain: {
      id: 'abdominal_pain',
      name: 'Abdominal Pain / Stomach Ache',
      bodyRegion: 'Abdomen',
      requiredAttributes: ['site', 'onset', 'character', 'severity'],
      redFlagTriggers: [
        { condition: 'board_like_rigidity', text: 'Severe abdominal rigidity / guarding', severity: 'critical' },
        { condition: 'hematemesis', text: 'Vomiting blood or coffee-ground material', severity: 'critical' }
      ],
      mode1Questions: ['site', 'onset', 'character', 'severity'],
      mode2AyushQuestions: ['agni', 'koshtha', 'ahara']
    }
  },

  // Fallback required attributes for unclassified complaints
  defaultRequiredAttributes: ['site', 'onset', 'character', 'severity']
};

module.exports = CLINICAL_ONTOLOGY;
