// src/pages/crm/index.tsx
// Dashboard principal del CRM

import React from 'react';
import { TasksWidget } from '@/components/crm/TasksWidget';
import { OpportunitiesBoard } from '@/components/crm/OpportunitiesBoard';
import { useLeads, useOpportunities } from '@/hooks/useCRMData';

export default function CRMDashboard() {
  const { data: leads } = useLeads();
  const { data: opportunities } = useOpportunities();

  const newLeadsThisWeek = leads?.filter((l) => {
    const createdAt = new Date(l.created_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return createdAt > weekAgo;
  }).length || 0;

  const activeOpportunities = opportunities?.filter((o) => o.stage !== 'Close Won' && o.stage !== 'Close Lost').length || 0;
  const pipelineValue = opportunities?.reduce((sum, o) => sum + ((o.amount || 0) * ((o.probability || 0) / 100)), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-600">Total de Leads</p>
          <p className="mt-2 text-3xl font-bold">{leads?.length || 0}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-600">Nuevos esta semana</p>
          <p className="mt-2 text-3xl font-bold">{newLeadsThisWeek}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-600">Oportunidades Activas</p>
          <p className="mt-2 text-3xl font-bold">{activeOpportunities}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-600">Valor Pipeline</p>
          <p className="mt-2 text-3xl font-bold">€{(pipelineValue / 1000).toFixed(0)}K</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Tablero de Oportunidades</h2>
            <OpportunitiesBoard />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <TasksWidget />
        </div>
      </div>
    </div>
  );
}
