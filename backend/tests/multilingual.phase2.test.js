const {
  LOCALES,
  QUESTION_TEMPLATES,
  COMPLETION_MESSAGES
} = require('../src/data/socratesQuestionTemplates');
const {
  processAdaptiveProbe
} = require('../src/services/adaptiveSocratesService');

describe('Phase 2 — Multilingual Completion & Safe Fallbacks', () => {
  test('all 13 locales present for all 8 SOCRATES question steps', () => {
    const steps = ['site', 'onset', 'character', 'radiation', 'associations', 'timeCourse', 'exacerbatingRelieving', 'severity'];
    expect(LOCALES.length).toBe(13);

    for (const step of steps) {
      expect(QUESTION_TEMPLATES[step]).toBeDefined();
      for (const lang of LOCALES) {
        expect(QUESTION_TEMPLATES[step][lang]).toBeTruthy();
      }
    }
  });

  test('COMPLETION_MESSAGES defined for all 13 locales', () => {
    for (const lang of LOCALES) {
      expect(COMPLETION_MESSAGES[lang]).toBeTruthy();
    }
  });

  test('resolveLang resolves full language names to 2-letter codes', async () => {
    const resMarathi = await processAdaptiveProbe({
      chiefComplaint: 'fever',
      userSpeech: 'head',
      currentStep: 'site',
      language: 'Marathi'
    });
    expect(resMarathi.nextQuestion).toContain('त्रास');

    const resTelugu = await processAdaptiveProbe({
      chiefComplaint: 'fever',
      userSpeech: 'head',
      currentStep: 'site',
      language: 'te-IN'
    });
    expect(resTelugu.nextQuestion).toContain('సమస్య');
  });

  test('unrecognized language falls back safely to English without error', async () => {
    const resFallback = await processAdaptiveProbe({
      chiefComplaint: 'fever',
      userSpeech: 'head',
      currentStep: 'site',
      language: 'fr-FR'
    });
    expect(resFallback.nextQuestion).toBe(QUESTION_TEMPLATES.onset.en);
  });
});
