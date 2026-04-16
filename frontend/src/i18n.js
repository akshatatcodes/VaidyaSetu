import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationHI from './locales/hi/translation.json';
import translationMR from './locales/mr/translation.json';
import translationTA from './locales/ta/translation.json';
import translationTE from './locales/te/translation.json';
import translationBN from './locales/bn/translation.json';
import translationGU from './locales/gu/translation.json';
import translationKN from './locales/kn/translation.json';
import translationML from './locales/ml/translation.json';
import translationOR from './locales/or/translation.json';
import translationPA from './locales/pa/translation.json';
import translationAS from './locales/as/translation.json';
import translationUR from './locales/ur/translation.json';

const resources = {
  en: { translation: translationEN },
  hi: { translation: translationHI },
  mr: { translation: translationMR },
  ta: { translation: translationTA },
  te: { translation: translationTE },
  bn: { translation: translationBN },
  gu: { translation: translationGU },
  kn: { translation: translationKN },
  ml: { translation: translationML },
  or: { translation: translationOR },
  pa: { translation: translationPA },
  as: { translation: translationAS },
  ur: { translation: translationUR }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: Object.keys(resources),
    fallbackLng: 'en',
    load: 'languageOnly',
    returnEmptyString: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    }
  });

export default i18n;
