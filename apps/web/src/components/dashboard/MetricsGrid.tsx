import React from 'react';
import { ShieldAlert, Layers, Target, CheckCircle2 } from 'lucide-react';
import { DashboardMetrics } from '@vulnsight/shared-types';

interface MetricsGridProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-cyber-850/60 border border-cyber-border" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Target Applications',
      value: metrics?.totalApplications ?? 0,
      detail: `${metrics?.totalScans ?? 0} total scans completed`,
      icon: Target,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      title: 'Critical Vulnerabilities',
      value: metrics?.criticalFindings ?? 0,
      detail: 'Requires immediate remediation',
      icon: ShieldAlert,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
    },
    {
      title: 'High / Medium Risk',
      value: (metrics?.highFindings ?? 0) + (metrics?.mediumFindings ?? 0),
      detail: `${metrics?.highFindings ?? 0} High • ${metrics?.mediumFindings ?? 0} Medium`,
      icon: Layers,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Remediated Findings',
      value: metrics?.remediatedFindingsCount ?? 0,
      detail: 'Verified resolved across scans',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`p-5 rounded-xl border ${card.borderColor} bg-cyber-850/40 backdrop-blur flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold font-mono tracking-tight text-white">
                {card.value}
              </div>
              <div className="mt-1 text-xs text-slate-400 flex items-center">
                {card.detail}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
