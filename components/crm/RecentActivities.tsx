'use client';

import React from 'react';
import type { Database } from '@/lib/supabase/types';

type Lead = Database['public']['Tables']['leads']['Row'];

interface RecentActivitiesProps {
  leads?: Lead[];
  isLoading?: boolean;
}

export function RecentActivities({ leads, isLoading }: RecentActivitiesProps) {
  // Get recent leads (last 5)
  const recentLeads = leads?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h2>

      {recentLeads.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No leads yet</p>
      ) : (
        <div className="space-y-3">
          {recentLeads.map(lead => (
            <div key={lead.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {lead.first_name} {lead.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{lead.company || lead.email}</p>
              </div>
              <div className="ml-2 text-right">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {lead.status || 'New'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
