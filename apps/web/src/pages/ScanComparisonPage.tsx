import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  GitCompare,
  AlertTriangle,
  RefreshCw,
  Search,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { api, ScanItem } from '../services/api';

export const ScanComparisonPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [baseScanId, setBaseScanId] = useState<string>('');
  const [targetScanId, setTargetScanId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'resolved' | 'new' | 'persistent'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  // Set default project when loaded
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch scans for selected project
  const { data: scans = [] } = useQuery({
    queryKey: ['scans', selectedProjectId],
    queryFn: () => api.listScans(selectedProjectId || undefined),
    enabled: !!selectedProjectId,
  });

  // Comparison mutation
  const compareMutation = useMutation({
    mutationFn: () =>
      api.compareScans({
        projectId: selectedProjectId,
        baseScanId,
        targetScanId,
      }),
  });

  const comparison = compareMutation.data;

  const handleRunComparison = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseScanId || !targetScanId || baseScanId === targetScanId) return;
    compareMutation.mutate();
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyber-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Scan Comparison & Diff Engine</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Compare historical baseline scans against post-remediation runs to verify security fix efficacy and detect regressions.
          </p>
        </div>
      </div>

      {/* Comparison Selector Form */}
      <form
        onSubmit={handleRunComparison}
        className="p-4 sm:p-5 rounded-xl border border-cyber-border bg-cyber-900/40 backdrop-blur-sm space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Project Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 font-semibold">Project Scope:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setBaseScanId('');
                setTargetScanId('');
              }}
              className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Base Scan (Before) */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 font-semibold">
              Baseline Scan A (Before Fix):
            </label>
            <select
              required
              value={baseScanId}
              onChange={(e) => setBaseScanId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Select Baseline Scan --</option>
              {scans.map((s: ScanItem) => (
                <option key={s.id} value={s.id}>
                  {s.profile} ({new Date(s.createdAt).toLocaleDateString()}) - {s.totalFindings} findings
                </option>
              ))}
            </select>
          </div>

          {/* Target Scan (After) */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 font-semibold">
              Comparison Scan B (After Fix):
            </label>
            <select
              required
              value={targetScanId}
              onChange={(e) => setTargetScanId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Select Target Scan --</option>
              {scans.map((s: ScanItem) => (
                <option key={s.id} value={s.id}>
                  {s.profile} ({new Date(s.createdAt).toLocaleDateString()}) - {s.totalFindings} findings
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {baseScanId && targetScanId && baseScanId === targetScanId && (
            <p className="text-xs text-rose-400 font-mono">
              Please choose two distinct scans to compare changes.
            </p>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={!baseScanId || !targetScanId || baseScanId === targetScanId || compareMutation.isPending}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-cyber-950 font-bold text-xs font-mono shadow-md shadow-cyan-950 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${compareMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{compareMutation.isPending ? 'Calculating Diff...' : 'Execute Diff Analysis'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comparison Results */}
      {comparison ? (
        <div className="space-y-6">
          {/* Executive Metrics Delta Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                <span>Resolved Vulnerabilities</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-300 font-mono">
                +{comparison.metrics.resolvedCount}
              </p>
              <p className="text-[11px] text-slate-400">
                Findings present in Baseline but successfully fixed in Target Scan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-sm space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-rose-400">
                <span>New / Regressed Findings</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-3xl font-extrabold text-rose-300 font-mono">
                {comparison.metrics.newCount}
              </p>
              <p className="text-[11px] text-slate-400">
                Newly introduced vulnerabilities detected in Target Scan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                <span>Persistent Findings</span>
                <Activity className="w-4 h-4" />
              </div>
              <p className="text-3xl font-extrabold text-amber-300 font-mono">
                {comparison.metrics.persistentCount}
              </p>
              <p className="text-[11px] text-slate-400">
                Unresolved security findings that remain active across both scans.
              </p>
            </div>
          </div>

          {/* Detailed Diff View Tabs */}
          <div className="rounded-xl border border-cyber-border bg-cyber-900/40 overflow-hidden space-y-0">
            {/* Tab header */}
            <div className="flex items-center justify-between border-b border-cyber-border bg-cyber-950/60 px-4 py-2 flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'all'
                      ? 'bg-cyber-800 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Deltas ({comparison.resolvedFindings.length + comparison.newFindings.length + comparison.persistentFindings.length})
                </button>
                <button
                  onClick={() => setActiveTab('resolved')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'resolved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-emerald-400/70 hover:text-emerald-300'
                  }`}
                >
                  Resolved ({comparison.resolvedFindings.length})
                </button>
                <button
                  onClick={() => setActiveTab('new')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'new'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                      : 'text-rose-400/70 hover:text-rose-300'
                  }`}
                >
                  New Regressions ({comparison.newFindings.length})
                </button>
                <button
                  onClick={() => setActiveTab('persistent')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'persistent'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-amber-400/70 hover:text-amber-300'
                  }`}
                >
                  Persistent ({comparison.persistentFindings.length})
                </button>
              </div>

              {/* Search filter inside diff */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter diff..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1 rounded-md bg-cyber-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Diff list items */}
            <div className="divide-y divide-slate-800/80 p-2 sm:p-4 space-y-2">
              {/* Resolved Items */}
              {(activeTab === 'all' || activeTab === 'resolved') &&
                comparison.resolvedFindings
                  .filter((f: any) => !searchFilter || f.title.toLowerCase().includes(searchFilter.toLowerCase()) || f.endpoint.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map((f: any) => (
                    <div
                      key={`res-${f.id}`}
                      className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 hover:bg-emerald-950/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            RESOLVED
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${getSeverityBadgeClass(f.severity)}`}>
                            {f.severity}
                          </span>
                          {f.cweId && <span className="text-[10px] font-mono text-slate-500">CWE-{f.cweId}</span>}
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">{f.title}</h4>
                        <p className="text-xs font-mono text-slate-400">{f.httpMethod} {f.endpoint}</p>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 self-start sm:self-center shrink-0">
                        Remediated in Scan B
                      </span>
                    </div>
                  ))}

              {/* New Regressions */}
              {(activeTab === 'all' || activeTab === 'new') &&
                comparison.newFindings
                  .filter((f: any) => !searchFilter || f.title.toLowerCase().includes(searchFilter.toLowerCase()) || f.endpoint.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map((f: any) => (
                    <div
                      key={`new-${f.id}`}
                      className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/10 hover:bg-rose-950/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            NEW REGRESSION
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${getSeverityBadgeClass(f.severity)}`}>
                            {f.severity}
                          </span>
                          {f.cweId && <span className="text-[10px] font-mono text-slate-500">CWE-{f.cweId}</span>}
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">{f.title}</h4>
                        <p className="text-xs font-mono text-slate-400">{f.httpMethod} {f.endpoint}</p>
                      </div>
                      <span className="text-xs font-mono text-rose-400 self-start sm:self-center shrink-0">
                        Introduced in Scan B
                      </span>
                    </div>
                  ))}

              {/* Persistent Items */}
              {(activeTab === 'all' || activeTab === 'persistent') &&
                comparison.persistentFindings
                  .filter((f: any) => !searchFilter || f.title.toLowerCase().includes(searchFilter.toLowerCase()) || f.endpoint.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map((f: any) => (
                    <div
                      key={`per-${f.id}`}
                      className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/10 hover:bg-amber-950/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            PERSISTENT
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${getSeverityBadgeClass(f.severity)}`}>
                            {f.severity}
                          </span>
                          {f.cweId && <span className="text-[10px] font-mono text-slate-500">CWE-{f.cweId}</span>}
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">{f.title}</h4>
                        <p className="text-xs font-mono text-slate-400">{f.httpMethod} {f.endpoint}</p>
                      </div>
                      <span className="text-xs font-mono text-amber-400 self-start sm:self-center shrink-0">
                        Unresolved
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-xl border border-cyber-border bg-cyber-900/20 text-center space-y-3">
          <GitCompare className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-base font-semibold text-white">Select Two Scans to Compute Delta</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose a baseline scan (before security changes) and a target scan (after deployment) above, then execute the diff analysis to see exact fix confirmation.
          </p>
        </div>
      )}
    </div>
  );
};
