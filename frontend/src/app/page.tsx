import { Activity } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import DashboardContent from "@/components/DashboardContent";

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
          <div className="mt-8 rounded-xl overflow-hidden shadow-lg border border-emerald-500/30">
            <div className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors cursor-pointer w-full text-center">
              <SignInButton mode="modal" fallbackRedirectUrl="/"><span>Get Started</span></SignInButton>
            </div>
          </div>
        </div>
      ) : (
        <>
          <DashboardContent />
        </>
      )}
    </div>
  );
}
