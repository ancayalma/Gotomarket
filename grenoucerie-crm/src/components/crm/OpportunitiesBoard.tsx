// src/components/crm/OpportunitiesBoard.tsx
// Tablero Kanban de oportunidades

import React from 'react';
import { useOpportunities } from '@/hooks/useCRMData';
import { OPPORTUNITY_STAGE } from '@/lib/crm/constants';
import { Loader2 } from 'lucide-react';

export function OpportunitiesBoard() {
  const { data: opportunities, isLoading } = useOpportunities();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const groupedByStage = OPPORTUNITY_STAGE.reduce(
    (acc, stage) => {
      acc[stage] = opportunities?.filter((opp) => opp.stage === stage) || [];
      return acc;
    },
    {} as Record<string, typeof opportunities>
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 pb-4">
        {Object.entries(groupedByStage).map(([stage, opps]) => (
          <div key={stage} className="flex-shrink-0 w-80">
            <div className="mb-3">
              <h3 className="font-semibold text-sm">
                {stage} <span className="text-gray-500">({opps.length})</span>
              </h3>
            </div>
            <div className="space-y-2">
              {opps.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-lg border bg-white p-3 shadow-sm hover:shadow-md"
                >
                  <p className="font-medium text-sm">{opp.name}</p>
                  {opp.amount && (
                    <p className="text-sm text-gray-600">
                      ${opp.amount.toLocaleString()}
                    </p>
                  )}
                  {opp.probability && (
                    <p className="text-xs text-gray-500">
                      Probabilidad: {opp.probability}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
