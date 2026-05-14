// src/lib/crm/calculations.ts
// Funciones de cálculo para el CRM (scoring, métricas, etc.)

import type { Lead, Opportunity } from './types';

/**
 * Calcula el score de un lead basado en múltiples factores
 * - Completitud de datos: 0-30 puntos
 * - Calidad del trabajo: 0-30 puntos
 * - Engagement: 0-40 puntos
 * Rango total: 0-100
 */
export function calculateLeadScore(lead: Lead): number {
  let score = 0;

  // 1. Completitud de datos (0-30 puntos)
  const completeness = [
    lead.first_name,
    lead.last_name,
    lead.email,
    lead.phone,
    lead.company,
    lead.job_title,
  ].filter(Boolean).length;
  score += Math.min(30, (completeness / 6) * 30);

  // 2. Calidad del trabajo (0-30 puntos)
  const jobTitleQualityKeywords = [
    'CEO',
    'Director',
    'Manager',
    'VP',
    'Head',
    'CTO',
    'CFO',
    'COO',
    'Gerente',
    'Responsable',
  ];
  if (
    lead.job_title &&
    jobTitleQualityKeywords.some((kw) =>
      lead.job_title?.toUpperCase().includes(kw.toUpperCase())
    )
  ) {
    score += 30;
  } else if (lead.job_title) {
    score += 15;
  }

  // 3. Engagement (0-40 puntos)
  if (lead.status === 'CONVERTED') {
    score += 40;
  } else if (lead.status === 'ENGAGED') {
    score += 30;
  } else if (lead.status === 'CONTACTED') {
    score += 20;
  } else if (lead.status === 'QUALIFIED') {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Genera un análisis textual del lead
 */
export function generateLeadAnalysis(lead: Lead): string {
  const score = calculateLeadScore(lead);
  const status = lead.status || 'UNKNOWN';

  if (score >= 80) {
    return `Lead de alta prioridad. ${lead.job_title ? `${lead.job_title} en ${lead.company}` : 'Información completa'}. Estado actual: ${status}`;
  } else if (score >= 60) {
    return `Lead prometedor. Requiere seguimiento. Estado: ${status}. Completar información de contacto.`;
  } else if (score >= 40) {
    return `Lead potencial. Necesita validación. Información incompleta. Prioridad: seguimiento`;
  } else {
    return `Lead en fase inicial. Requiere enriquecimiento de datos antes de seguimiento.`;
  }
}

/**
 * Calcula el valor total del pipeline de oportunidades
 */
export function calculatePipelineValue(opportunities: Opportunity[]): number {
  return opportunities
    .filter((opp) => opp.stage !== 'Close Lost')
    .reduce((sum, opp) => {
      const baseAmount = opp.amount || 0;
      const probability = (opp.probability || 0) / 100;
      return sum + baseAmount * probability;
    }, 0);
}

/**
 * Calcula la tasa de conversión de leads a oportunidades
 */
export function calculateConversionRate(
  totalLeads: number,
  convertedLeads: number
): number {
  if (totalLeads === 0) return 0;
  return Math.round((convertedLeads / totalLeads) * 100);
}

/**
 * Genera recomendación de seguimiento para un lead
 */
export function generateFollowUpRecommendation(lead: Lead): string {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (lead.status === 'NEW' && daysSinceCreation > 2) {
    return 'Contactar inmediatamente - Lead nuevo sin seguimiento';
  } else if (lead.status === 'CONTACTED' && daysSinceCreation > 5) {
    return 'Realizar seguimiento - No hay respuesta tras 5 días';
  } else if (lead.status === 'ENGAGED' && daysSinceCreation > 7) {
    return 'Enviar propuesta o agendar call';
  } else if (lead.status === 'QUALIFIED' && !lead.outreach_sent_at) {
    return 'Iniciar campaña de outreach';
  }

  return 'Sin acción requerida - Monitorear';
}

/**
 * Agrupa leads por mercado y proporciona estadísticas
 */
export function analyzeLeadsByMarket(
  leads: Lead[]
): Record<string, { count: number; avgScore: number; topStatus: string }> {
  const marketMap: Record<string, Lead[]> = {};

  leads.forEach((lead) => {
    // Detectar mercado por compañía o asignación
    const market = detectMarket(lead.company || lead.assigned_to || 'spain');
    if (!marketMap[market]) {
      marketMap[market] = [];
    }
    marketMap[market].push(lead);
  });

  const result: Record<string, any> = {};
  Object.entries(marketMap).forEach(([market, marketLeads]) => {
    const scores = marketLeads.map((l) => calculateLeadScore(l));
    const statuses = marketLeads.map((l) => l.status);
    const topStatus =
      statuses[0] ||
      Array.from(new Set(statuses))[0] ||
      'UNKNOWN';

    result[market] = {
      count: marketLeads.length,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      topStatus,
    };
  });

  return result;
}

/**
 * Detecta el mercado basado en texto (España, Francia, Petfood)
 */
function detectMarket(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes('france') ||
    lower.includes('paris') ||
    lower.includes('français')
  ) {
    return 'france';
  }
  if (
    lower.includes('pet') ||
    lower.includes('animal') ||
    lower.includes('food')
  ) {
    return 'petfood';
  }
  return 'spain';
}
