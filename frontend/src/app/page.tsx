import { Activity, HeartPulse, AlertTriangle, Pill } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 block">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome to your <span className="text-emerald-500">Health Dashboard</span>
          {user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-gray-400 text-lg">Here is an overview of your active vitals, medicines, and potential interaction risks.</p>
      </header>

      {!user ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <Activity className="w-16 h-16 text-emerald-500/50 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Sign in to view your health data</h2>
          <p className="text-gray-400 mb-8 max-w-md">Track your vitals, manage prescriptions, and receive AI-powered interaction alerts securely.</p>
          <SignInButton mode="modal"><button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors cursor-pointer">Get Started</button></SignInButton>
        </div>
      ) : (
        <>
          {/* Top Metrics Row - Empty States */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-400 font-medium">Health Score</h3>
                <div className="p-2 bg-gray-800 rounded-lg"><Activity className="text-gray-500 w-5 h-5" /></div>
              </div>
              <p className="text-4xl font-bold text-white">--<span className="text-xl text-gray-500">/100</span></p>
              <p className="text-sm text-gray-500 mt-2">Not enough data</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-400 font-medium">Active Medicines</h3>
                <div className="p-2 bg-gray-800 rounded-lg"><Pill className="text-gray-500 w-5 h-5" /></div>
              </div>
              <p className="text-4xl font-bold text-white">0</p>
              <p className="text-sm text-gray-500 mt-2">Upload prescriptions to track</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-400 font-medium">Predicted Risks</h3>
                <div className="p-2 bg-gray-800 rounded-lg"><HeartPulse className="text-gray-500 w-5 h-5" /></div>
              </div>
              <p className="text-4xl font-bold text-gray-500">None</p>
              <p className="text-sm text-gray-500 mt-2">No active risks detected</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-gray-400 font-medium">Interaction Alerts</h3>
                <div className="p-2 bg-gray-800 rounded-lg"><AlertTriangle className="text-gray-500 w-5 h-5" /></div>
              </div>
              <p className="text-4xl font-bold text-gray-500 relative z-10">0</p>
              <p className="text-sm text-gray-500 mt-2 relative z-10">No interactions to show</p>
            </div>
          </div>

          {/* Main Content Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-8 min-h-[400px] flex flex-col">
              <h2 className="text-xl font-bold text-white mb-6">Recent Vitals Timeline</h2>
              <div className="flex-1 border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                <Activity className="w-12 h-12 text-gray-800 mb-4" />
                <p>No vitals recorded yet.</p>
                <button className="mt-4 text-emerald-500 hover:text-emerald-400 text-sm font-medium cursor-pointer">
                  + Log Vitals
                </button>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col">
              <h2 className="text-xl font-bold text-white mb-6">Current Prescription</h2>
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-gray-800 rounded-xl bg-gray-800/20">
                  <Pill className="text-gray-700 w-10 h-10 mb-3" />
                  <p className="text-gray-400 text-sm">You haven&apos;t added any medicines.</p>
                </div>
                <button className="w-full py-3 mt-auto border border-dashed border-gray-700 text-gray-400 rounded-xl hover:text-white hover:border-gray-500 transition-colors cursor-pointer">
                  + Upload Prescription
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
