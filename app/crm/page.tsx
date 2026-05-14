import React from 'react';
import { Dashboard } from '@/components/crm/Dashboard';

export const metadata = {
  title: 'CRM Dashboard | Grenoucerie',
  description: 'Manage your accounts, leads, and opportunities',
};

export default function CRMPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Dashboard />
      </div>
    </div>
  );
}
