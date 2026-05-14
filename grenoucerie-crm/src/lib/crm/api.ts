// src/lib/crm/api.ts
// Funciones API para interactuar con Supabase

import { createClient } from '@supabase/supabase-js';
import type { Account, Lead, Contact, Opportunity, Task, OutreachCampaign } from './types';

// Inicializar cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================
// ACCOUNTS (Cuentas)
// ============================================================

export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
  return data || [];
}

export async function fetchAccountById(id: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }
  return data;
}

export async function createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .insert([account])
    .select()
    .single();

  if (error) {
    console.error('Error creating account:', error);
    return null;
  }
  return data;
}

export async function updateAccount(id: string, account: Partial<Account>): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .update(account)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating account:', error);
    return null;
  }
  return data;
}

// ============================================================
// LEADS (Prospectos)
// ============================================================

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
  return data || [];
}

export async function fetchLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    return null;
  }
  return data;
}

export async function createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .insert([lead])
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    return null;
  }
  return data;
}

export async function updateLead(id: string, lead: Partial<Lead>): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .update(lead)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    return null;
  }
  return data;
}

export async function deleteLead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting lead:', error);
    return false;
  }
  return true;
}

// ============================================================
// CONTACTS (Contactos)
// ============================================================

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
  return data || [];
}

export async function fetchContactsByAccountId(accountId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('account_id', accountId);

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
  return data || [];
}

export async function createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contacts')
    .insert([contact])
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    return null;
  }
  return data;
}

export async function updateContact(id: string, contact: Partial<Contact>): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contacts')
    .update(contact)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating contact:', error);
    return null;
  }
  return data;
}

// ============================================================
// OPPORTUNITIES (Oportunidades)
// ============================================================

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    return [];
  }
  return data || [];
}

export async function createOpportunity(opp: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity | null> {
  const { data, error } = await supabase
    .from('opportunities')
    .insert([opp])
    .select()
    .single();

  if (error) {
    console.error('Error creating opportunity:', error);
    return null;
  }
  return data;
}

export async function updateOpportunity(id: string, opp: Partial<Opportunity>): Promise<Opportunity | null> {
  const { data, error } = await supabase
    .from('opportunities')
    .update(opp)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating opportunity:', error);
    return null;
  }
  return data;
}

// ============================================================
// TASKS (Tareas)
// ============================================================

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data || [];
}

export async function fetchTasksByUser(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', userId)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching user tasks:', error);
    return [];
  }
  return data || [];
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return null;
  }
  return data;
}

export async function updateTask(id: string, task: Partial<Task>): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .update(task)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    return null;
  }
  return data;
}

// ============================================================
// OUTREACH CAMPAIGNS
// ============================================================

export async function fetchOutreachCampaigns(): Promise<OutreachCampaign[]> {
  const { data, error } = await supabase
    .from('outreach_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
  return data || [];
}

export async function createOutreachCampaign(campaign: Omit<OutreachCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<OutreachCampaign | null> {
  const { data, error } = await supabase
    .from('outreach_campaigns')
    .insert([campaign])
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    return null;
  }
  return data;
}

export async function updateOutreachCampaign(id: string, campaign: Partial<OutreachCampaign>): Promise<OutreachCampaign | null> {
  const { data, error } = await supabase
    .from('outreach_campaigns')
    .update(campaign)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating campaign:', error);
    return null;
  }
  return data;
}
