import React from 'react';
import Sidebar from '../components/Sidebar';

export default function LabLayout({ children }) {
  return (
    <div className="role-lab-workbench min-h-screen w-full relative">
      <Sidebar />
      <div className="md:ml-72 min-h-screen p-4 sm:p-6 transition-all">
        {children}
      </div>
    </div>
  );
}
