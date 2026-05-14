'use client';

import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtext: string;
  trend?: string;
  isLoading?: boolean;
}

export function KPICard({ title, value, subtext, trend, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-2">{subtext}</p>
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 rounded">
            <span className="text-xs font-semibold text-green-700">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}
