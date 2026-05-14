'use client';

import React from 'react';
import type { Database } from '@/lib/supabase/types';

type Lead = Database['public']['Tables']['leads']['Row'];

interface LeadsOverviewProps {
  leads?: Lead[];
  isLoading?: boolean;
}

export function LeadsOverview({ leads, isLoading }: LeadsOverviewProps) {
  // Calculate status distribution
  const statusCounts = leads?.reduce((acc, lead) => {
    const status = lead.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const statuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...Object.values(statusCounts), 1);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-2 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Lead Status Distribution</h2>

      {statuses.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No leads available</p>
      ) : (
        <div className="space-y-4">
          {statuses.map(([status, count]) => (
            <div key={status}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{status}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
