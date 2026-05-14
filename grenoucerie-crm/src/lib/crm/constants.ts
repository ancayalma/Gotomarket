// src/lib/crm/constants.ts
// Constantes y enums del CRM

export const LEAD_STATUS = {
  NEW: 'NEW',
  QUALIFIED: 'QUALIFIED',
  CONTACTED: 'CONTACTED',
  ENGAGED: 'ENGAGED',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
} as const;

export const PIPELINE_STAGES = [
  'Identify',
  'Qualify',
  'Develop',
  'Propose',
  'Negotiate',
  'Close',
] as const;

export const ACCOUNT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export const ACCOUNT_TYPE = {
  CUSTOMER: 'Customer',
  PROSPECT: 'Prospect',
  PARTNER: 'Partner',
} as const;

export const OPPORTUNITY_STAGE = [
  'Identify',
  'Qualify',
  'Develop',
  'Propose',
  'Negotiate',
  'Close Won',
  'Close Lost',
] as const;

export const TASK_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
} as const;

export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
} as const;

export const OUTREACH_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const;

export const LEAD_SOURCES = [
  'Website',
  'Email Campaign',
  'Phone Call',
  'Social Media',
  'Referral',
  'Trade Show',
  'Other',
] as const;

// Mercados soportados (España, Francia, Petfood)
export const MARKETS = {
  SPAIN: 'españa',
  FRANCE: 'francia',
  PETFOOD: 'petfood',
} as const;

// Colores de la marca Grenoucerie
export const BRAND_COLORS = {
  PISTACHO: '#93C572',
  OLIVA: '#808000',
  OLIVA_CLARO: '#BAB86C',
  VERDE_SALVIA: '#9DC183',
} as const;

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Tiempo de espera para refetch automático (ms)
export const REFETCH_INTERVALS = {
  LEADS: 30000, // 30 segundos
  CONTACTS: 30000,
  OPPORTUNITIES: 60000, // 1 minuto
  DASHBOARD: 120000, // 2 minutos
} as const;
