import React, { useEffect } from 'react';
import { ShieldCheck, Volume2 } from 'lucide-react';

const COPY = {
  en: {
    title: 'Consent before we begin',
    body: 'We collect intake details only to help your doctor prepare. You can refuse document storage. ABHA is optional.',
    data: 'Allow clinical data capture for this visit',
    docs: 'Allow storing scanned documents for the doctor',
    share: 'Allow sharing this intake with the consulting physician',
    audio: 'Read consent aloud',
    continue: 'I agree — Continue',
    required: 'Data capture consent is required'
  },
  hi: {
    title: 'शुरू करने से पहले सहमति',
    body: 'हम केवल डॉक्टर की तैयारी के लिए जानकारी लेते हैं। दस्तावेज़ संग्रह अस्वीकार कर सकते हैं। ABHA वैकल्पिक है।',
    data: 'इस विज़िट के लिए क्लिनिकल डेटा कैप्चर की अनुमति',
    docs: 'स्कैन दस्तावेज़ डॉक्टर के लिए रखने की अनुमति',
    share: 'डॉक्टर के साथ शेयर करने की अनुमति',
    audio: 'सहमति सुनें',
    continue: 'मैं सहमत हूँ — आगे बढ़ें',
    required: 'डेटा कैप्चर सहमति आवश्यक है'
  }
};

export default function ConsentScreen({ lang = 'hi', value, onChange, onContinue, speakText }) {
  const t = COPY[lang] || COPY.en;
  const v = value || { dataCapture: false, documentStorage: false, doctorSharing: true, audioNarrated: false };

  useEffect(() => {
    if (v.audioNarrated && speakText) speakText(`${t.title}. ${t.body}`);
  }, [v.audioNarrated]);

  return (
    <div className="max-w-xl mx-auto p-6 rounded-3xl bg-slate-900/80 border border-teal-500/30 space-y-4">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-teal-400" />
        <h2 className="text-xl font-bold text-white">{t.title}</h2>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{t.body}</p>

      {[
        ['dataCapture', t.data],
        ['documentStorage', t.docs],
        ['doctorSharing', t.share]
      ].map(([key, label]) => (
        <label key={key} className="flex items-start gap-3 text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 accent-teal-500"
            checked={Boolean(v[key])}
            onChange={(e) => onChange({ ...v, [key]: e.target.checked })}
          />
          <span className="text-sm">{label}</span>
        </label>
      ))}

      <button
        type="button"
        className="flex items-center gap-2 text-teal-300 text-sm"
        onClick={() => onChange({ ...v, audioNarrated: true })}
      >
        <Volume2 className="w-4 h-4" /> {t.audio}
      </button>

      <button
        type="button"
        disabled={!v.dataCapture}
        onClick={onContinue}
        className="w-full py-3 rounded-2xl font-bold bg-teal-500 disabled:opacity-40 text-slate-950"
      >
        {v.dataCapture ? t.continue : t.required}
      </button>
    </div>
  );
}
