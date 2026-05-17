// src/pages/crm/opportunities.tsx
// Página de gestión de oportunidades

import React from 'react';
import { OpportunitiesBoard } from '@/components/crm/OpportunitiesBoard';

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Oportunidades</h1>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Nueva Oportunidad
        </button>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <OpportunitiesBoard />
      </div>
    </div>
  );
}
