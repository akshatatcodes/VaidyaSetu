import React from 'react';
import Sidebar from '../components/Sidebar';

export default function PatientLayout({ children }) {
  return (
    <div className="role-patient-container min-h-screen w-full relative">
      <Sidebar />
      <div className="md:ml-72 min-h-screen p-4 sm:p-6 md:p-10 transition-all">
        {children}
      </div>
    </div>
  );
}
