import React from 'react';

export default function KioskLayout({ children }) {
  return (
    <div className="role-kiosk-touch-target min-h-screen w-full relative bg-slate-950 text-white overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
      {children}
    </div>
  );
}
