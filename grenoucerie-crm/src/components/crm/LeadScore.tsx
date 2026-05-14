// src/components/crm/LeadScore.tsx
// Componente que muestra el score de un lead

import React from 'react';
import { calculateLeadScore, generateLeadAnalysis } from '@/lib/crm/calculations';
import type { Lead } from '@/lib/crm';

interface LeadScoreProps {
  lead: Lead;
}

export function LeadScore({ lead }: LeadScoreProps) {
  const score = calculateLeadScore(lead);
  const analysis = generateLeadAnalysis(lead);

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    if (s >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-end justify-between">
        <h3 className="text-sm font-semibold">Lead Score</h3>
        <div className="text-right">
          <div className={`text-2xl font-bold text-white rounded px-3 py-1 ${getScoreColor(score)}`}>
            {score}
          </div>
          <p className="mt-1 text-xs text-gray-600">/100</p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full ${getScoreColor(score)} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-gray-700">{analysis}</p>
    </div>
  );
}
