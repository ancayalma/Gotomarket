// src/lib/crm/types.ts
// Definiciones de tipos para el CRM de Grenoucerie

export interface Account {
  id: string;
  name: string;
  industry?: string;
  annual_revenue?: string;
  employees?: string;
  email?: string;
  website?: string;
  status: 'Active' | 'Inactive';
  type: 'Customer' | 'Prospect' | 'Partner';
  parent_account_id?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  first_name?: string;
  last_name: string;
  company?: string;
  job_title?: string;
  email?: string;
  phone?: string;
  status: 'NEW' | 'QUALIFIED' | 'CONTACTED' | 'ENGAGED' | 'CONVERTED' | 'LOST';
  pipeline_stage: string;
  account_id?: string;
  assigned_to?: string;
  lead_source?: string;
  campaign?: string;
  ai_score?: number;
  ai_analysis?: string;
  outreach_status?: string;
  outreach_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name?: string;
  last_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  account_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  name: string;
  amount?: number;
  probability: number;
  stage: string;
  close_date?: string;
  account_id?: string;
  contact_id?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  due_date?: string;
  assigned_to?: string;
  account_id?: string;
  contact_id?: string;
  opportunity_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OutreachCampaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  lead_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface CRMDashboardMetrics {
  total_leads: number;
  new_leads_this_week: number;
  qualified_leads: number;
  active_opportunities: number;
  pipeline_value: number;
  conversion_rate: number;
}
