// src/store/crm-store.ts
// Estado global del CRM usando Zustand

import { create } from 'zustand';
import type { Lead } from '@/lib/crm';

interface CRMFilter {
  status?: string;
  market?: 'españa' | 'francia' | 'petfood';
  assignedTo?: string;
  searchText?: string;
}

interface CRMViewState {
  // Vistas activas
  activeView: 'leads' | 'contacts' | 'opportunities' | 'tasks' | 'dashboard';

  // Filtros
  leadFilters: CRMFilter;
  contactFilters: CRMFilter;
  opportunityFilters: CRMFilter;
  taskFilters: CRMFilter;

  // Búsqueda
  searchQuery: string;

  // Selección
  selectedLeadId?: string;
  selectedContactId?: string;
  selectedAccountId?: string;

  // Modal/Sidebar
  showLeadModal: boolean;
  showContactModal: boolean;
  showOpportunityModal: boolean;
  showTaskModal: boolean;

  // Acciones
  setActiveView: (view: 'leads' | 'contacts' | 'opportunities' | 'tasks' | 'dashboard') => void;
  setLeadFilters: (filters: Partial<CRMFilter>) => void;
  setContactFilters: (filters: Partial<CRMFilter>) => void;
  setOpportunityFilters: (filters: Partial<CRMFilter>) => void;
  setTaskFilters: (filters: Partial<CRMFilter>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedLeadId: (id?: string) => void;
  setSelectedContactId: (id?: string) => void;
  setSelectedAccountId: (id?: string) => void;
  setShowLeadModal: (show: boolean) => void;
  setShowContactModal: (show: boolean) => void;
  setShowOpportunityModal: (show: boolean) => void;
  setShowTaskModal: (show: boolean) => void;
  resetFilters: () => void;
}

export const useCRMStore = create<CRMViewState>((set) => ({
  // Estado inicial
  activeView: 'dashboard',
  leadFilters: {},
  contactFilters: {},
  opportunityFilters: {},
  taskFilters: {},
  searchQuery: '',
  selectedLeadId: undefined,
  selectedContactId: undefined,
  selectedAccountId: undefined,
  showLeadModal: false,
  showContactModal: false,
  showOpportunityModal: false,
  showTaskModal: false,

  // Acciones
  setActiveView: (view) => set({ activeView: view }),

  setLeadFilters: (filters) =>
    set((state) => ({
      leadFilters: { ...state.leadFilters, ...filters },
    })),

  setContactFilters: (filters) =>
    set((state) => ({
      contactFilters: { ...state.contactFilters, ...filters },
    })),

  setOpportunityFilters: (filters) =>
    set((state) => ({
      opportunityFilters: { ...state.opportunityFilters, ...filters },
    })),

  setTaskFilters: (filters) =>
    set((state) => ({
      taskFilters: { ...state.taskFilters, ...filters },
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedLeadId: (id) => set({ selectedLeadId: id }),

  setSelectedContactId: (id) => set({ selectedContactId: id }),

  setSelectedAccountId: (id) => set({ selectedAccountId: id }),

  setShowLeadModal: (show) => set({ showLeadModal: show }),

  setShowContactModal: (show) => set({ showContactModal: show }),

  setShowOpportunityModal: (show) => set({ showOpportunityModal: show }),

  setShowTaskModal: (show) => set({ showTaskModal: show }),

  resetFilters: () =>
    set({
      leadFilters: {},
      contactFilters: {},
      opportunityFilters: {},
      taskFilters: {},
      searchQuery: '',
    }),
}));

// Hook para filtrar leads basado en el estado actual
export function useFilteredLeads(leads: Lead[]) {
  const { leadFilters, searchQuery } = useCRMStore();

  return leads.filter((lead) => {
    // Filtrar por estado
    if (leadFilters.status && lead.status !== leadFilters.status) {
      return false;
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        lead.first_name?.toLowerCase().includes(query) ||
        lead.last_name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Filtrar por asignado
    if (leadFilters.assignedTo && lead.assigned_to !== leadFilters.assignedTo) {
      return false;
    }

    return true;
  });
}
