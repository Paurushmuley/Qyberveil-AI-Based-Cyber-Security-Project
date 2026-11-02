import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ScanStatus, ScanProfile } from '@vulnsight/shared-types';
import {
  Radar,
  Play,
  FileDown,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  XCircle,
  Code2,
} from 'lucide-react';

export const ScansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [scanProfile, setScanProfile] = useState<string>(ScanProfile.BASELINE);
  const [openApiSpecUrl, setOpenApiSpecUrl] = useState('');
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);
  const [analyzingFindingId, setAnalyzingFindingId] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch metrics / recent scans
  const { data: metrics, isLoading: isLoadingScans } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: api.getDashboardMetrics,
    refetchInterval: 10000,
  });

  // Fetch projects for target selection
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  // Fetch targets for selected project
  const { data: targets = [] } = useQuery({
    queryKey: ['targets', selectedProjectId],
    queryFn: () => (selectedProjectId ? api.listTargets(selectedProjectId) : Promise.resolve([])),
    enabled: !!selectedProjectId,
  });

  // Fetch details of expanded scan
  const { data: scanDetails } = useQuery({
    queryKey: ['scan-details', expandedScanId],
    queryFn: () => (expandedScanId ? api.getScanDetails(expandedScanId) : Promise.resolve(null)),
    enabled: !!expandedScanId,
  });

  // Trigger scan mutation
  const launchMutation = useMutation({
    mutationFn: api.triggerScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setShowLaunchModal(false);
      setErrorMsg('');
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  // Cancel scan mutation
  const cancelMutation = useMutation({
    mutationFn: api.cancelScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  // AI analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: (findingId: string) => api.analyzeFinding(findingId),
    onSuccess: (data) => {
      setAiAnalysisResult(data);
      setAnalyzingFindingId(null);
      queryClient.invalidateQueries({ queryKey: ['scan-details', expandedScanId] });
    },
    onError: () => {
      setAnalyzingFindingId(null);
    },
  });

  const handleLaunchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedTargetId) {
      setErrorMsg('Please select a project and target application');
      return;
    }
    launchMutation.mutate({
      projectId: selectedProjectId,
      targetId: selectedTargetId,
      profile: scanProfile,
      openApiSpecUrl: openApiSpecUrl.trim() || undefined,
    });
  };

  const recentScans = metrics?.recentScans || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center space-x-2">
            <span>Automated Security Scanner</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Run baseline, API security, and active assessments with strict scope boundaries and AI finding triage.
          </p>
        </div>
        <button
          onClick={() => setShowLaunchModal(true)}
          className="self-start sm:self-auto inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono transition-colors shadow-lg shadow-cyan-600/20"
        >
          <Play className="w-4 h-4" />
          <span>Launch New Scan</span>
        </button>
      </div>

      {/* Profiles Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-cyber-border bg-cyber-850/40 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>BASELINE SCAN</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Non-intrusive probe: Security headers (HSTS, CSP), cookie flags, TLS ciphers, and information disclosure.
          </p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">
            Production Safe
          </span>
        </div>

        <div className="p-4 rounded-xl border border-cyber-border bg-cyber-850/40 space-y-2">
          <div className="flex items-center space-x-2 text-sky-400 font-mono text-xs font-bold">
            <Code2 className="w-4 h-4" />
            <span>API SECURITY</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            OpenAPI/Swagger specification discovery, parameter validation, authentication header tests, and CORS audit.
          </p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-block">
            REST & GraphQL
          </span>
        </div>

        <div className="p-4 rounded-xl border border-cyber-border bg-cyber-850/40 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold">
            <Radar className="w-4 h-4" />
            <span>ACTIVE SCAN</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            OWASP ZAP active crawler, SQL injection, XSS payloads, and parameter boundary testing under strict scope limits.
          </p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block">
            Authorization Required
          </span>
        </div>
      </div>

      {/* Scans List & Finding Explorer */}
      <div className="rounded-xl border border-cyber-border bg-cyber-850/50 backdrop-blur overflow-hidden">
        <div className="p-5 border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Scan History & Live Activity
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{recentScans.length} Scans</span>
        </div>

        {isLoadingScans ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs animate-pulse">
            Loading security scan records...
          </div>
        ) : recentScans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-cyber-900 border border-cyber-border mx-auto flex items-center justify-center text-slate-500">
              <Radar className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300">No security scans executed yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Launch New Scan" above to run an automated assessment against an authorized target.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-cyber-border">
            {recentScans.map((scan) => {
              const isExpanded = expandedScanId === scan.id;
              const isRunning = scan.status === ScanStatus.RUNNING;

              return (
                <div key={scan.id} className="transition-colors">
                  <div
                    onClick={() => setExpandedScanId(isExpanded ? null : scan.id)}
                    className="p-4 hover:bg-cyber-900/40 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3">
                      <button className="text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-semibold text-white">{scan.targetUrl}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {scan.profile}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          ID: {scan.id.slice(0, 8)} • {new Date(scan.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      {/* Findings counters */}
                      <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          {scan.criticalCount} C
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          {scan.highCount} H
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                          {scan.mediumCount} M
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {scan.lowCount} L
                        </span>
                      </div>

                      {/* Status */}
                      {isRunning ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-cyan-400 flex items-center space-x-1 animate-pulse">
                            <Radar className="w-3.5 h-3.5 animate-spin" />
                            <span>RUNNING</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelMutation.mutate(scan.id);
                            }}
                            className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                            title="Cancel Scan"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : scan.status === ScanStatus.COMPLETED ? (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {scan.status}
                        </span>
                      )}

                      {/* Download PDF Audit Report */}
                      <a
                        href={api.getReportUrl(scan.id, 'TECHNICAL_DETAILED')}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-cyber-border hover:border-cyan-500/40 bg-cyber-900/60 hover:bg-cyber-850 text-xs text-slate-300 font-mono transition-colors"
                        title="Download PDF Audit Report"
                      >
                        <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                        <span>PDF Report</span>
                      </a>
                    </div>
                  </div>

                  {/* Expanded Scan Finding Details */}
                  {isExpanded && scanDetails && (
                    <div className="p-6 bg-cyber-950/70 border-t border-cyber-border space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wide">
                          Identified Vulnerabilities ({scanDetails.findings?.length || 0})
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">
                          Duration: {scanDetails.durationSeconds ? `${scanDetails.durationSeconds}s` : 'N/A'}
                        </span>
                      </div>

                      {scanDetails.findings?.length === 0 ? (
                        <p className="text-xs text-slate-500 font-mono">No vulnerabilities detected.</p>
                      ) : (
                        <div className="space-y-3">
                          {scanDetails.findings.map((f: any) => (
                            <div
                              key={f.id}
                              className="p-4 rounded-xl border border-cyber-border bg-cyber-900/50 space-y-2 text-xs"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                      f.severity === 'CRITICAL'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                        : f.severity === 'HIGH'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                    }`}
                                  >
                                    {f.severity}
                                  </span>
                                  <span className="font-semibold text-white">{f.title}</span>
                                  <span className="font-mono text-slate-400 text-[11px] break-all">
                                    [{f.httpMethod}] {f.endpoint}
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    setAnalyzingFindingId(f.id);
                                    analyzeMutation.mutate(f.id);
                                  }}
                                  disabled={analyzingFindingId === f.id}
                                  className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-mono transition-colors disabled:opacity-50"
                                >
                                  <Sparkles className={`w-3 h-3 ${analyzingFindingId === f.id ? 'animate-spin' : ''}`} />
                                  <span>{analyzingFindingId === f.id ? 'Analyzing...' : f.aiAnalyzed ? 'Re-analyze' : 'Analyze with AI'}</span>
                                </button>
                              </div>

                              <p className="text-slate-400 leading-relaxed text-[11px]">{f.description}</p>

                              {/* AI Analysis Display if already analyzed */}
                              {f.remediation && (
                                <div className="p-3 rounded-lg bg-cyber-950 border border-emerald-500/20 space-y-1.5 mt-2">
                                  <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[11px] font-bold">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>AI Security Analyst Remediation</span>
                                  </div>
                                  <div className="text-[11px] text-slate-300 whitespace-pre-wrap font-mono">
                                    {f.remediation}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Analysis Modal */}
      {aiAnalysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-cyber-900 border border-cyber-border rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-sm font-bold text-white uppercase">{aiAnalysisResult.explainedTitle}</h2>
              </div>
              <button onClick={() => setAiAnalysisResult(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-300">
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-bold">Root Cause Analysis</p>
                <p className="mt-1 leading-relaxed text-slate-200">{aiAnalysisResult.rootCauseAnalysis}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded bg-cyber-950 border border-cyber-border">
                  <p className="text-amber-400 font-bold uppercase text-[10px]">Technical Impact</p>
                  <p className="mt-1 text-slate-300">{aiAnalysisResult.technicalImpact}</p>
                </div>
                <div className="p-3 rounded bg-cyber-950 border border-cyber-border">
                  <p className="text-rose-400 font-bold uppercase text-[10px]">Business Impact</p>
                  <p className="mt-1 text-slate-300">{aiAnalysisResult.businessImpact}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-emerald-400 uppercase text-[10px] font-bold">Framework-Specific Fix</p>
                <p className="text-slate-400 mt-0.5">{aiAnalysisResult.frameworkSpecificRemediation?.explanation}</p>
                <pre className="mt-2 p-3 rounded bg-cyber-950 border border-cyber-border text-cyan-300 overflow-x-auto text-[11px]">
                  {aiAnalysisResult.frameworkSpecificRemediation?.codeSnippet}
                </pre>
              </div>

              <div className="pt-2">
                <p className="text-sky-400 uppercase text-[10px] font-bold">Automated Regression Test</p>
                <pre className="mt-1 p-3 rounded bg-cyber-950 border border-cyber-border text-slate-300 overflow-x-auto text-[11px]">
                  {aiAnalysisResult.suggestedRegressionTest}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-cyber-border">
              <button
                onClick={() => setAiAnalysisResult(null)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Launch Scan Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-cyber-900 border border-cyber-border rounded-xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-bold text-white font-mono flex items-center space-x-2">
              <Radar className="w-5 h-5 text-cyan-400" />
              <span>Launch Automated Security Scan</span>
            </h2>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLaunchSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Select Application Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedTargetId('');
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Select Authorized Target</label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  disabled={!selectedProjectId}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  required
                >
                  <option value="">-- Choose Verified Target --</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.url} ({t.isVerified ? 'Verified' : 'Pending'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Scan Profile</label>
                <select
                  value={scanProfile}
                  onChange={(e) => setScanProfile(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value={ScanProfile.BASELINE}>Baseline Assessment (Headers, Cookies, TLS, Passive)</option>
                  <option value={ScanProfile.API_SECURITY}>API Security Assessment (OpenAPI / Parameters)</option>
                  <option value={ScanProfile.FULL_ACTIVE}>Active Scan (Bounded OWASP ZAP Injections)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">OpenAPI / Swagger Spec URL (Optional)</label>
                <input
                  type="url"
                  value={openApiSpecUrl}
                  onChange={(e) => setOpenApiSpecUrl(e.target.value)}
                  placeholder="https://target.example.com/api/v1/swagger.json"
                  className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border">
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={launchMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{launchMutation.isPending ? 'Queuing...' : 'Start Assessment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
