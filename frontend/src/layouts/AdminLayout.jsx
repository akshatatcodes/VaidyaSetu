import React from 'react';
import Sidebar from '../components/Sidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="role-admin-console min-h-screen w-full relative">
      <Sidebar />
      <div className="md:ml-72 min-h-screen p-4 sm:p-6 md:p-8 transition-all">
        {children}
      </div>
    </div>
  );
}
