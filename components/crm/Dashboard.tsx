'use client';

import React from 'react';
import { useAccounts, useLeads, useOpportunities } from '@/lib/hooks';
import { KPICard } from './KPICard';
import { RecentActivities } from './RecentActivities';
import { LeadsOverview } from './LeadsOverview';

export function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: opportunities, isLoading: oppLoading } = useOpportunities();

  // Calculate KPIs
  const totalAccounts = accounts?.length || 0;
  const totalLeads = leads?.length || 0;
  const qualifiedLeads = leads?.filter(l => l.status === 'Qualified').length || 0;
  const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0';

  const totalPipeline = opportunities?.reduce((sum, opp) => {
    const amount = typeof opp.amount === 'string' ? parseFloat(opp.amount) : opp.amount || 0;
    return sum + amount;
  }, 0) || 0;

  const openOpportunities = opportunities?.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').length || 0;

  const isLoading = accountsLoading || leadsLoading || oppLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back. Here's your business snapshot.</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Leads"
          value={totalLeads}
          subtext={`${qualifiedLeads} qualified`}
          trend="+12%"
          isLoading={isLoading}
        />
        <KPICard
          title="Accounts"
          value={totalAccounts}
          subtext="Active accounts"
          trend="+3%"
          isLoading={isLoading}
        />
        <KPICard
          title="Pipeline Value"
          value={`€${(totalPipeline / 1000).toFixed(1)}K`}
          subtext={`${openOpportunities} open deals`}
          trend="+18%"
          isLoading={isLoading}
        />
        <KPICard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtext="Lead to qualified"
          trend="+2%"
          isLoading={isLoading}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <LeadsOverview leads={leads} isLoading={isLoading} />
        </div>

        {/* Right column - 1 col */}
        <div className="space-y-6">
          <RecentActivities leads={leads} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
