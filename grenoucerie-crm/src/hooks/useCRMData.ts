// src/hooks/useCRMData.ts
// Hooks de React Query para datos del CRM

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLeads,
  fetchLeadById,
  createLead,
  updateLead,
  deleteLead,
  fetchContacts,
  fetchContactsByAccountId,
  createContact,
  updateContact,
  fetchAccounts,
  fetchAccountById,
  createAccount,
  updateAccount,
  fetchOpportunities,
  createOpportunity,
  updateOpportunity,
  fetchTasks,
  fetchTasksByUser,
  createTask,
  updateTask,
  fetchOutreachCampaigns,
  createOutreachCampaign,
  updateOutreachCampaign,
} from '@/lib/crm';
import type { Lead, Contact, Account, Opportunity, Task, OutreachCampaign } from '@/lib/crm';

const QUERY_KEYS = {
  leads: ['leads'],
  lead: (id: string) => ['lead', id],
  contacts: ['contacts'],
  contactsByAccount: (accountId: string) => ['contacts', accountId],
  accounts: ['accounts'],
  account: (id: string) => ['account', id],
  opportunities: ['opportunities'],
  tasks: ['tasks'],
  tasksByUser: (userId: string) => ['tasks', userId],
  campaigns: ['campaigns'],
};

// ============================================================
// LEADS
// ============================================================

export function useLeads() {
  return useQuery({
    queryKey: QUERY_KEYS.leads,
    queryFn: fetchLeads,
    staleTime: 30000, // 30 segundos
  });
}

export function useLeadById(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.lead(id),
    queryFn: () => fetchLeadById(id),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leads });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Lead> }) =>
      updateLead(payload.id, payload.data),
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lead(data.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leads });
      }
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leads });
    },
  });
}

// ============================================================
// CONTACTS
// ============================================================

export function useContacts() {
  return useQuery({
    queryKey: QUERY_KEYS.contacts,
    queryFn: fetchContacts,
    staleTime: 30000,
  });
}

export function useContactsByAccount(accountId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.contactsByAccount(accountId),
    queryFn: () => fetchContactsByAccountId(accountId),
    enabled: !!accountId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createContact,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      if (data?.account_id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.contactsByAccount(data.account_id),
        });
      }
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Contact> }) =>
      updateContact(payload.id, payload.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
    },
  });
}

// ============================================================
// ACCOUNTS
// ============================================================

export function useAccounts() {
  return useQuery({
    queryKey: QUERY_KEYS.accounts,
    queryFn: fetchAccounts,
    staleTime: 30000,
  });
}

export function useAccountById(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.account(id),
    queryFn: () => fetchAccountById(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Account> }) =>
      updateAccount(payload.id, payload.data),
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.account(data.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      }
    },
  });
}

// ============================================================
// OPPORTUNITIES
// ============================================================

export function useOpportunities() {
  return useQuery({
    queryKey: QUERY_KEYS.opportunities,
    queryFn: fetchOpportunities,
    staleTime: 60000, // 1 minuto
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Opportunity> }) =>
      updateOpportunity(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities });
    },
  });
}

// ============================================================
// TASKS
// ============================================================

export function useTasks() {
  return useQuery({
    queryKey: QUERY_KEYS.tasks,
    queryFn: fetchTasks,
    staleTime: 30000,
  });
}

export function useTasksByUser(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tasksByUser(userId),
    queryFn: () => fetchTasksByUser(userId),
    enabled: !!userId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Task> }) =>
      updateTask(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    },
  });
}

// ============================================================
// OUTREACH CAMPAIGNS
// ============================================================

export function useOutreachCampaigns() {
  return useQuery({
    queryKey: QUERY_KEYS.campaigns,
    queryFn: fetchOutreachCampaigns,
    staleTime: 60000,
  });
}

export function useCreateOutreachCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOutreachCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.campaigns });
    },
  });
}

export function useUpdateOutreachCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: Partial<OutreachCampaign> }) =>
      updateOutreachCampaign(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.campaigns });
    },
  });
}
