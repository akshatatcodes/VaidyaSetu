import { Activity, Heart } from "lucide-react";

export default function VitalsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
          <Activity className="w-10 h-10 mr-4 text-emerald-500" /> My Vitals
        </h1>
        <p className="text-gray-400 text-lg">Track your blood pressure, sugar levels, and historical health metrics.</p>
      </header>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
          <Heart className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Vitals Graph View</h2>
        <p className="text-gray-400 max-w-lg">Advanced charting via Chart.js will be placed here to visualize your heart rate and sugar levels securely logged into MongoDB over your lifetime.</p>
      </div>
    </div>
  );
}
