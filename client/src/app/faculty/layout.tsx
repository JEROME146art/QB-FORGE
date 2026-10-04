'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState('FACULTY');

  useEffect(() => {
    const stored = localStorage.getItem('qpforge_user');
    if (stored) {
      try {
        setRole(JSON.parse(stored).role || 'FACULTY');
      } catch {
        /* ignore */
      }
    }
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 md:ml-64 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
