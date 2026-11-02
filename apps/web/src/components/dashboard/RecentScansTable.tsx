import React from 'react';
import { Radar, ExternalLink, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { ScanSummary, ScanStatus } from '@vulnsight/shared-types';

interface RecentScansTableProps {
  scans: ScanSummary[];
  isLoading: boolean;
}

export const RecentScansTable: React.FC<RecentScansTableProps> = ({ scans, isLoading }) => {
  const getStatusBadge = (status: ScanStatus) => {
    switch (status) {
      case ScanStatus.COMPLETED:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>COMPLETED</span>
          </span>
        );
      case ScanStatus.RUNNING:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
            <Radar className="w-3 h-3 animate-spin" />
            <span>RUNNING</span>
          </span>
        );
      case ScanStatus.FAILED:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-700/50 text-slate-300 border border-slate-600">
            <Clock className="w-3 h-3" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-850/50 backdrop-blur overflow-hidden">
      <div className="p-5 border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Radar className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Recent Security Scans
          </h2>
        </div>
        <span className="text-xs text-slate-400">Total logged: {scans.length}</span>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400 font-mono text-sm animate-pulse">
          Loading scan activity...
        </div>
      ) : scans.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-cyber-900 border border-cyber-border mx-auto flex items-center justify-center text-slate-500">
            <Radar className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-300">No security scans recorded yet</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you register an authorized target and initiate a baseline assessment, findings and progress will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cyber-900/60 border-b border-cyber-border text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Target Application</th>
                <th className="py-3 px-4">Profile</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Findings Breakdown</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-cyber-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-white flex items-center space-x-2">
                    <span>{scan.targetUrl}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{scan.profile}</td>
                  <td className="py-3 px-4">{getStatusBadge(scan.status)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                        {scan.criticalCount} C
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        {scan.highCount} H
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                        {scan.mediumCount} M
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 text-[10px]">
                        {scan.lowCount} L
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-cyan-400 hover:text-cyan-300 font-mono inline-flex items-center space-x-1">
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
