// src/pages/crm/leads.tsx
// Página de gestión de leads

import React, { useState } from 'react';
import { useLeads, useCreateLead } from '@/hooks/useCRMData';
import { LeadForm } from '@/components/crm/LeadForm';
import { LeadScore } from '@/components/crm/LeadScore';
import { LEAD_STATUS } from '@/lib/crm/constants';
import { useCRMStore, useFilteredLeads } from '@/store/crm-store';

export default function LeadsPage() {
  const { data: leads, isLoading } = useLeads();
  const createLeadMutation = useCreateLead();
  const { setShowLeadModal, showLeadModal } = useCRMStore();
  const filteredLeads = useFilteredLeads(leads || []);

  const handleCreateLead = async (formData: any) => {
    await createLeadMutation.mutateAsync(formData);
    setShowLeadModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <button
          onClick={() => setShowLeadModal(!showLeadModal)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Nuevo Lead
        </button>
      </div>

      {showLeadModal && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Crear Lead</h2>
          <LeadForm onSubmit={handleCreateLead} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {Object.entries(LEAD_STATUS).map(([key, status]) => {
          const leadsInStatus = filteredLeads.filter((l) => l.status === status);
          return (
            <div key={status} className="rounded-lg border bg-white p-4">
              <h3 className="mb-4 font-semibold">
                {status} <span className="text-gray-500">({leadsInStatus.length})</span>
              </h3>
              <div className="space-y-3">
                {leadsInStatus.map((lead) => (
                  <div key={lead.id} className="rounded border p-3 hover:bg-gray-50">
                    <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                    <p className="text-sm text-gray-600">{lead.email}</p>
                    <div className="mt-2">
                      <LeadScore lead={lead} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && <p className="text-center text-gray-500">Cargando leads...</p>}
      {!isLoading && filteredLeads.length === 0 && (
        <p className="text-center text-gray-500">No hay leads</p>
      )}
    </div>
  );
}
