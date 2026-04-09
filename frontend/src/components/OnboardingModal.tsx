"use client";
import { useState } from "react";
import { Activity, Check } from "lucide-react";
import AutocompleteInput from "./AutocompleteInput";

const COMMON_CONDITIONS = [
  "Type 2 Diabetes", 
  "Hypertension", 
  "Thyroid Disorders (Hypothyroidism)", 
  "Asthma", 
  "PCOS",
  "Anemia"
];

export default function OnboardingModal({ clerkId, onComplete }: { clerkId: string, onComplete: (data: any) => void }) {
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [diseases, setDiseases] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleCondition = (condition: string) => {
    if (diseases.includes(condition)) {
      setDiseases(diseases.filter(d => d !== condition));
    } else {
      setDiseases([...diseases, condition]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch("http://localhost:5000/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clerkId, 
          age: Number(age), 
          height: Number(height), 
          weight: Number(weight), 
          diseases,
          onboardingComplete: true 
        })
      });
      if (!resp.ok) throw new Error("Failed to save profile on backend.");
      const data = await resp.json();
      if (data && data.status === "success") {
        onComplete(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-emerald-500/50 p-8 rounded-2xl w-full max-w-xl shadow-[0_0_40px_rgba(16,185,129,0.15)] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-full">
            <Activity className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white text-center mb-2">Build Your Baseline</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Please finalize your physical metrics and conditions to activate intelligent tracking.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
              <input required type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. 35" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Height (cm)</label>
              <input required type="number" min="50" max="300" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. 175" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Weight (kg)</label>
              <input required type="number" min="10" max="300" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. 70" />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Do you currently have any of these common conditions?</label>
            <div className="flex flex-wrap gap-3 mb-4">
              {COMMON_CONDITIONS.map(condition => {
                const isSelected = diseases.includes(condition);
                return (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleCondition(condition)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center transition-all ${
                      isSelected 
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 mr-2" />}
                    {condition}
                  </button>
                );
              })}
            </div>

            <label className="block text-sm font-medium text-gray-300 mb-2">Search for other conditions</label>
            <AutocompleteInput 
              placeholder="Search health conditions..."
              fetchUrl="http://localhost:5000/api/lists/diseases"
              iconColorClass="emerald-600"
              onAdd={(val) => {
                if (!diseases.includes(val)) setDiseases([...diseases, val]);
              }}
            />
            {diseases.length > 0 && (
              <div className="mt-2 text-sm text-emerald-400">
                Selected: {diseases.join(", ")}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
            {loading ? "Initializing Profile..." : "Activate Ecosystem"}
          </button>
        </form>
      </div>
    </div>
  );
}
