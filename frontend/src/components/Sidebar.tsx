import Link from 'next/link';
import { Home, FileText, Activity, ShieldAlert } from 'lucide-react';
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";


export default async function Sidebar() {
  const { userId } = await auth();
  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 bg-gray-900 border-r border-gray-800 text-gray-300 pointer-events-auto shrink-0 relative z-50">
      <div className="flex items-center justify-center mb-10">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Vaidya<span className="text-emerald-500">Setu</span>
        </h2>
      </div>

      <div className="flex flex-col justify-between flex-1">
        <nav className="space-y-2">
          <Link href="/" className="flex items-center px-4 py-3 text-emerald-400 bg-gray-800/50 rounded-xl transition-colors">
            <Home className="w-5 h-5 mr-3" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/prescriptions" className="flex items-center px-4 py-3 hover:text-emerald-400 hover:bg-gray-800/30 rounded-xl transition-colors">
            <FileText className="w-5 h-5 mr-3" />
            <span className="font-medium">Prescriptions</span>
          </Link>
          <Link href="/vitals" className="flex items-center px-4 py-3 hover:text-emerald-400 hover:bg-gray-800/30 rounded-xl transition-colors">
            <Activity className="w-5 h-5 mr-3" />
            <span className="font-medium">My Vitals</span>
          </Link>
          <Link href="/alerts" className="flex items-center px-4 py-3 hover:text-emerald-400 hover:bg-gray-800/30 rounded-xl transition-colors">
            <ShieldAlert className="w-5 h-5 mr-3" />
            <span className="font-medium">Safety Alerts</span>
          </Link>
        </nav>

        <div className="space-y-4">
          {userId ? (
            <div className="flex items-center px-4 py-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <UserButton 
                appearance={{ 
                  elements: { 
                    userButtonAvatarBox: "w-8 h-8", 
                    userButtonBox: "flex-row-reverse" 
                  } 
                }} 
                showName 
              />
            </div>
          ) : (
            <SignInButton mode="modal"><button className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors cursor-pointer">Sign In</button></SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}
