import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { SystemHealthCard } from '../components/dashboard/SystemHealthCard';
import { RecentScansTable } from '../components/dashboard/RecentScansTable';
import { SecurityGuardrailsCard } from '../components/dashboard/SecurityGuardrailsCard';
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard';
import { RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { data: metrics, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: api.getDashboardMetrics,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center space-x-2">
            <span>Security Assessment Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time security posture, target health, and continuous vulnerability tracking.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-cyber-border hover:border-slate-600 bg-cyber-850 hover:bg-cyber-800 text-xs text-slate-300 font-mono transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Row */}
      <MetricsGrid metrics={metrics} isLoading={isLoading} />

      {/* Operations & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActionsCard />
        <SystemHealthCard />
      </div>

      {/* Recent Scans Table */}
      <RecentScansTable scans={metrics?.recentScans ?? []} isLoading={isLoading} />

      {/* Scope & Guardrails Information */}
      <SecurityGuardrailsCard />
    </div>
  );
};
