import { ShieldAlert } from "lucide-react";

export default function AlertsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
          <ShieldAlert className="w-10 h-10 mr-4 text-red-500" /> Safety Alerts Log
        </h1>
        <p className="text-gray-400 text-lg">A detailed centralized breakdown of all AI-flagged interaction warnings.</p>
      </header>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Alerts Inbox</h2>
        <p className="text-gray-400 max-w-lg">This page will act as a full-screen inbox specifically filtering severity level notifications and tracking historical conflict resolution.</p>
      </div>
    </div>
  );
}
