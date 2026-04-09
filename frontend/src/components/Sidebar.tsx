import Link from 'next/link';
import { Home, FileText, Activity, ShieldAlert, Settings } from 'lucide-react';
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Sidebar() {
  const { userId } = await auth();
  return (
    <div className="flex flex-col w-full md:w-64 h-auto md:h-screen sticky top-0 px-4 py-4 md:py-8 bg-gray-900 border-b md:border-r border-gray-800 text-gray-300 shrink-0 z-50">
      <div className="flex items-center justify-between md:justify-center mb-4 md:mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Vaidya<span className="text-emerald-500">Setu</span>
        </h2>
        
        {/* Mobile Header Auth Controls */}
        <div className="block md:hidden">
          {userId ? (
            <div className="flex items-center space-x-4">
              <Link href="/settings" className="text-gray-400 hover:text-emerald-500 transition-colors" title="Profile Settings">
                <Settings className="w-5 h-5" />
              </Link>
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
            </div>
          ) : (
             <div className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer text-center">
              <SignInButton mode="modal" fallbackRedirectUrl="/">Sign In</SignInButton>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between flex-1 overflow-hidden">
        {/* Navigation Layer */}
        <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 space-y-0 md:space-y-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
          <Link href="/" className="flex whitespace-nowrap items-center px-4 py-2 md:py-3 text-emerald-400 bg-gray-800/50 rounded-xl transition-colors">
            <Home className="w-4 md:w-5 h-4 md:h-5 mr-2 md:mr-3" />
            <span className="font-medium text-sm md:text-base">Dashboard</span>
          </Link>
          <Link href="/prescriptions" className="flex whitespace-nowrap items-center px-4 py-2 md:py-3 hover:text-emerald-400 hover:bg-gray-800/30 rounded-xl transition-colors">
            <FileText className="w-4 md:w-5 h-4 md:h-5 mr-2 md:mr-3" />
            <span className="font-medium text-sm md:text-base">Prescriptions</span>
          </Link>
          <Link href="/vitals" className="flex whitespace-nowrap items-center px-4 py-2 md:py-3 hover:text-emerald-400 hover:bg-gray-800/30 rounded-xl transition-colors">
            <Activity className="w-4 md:w-5 h-4 md:h-5 mr-2 md:mr-3" />
            <span className="font-medium text-sm md:text-base">My Vitals</span>
          </Link>
          <Link href="/alerts" className="flex whitespace-nowrap items-center px-4 py-2 md:py-3 hover:text-emerald-400 hover:bg-gray-800/30 rounded-xl transition-colors">
            <ShieldAlert className="w-4 md:w-5 h-4 md:h-5 mr-2 md:mr-3" />
            <span className="font-medium text-sm md:text-base">Safety Alerts</span>
          </Link>
        </nav>

        {/* Desktop Footer Auth Controls */}
        <div className="hidden md:block space-y-4 pt-6 mt-auto">
          {userId ? (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <UserButton 
                appearance={{ 
                  elements: { 
                    userButtonAvatarBox: "w-8 h-8", 
                    userButtonBox: "flex-row-reverse" 
                  } 
                }} 
                showName 
              />
              <Link href="/settings" className="text-gray-400 hover:text-emerald-500 transition-colors" title="Profile Settings">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors cursor-pointer text-center">
              <SignInButton mode="modal" fallbackRedirectUrl="/">Sign In</SignInButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
