import React from 'react';
import {
  Thermometer, Heart, Wind, Bone, Eye, Ear, Brain, Activity, Baby, Droplets
} from 'lucide-react';

/** Icon-based chief-complaint picker — writes into the same field SOCRATES reads */
const SYMPTOMS = [
  { id: 'fever', label: { en: 'Fever', hi: 'बुखार', mr: 'ताप' }, icon: Thermometer, text: 'Fever' },
  { id: 'chest_pain', label: { en: 'Chest pain', hi: 'छाती दर्द', mr: 'छाती दुखणे' }, icon: Heart, text: 'Chest pain' },
  { id: 'breathless', label: { en: 'Breathlessness', hi: 'सांस फूलना', mr: 'दम लागणे' }, icon: Wind, text: 'Shortness of breath' },
  { id: 'joint', label: { en: 'Joint pain', hi: 'जोड़ों दर्द', mr: 'सांधेदुखी' }, icon: Bone, text: 'Joint pain' },
  { id: 'headache', label: { en: 'Headache', hi: 'सिरदर्द', mr: 'डोकेदुखी' }, icon: Brain, text: 'Headache' },
  { id: 'eye', label: { en: 'Eye problem', hi: 'आंख', mr: 'डोळे' }, icon: Eye, text: 'Eye problem' },
  { id: 'ear', label: { en: 'Ear / ENT', hi: 'कान', mr: 'कान' }, icon: Ear, text: 'Ear problem' },
  { id: 'stomach', label: { en: 'Stomach', hi: 'पेट दर्द', mr: 'पोटदुखी' }, icon: Activity, text: 'Abdominal pain' },
  { id: 'weakness', label: { en: 'Weakness', hi: 'कमजोरी', mr: 'अशक्तपणा' }, icon: Droplets, text: 'General weakness' },
  { id: 'child', label: { en: 'Child illness', hi: 'बाल रोग', mr: 'बालरोग' }, icon: Baby, text: 'Child illness' }
];

export default function SymptomIconPicker({ lang = 'hi', value, onSelect }) {
  const L = (item) => item.label[lang] || item.label.en;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4">
      {SYMPTOMS.map((s) => {
        const Icon = s.icon;
        const active = value && value.toLowerCase().includes(s.text.toLowerCase().split(' ')[0]);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.text)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
              active
                ? 'bg-teal-500/25 border-teal-400 text-teal-100'
                : 'bg-white/5 border-white/10 text-slate-200 hover:border-teal-500/40'
            }`}
          >
            <Icon className="w-7 h-7" />
            <span className="text-xs font-semibold text-center">{L(s)}</span>
          </button>
        );
      })}
    </div>
  );
}

export { SYMPTOMS };
