import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  Search,
  Terminal,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';

export const AiAnalystPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'root_cause' | 'remediation' | 'tests' | 'evidence' | 'confidence'>('root_cause');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTest, setCopiedTest] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedScanId, setSelectedScanId] = useState<string>('ALL');

  // Fetch all findings
  const { data: findings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ['findings', selectedScanId, selectedSeverity, searchQuery],
    queryFn: () =>
      api.listFindings({
        scanId: selectedScanId !== 'ALL' ? selectedScanId : undefined,
        severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
        search: searchQuery || undefined,
      }),
  });

  // Fetch all scans for the dropdown
  const { data: allScans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: () => api.listScans(),
  });

  // Set default selected finding when findings load
  React.useEffect(() => {
    if (findings.length > 0 && !selectedFindingId) {
      setSelectedFindingId(findings[0].id);
    }
  }, [findings, selectedFindingId]);

  const selectedFinding = findings.find((f) => f.id === selectedFindingId) || findings[0];

  // Fetch Posture Summary if a scan is selected
  const activeScanId = selectedScanId !== 'ALL' ? selectedScanId : allScans[0]?.id;
  const {
    data: postureSummary,
    isLoading: loadingPosture,
    refetch: refetchPosture,
  } = useQuery({
    queryKey: ['postureSummary', activeScanId],
    queryFn: () => (activeScanId ? api.getPostureSummary(activeScanId) : null),
    enabled: !!activeScanId,
  });

  // Mutation to run AI analysis on a specific finding
  const analyzeMutation = useMutation({
    mutationFn: (id: string) => api.analyzeFinding(id),
    onMutate: (id) => setAnalyzingId(id),
    onSettled: () => setAnalyzingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['postureSummary'] });
    },
  });

  const handleCopy = (text: string, type: 'code' | 'test') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedTest(true);
      setTimeout(() => setCopiedTest(false), 2000);
    }
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

  const getRatingBadge = (rating?: string) => {
    switch (rating) {
      case 'EXCELLENT':
        return <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">EXCELLENT</span>;
      case 'ADEQUATE':
        return <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">ADEQUATE</span>;
      case 'ELEVATED_RISK':
        return <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">ELEVATED RISK</span>;
      case 'CRITICAL_ACTION_REQUIRED':
        return <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">CRITICAL ACTION REQUIRED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-slate-800 text-slate-400 border border-slate-700">ANALYZING</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyber-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">AI Security Analyst Hub</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Evidence-grounded vulnerability triage, root-cause narratives, framework remediations, and automated regression assertions.
          </p>
        </div>

        {/* Scan Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-xs text-slate-400 font-mono hidden sm:block">Scope Target:</label>
          <select
            value={selectedScanId}
            onChange={(e) => setSelectedScanId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-cyber-900 border border-cyber-border text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Scans (Global Findings)</option>
            {allScans.map((s) => (
              <option key={s.id} value={s.id}>
                {s.project?.name || 'Project'} - {s.profile} ({new Date(s.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posture Summary Widget */}
      {postureSummary && (
        <div className="p-4 sm:p-5 rounded-xl border border-cyber-border bg-cyber-900/40 backdrop-blur-sm space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xl font-bold">
                {postureSummary.overallScore}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-semibold text-white">Posture Security Rating</h2>
                  {getRatingBadge(postureSummary.postureRating)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{postureSummary.attackSurfaceSummary}</p>
              </div>
            </div>

            <button
              onClick={() => refetchPosture()}
              disabled={loadingPosture}
              className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPosture ? 'animate-spin' : ''}`} />
              <span>Refresh Posture</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-cyber-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
            <span className="font-semibold text-cyan-300 font-mono">Executive Summary: </span>
            {postureSummary.executiveNarrative}
          </div>

          {postureSummary.topRemediationPriorities.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Critical Remediation Priorities
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {postureSummary.topRemediationPriorities.map((priority, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2 p-2.5 rounded-lg bg-cyber-950/40 border border-rose-500/20 text-xs text-slate-300"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span className="truncate">{priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Workbench Grid: Left = Findings List, Right = AI Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Findings Selector */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter and Search Bar */}
          <div className="space-y-2 p-3 rounded-xl border border-cyber-border bg-cyber-900/30">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search findings by title, endpoint, CWE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 rounded-md border transition-colors shrink-0 ${
                    selectedSeverity === sev
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-cyber-950 text-slate-400 border-cyber-border hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Finding Cards List */}
          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {loadingFindings ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Loading security findings...
              </div>
            ) : findings.length === 0 ? (
              <div className="p-8 rounded-xl border border-cyber-border bg-cyber-900/20 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="text-sm font-semibold text-white">No Findings Detected</p>
                <p className="text-xs text-slate-400">All scanned endpoints conform to active security policies.</p>
              </div>
            ) : (
              findings.map((f) => {
                const isSelected = selectedFinding?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFindingId(f.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 space-y-2 ${
                      isSelected
                        ? 'bg-cyber-850 border-cyan-500/60 shadow-md shadow-cyan-950/50'
                        : 'bg-cyber-900/30 border-cyber-border hover:bg-cyber-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${getSeverityBadgeClass(
                              f.severity
                            )}`}
                          >
                            {f.severity}
                          </span>
                          {f.cweId && (
                            <span className="text-[10px] font-mono text-slate-500">CWE-{f.cweId}</span>
                          )}
                          {f.aiAnalyzed && (
                            <span className="flex items-center space-x-1 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>AI Triaged</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-semibold text-white line-clamp-1">{f.title}</h3>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'
                        }`}
                      />
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 truncate">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                        {f.httpMethod}
                      </span>
                      <span className="truncate">{f.endpoint}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: AI Inspector & Evidence Pane */}
        <div className="lg:col-span-7">
          {selectedFinding ? (
            <div className="rounded-xl border border-cyber-border bg-cyber-900/40 backdrop-blur-sm overflow-hidden shadow-xl space-y-0">
              {/* Header Box */}
              <div className="p-4 sm:p-5 border-b border-cyber-border bg-cyber-950/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded border ${getSeverityBadgeClass(
                          selectedFinding.severity
                        )}`}
                      >
                        {selectedFinding.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Confidence: <strong className="text-white">{selectedFinding.confidence}</strong>
                      </span>
                      {selectedFinding.cweId && (
                        <span className="text-xs font-mono text-slate-400">
                          CWE-{selectedFinding.cweId}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white">{selectedFinding.title}</h2>
                    <p className="text-xs font-mono text-cyan-400 flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                        {selectedFinding.httpMethod}
                      </span>
                      <span>{selectedFinding.endpoint}</span>
                      {selectedFinding.param && (
                        <span className="text-slate-400">?param={selectedFinding.param}</span>
                      )}
                    </p>
                  </div>

                  {/* Trigger AI Button */}
                  <button
                    onClick={() => analyzeMutation.mutate(selectedFinding.id)}
                    disabled={analyzingId === selectedFinding.id}
                    className="flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-semibold shadow-md shadow-cyan-900/30 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles
                      className={`w-4 h-4 ${analyzingId === selectedFinding.id ? 'animate-spin' : ''}`}
                    />
                    <span>{analyzingId === selectedFinding.id ? 'Analyzing...' : 'Run Deep AI Analysis'}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center border-b border-cyber-border bg-cyber-950/40 px-4 overflow-x-auto text-xs font-mono">
                <button
                  onClick={() => setActiveTab('root_cause')}
                  className={`py-3 px-3 border-b-2 font-medium transition-colors shrink-0 ${
                    activeTab === 'root_cause'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Root Cause & Impact
                </button>
                <button
                  onClick={() => setActiveTab('remediation')}
                  className={`py-3 px-3 border-b-2 font-medium transition-colors shrink-0 ${
                    activeTab === 'remediation'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Remediation Code
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`py-3 px-3 border-b-2 font-medium transition-colors shrink-0 ${
                    activeTab === 'tests'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Regression Tests
                </button>
                <button
                  onClick={() => setActiveTab('evidence')}
                  className={`py-3 px-3 border-b-2 font-medium transition-colors shrink-0 ${
                    activeTab === 'evidence'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Scanner Evidence Trace
                </button>
                <button
                  onClick={() => setActiveTab('confidence')}
                  className={`py-3 px-3 border-b-2 font-medium transition-colors shrink-0 ${
                    activeTab === 'confidence'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  False Positive Triage
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-4 sm:p-5">
                {/* TAB 1: Root Cause & Impact */}
                {activeTab === 'root_cause' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-lg bg-cyber-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center space-x-2 text-cyan-400 font-mono font-semibold">
                        <Terminal className="w-4 h-4" />
                        <span>Executive Synopsis</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans">{selectedFinding.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-lg bg-cyber-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center space-x-2 text-rose-400 font-mono font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Technical Exploitation Impact</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          {selectedFinding.aiAnalyzed
                            ? 'Vulnerability may expose confidential state headers, facilitate unauthorized parameter manipulation, or trigger state mutation across the API perimeter.'
                            : 'Baseline heuristic: Potential security configuration lapse at target endpoint.'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-cyber-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center space-x-2 text-amber-400 font-mono font-semibold">
                          <ShieldAlert className="w-4 h-4" />
                          <span>Business & Regulatory Risk</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          Non-compliance with OWASP API Security Top 10 guidelines, NIST SP 800-53, or SOC2 Type II audit benchmarks.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Remediation Code */}
                {activeTab === 'remediation' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-slate-400">
                        Production defensive fix with verified architectural hardening:
                      </p>
                      <button
                        onClick={() => handleCopy(selectedFinding.remediation || '', 'code')}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition-colors"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-cyber-950 border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-300 leading-relaxed max-h-96">
                      <pre>{selectedFinding.remediation || 'No remediation snippet generated. Click "Run Deep AI Analysis" above.'}</pre>
                    </div>
                  </div>
                )}

                {/* TAB 3: Automated Regression Tests */}
                {activeTab === 'tests' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-slate-400">
                        Automated regression test assertion to add to CI/CD pipelines:
                      </p>
                      <button
                        onClick={() =>
                          handleCopy(
                            selectedFinding.evidence?.[0]?.curlCommand ||
                              `curl -i -X ${selectedFinding.httpMethod} "${selectedFinding.endpoint}"`,
                            'test'
                          )
                        }
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition-colors"
                      >
                        {copiedTest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedTest ? 'Copied' : 'Copy Test'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-cyber-950 border border-slate-800 font-mono text-xs overflow-x-auto text-cyan-300 leading-relaxed">
                      <p className="text-slate-500 mb-2">// Automated verification command:</p>
                      <code>
                        {selectedFinding.evidence?.[0]?.curlCommand ||
                          `curl -i -s -X ${selectedFinding.httpMethod} "${selectedFinding.endpoint}" | grep -v "${selectedFinding.param || 'vulnerable'}"`}
                      </code>
                    </div>
                  </div>
                )}

                {/* TAB 4: Scanner Evidence Trace */}
                {activeTab === 'evidence' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        <strong>Security Isolation Boundary:</strong> Scanner evidence is strictly isolated.
                        Scanner source: <code className="text-white font-mono">{selectedFinding.scannerSource}</code>.
                      </span>
                    </div>

                    {selectedFinding.evidence && selectedFinding.evidence.length > 0 ? (
                      selectedFinding.evidence.map((ev, i) => (
                        <div key={i} className="space-y-3 text-xs font-mono">
                          {ev.evidenceText && (
                            <div className="p-3 rounded-lg bg-cyber-950 border border-slate-800 space-y-1">
                              <span className="text-slate-400 font-semibold">Evidence Snippet:</span>
                              <p className="text-slate-200">{ev.evidenceText}</p>
                            </div>
                          )}

                          {ev.requestPayload && (
                            <div className="p-3 rounded-lg bg-cyber-950 border border-slate-800 space-y-1">
                              <span className="text-slate-400 font-semibold">Request Payload:</span>
                              <pre className="text-cyan-300 overflow-x-auto">{ev.requestPayload}</pre>
                            </div>
                          )}

                          <div className="p-3 rounded-lg bg-cyber-950 border border-slate-800 space-y-1">
                            <span className="text-slate-400 font-semibold">Response Status: </span>
                            <span className="text-white">{ev.responseStatus || 200}</span>
                          </div>

                          {ev.responseBodySample && (
                            <div className="p-3 rounded-lg bg-cyber-950 border border-slate-800 space-y-1">
                              <span className="text-slate-400 font-semibold">Response Body Sample:</span>
                              <pre className="text-slate-300 overflow-x-auto max-h-40">{ev.responseBodySample}</pre>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 font-mono">No raw evidence frames captured.</p>
                    )}
                  </div>
                )}

                {/* TAB 5: False Positive Triage */}
                {activeTab === 'confidence' && (
                  <div className="space-y-4 text-xs font-sans">
                    <div className="p-4 rounded-xl bg-cyber-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono">Assessment Status:</span>
                        <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-cyber-850 border border-slate-700">
                          {selectedFinding.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono">Confidence Level:</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {selectedFinding.confidence}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 text-slate-300 leading-relaxed">
                        <strong className="text-white font-mono">Rationale: </strong>
                        {selectedFinding.confidenceRationale ||
                          'Finding verified against standard HTTP baseline checks and OWASP signature matching.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl border border-cyber-border bg-cyber-900/20 text-slate-500 font-mono text-xs">
              Select a finding from the left panel to begin deep AI triage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
