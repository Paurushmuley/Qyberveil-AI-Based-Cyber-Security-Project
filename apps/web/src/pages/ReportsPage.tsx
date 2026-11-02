import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Filter,
  Plus,
  Calendar,
  Eye,
  X,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { api, AuditReportItem } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<AuditReportItem | null>(null);

  // Form state for generating a report
  const [targetScanId, setTargetScanId] = useState<string>('');
  const [reportType, setReportType] = useState<'EXECUTIVE_SUMMARY' | 'TECHNICAL_DETAILED' | 'FULL_ASSESSMENT'>('TECHNICAL_DETAILED');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch all reports
  const { data: reports = [], isLoading: loadingReports, refetch: refetchReports } = useQuery({
    queryKey: ['reports', selectedProjectId],
    queryFn: () => api.listReports(selectedProjectId !== 'ALL' ? selectedProjectId : undefined),
  });

  // Fetch projects to populate dropdowns
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  // Fetch completed scans
  const { data: allScans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: () => api.listScans(),
  });

  const completedScans = allScans.filter((s) => s.status === 'COMPLETED');

  const filteredReports = reports.filter((r) => {
    if (selectedType !== 'ALL' && r.reportType !== selectedType) return false;
    return true;
  });

  const handleDownload = (scanId: string, type: string) => {
    const url = api.getReportUrl(scanId, type);
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Qyberveil_Audit_Report_${scanId.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetScanId) return;

    setIsGenerating(true);
    try {
      handleDownload(targetScanId, reportType);
      setIsGenerateModalOpen(false);
      // Wait a moment then refetch list
      setTimeout(() => {
        refetchReports();
        setIsGenerating(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setIsGenerating(false);
    }
  };

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case 'EXECUTIVE_SUMMARY':
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">EXECUTIVE SUMMARY</span>;
      case 'TECHNICAL_DETAILED':
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">TECHNICAL DETAILED</span>;
      case 'FULL_ASSESSMENT':
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">FULL ASSESSMENT</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyber-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Security Reports Center</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Export audit-ready executive summaries, technical vulnerability dossiers, and PDF compliance assessments.
          </p>
        </div>

        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-cyber-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-3.5 rounded-xl border border-cyber-border bg-cyber-900/30 flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Filter By:</span>
        </div>

        {/* Project Filter */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-cyber-950 border border-cyber-border text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Report Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-cyber-950 border border-cyber-border text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Report Formats</option>
          <option value="EXECUTIVE_SUMMARY">Executive Summary</option>
          <option value="TECHNICAL_DETAILED">Technical Detailed</option>
          <option value="FULL_ASSESSMENT">Full Assessment</option>
        </select>

        <span className="text-xs font-mono text-slate-500 ml-auto">
          {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'} Available
        </span>
      </div>

      {/* Reports Grid */}
      {loadingReports ? (
        <div className="p-12 text-center text-xs text-slate-500 font-mono">
          Loading audit reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 rounded-xl border border-cyber-border bg-cyber-900/20 text-center space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-base font-semibold text-white">No Security Reports Generated Yet</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Run a security scan against your authorized target, then click &quot;Generate New Report&quot; to build an executive or technical PDF.
          </p>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-cyber-850 hover:bg-cyber-800 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate First Report</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-4 sm:p-5 rounded-xl border border-cyber-border bg-cyber-900/40 hover:bg-cyber-900/70 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {getReportTypeBadge(report.reportType)}
                  <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white line-clamp-1">{report.title}</h3>
                  <p className="text-xs font-mono text-cyan-400 mt-0.5 truncate">
                    {report.project?.name || 'Project'} • {report.scan?.target?.url || 'Target'}
                  </p>
                </div>

                {report.summary && (
                  <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-relaxed bg-cyber-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    {report.summary}
                  </p>
                )}

                {/* Finding Counter Pills */}
                {report.scan && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      {report.scan.criticalCount} Critical
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                      {report.scan.highCount} High
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {report.scan.mediumCount} Med
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewReport(report)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyber-850 hover:bg-cyber-800 border border-slate-700 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => handleDownload(report.scanId, report.reportType)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Generate New Report */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsGenerateModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl bg-cyber-950 border border-cyber-border p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Generate Security Audit Report</h3>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateReportSubmit} className="space-y-4">
              {/* Scan Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-semibold">Select Completed Scan:</label>
                <select
                  required
                  value={targetScanId}
                  onChange={(e) => setTargetScanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-900 border border-cyber-border text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose a Scan Target --</option>
                  {completedScans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.project?.name || 'Project'} • {s.profile} ({new Date(s.createdAt).toLocaleDateString()}) - {s.totalFindings} findings
                    </option>
                  ))}
                </select>
                {completedScans.length === 0 && (
                  <p className="text-[11px] text-amber-400 font-mono">
                    No completed scans found. Please run a security scan first.
                  </p>
                )}
              </div>

              {/* Report Format Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 font-semibold">Report Format & Depth:</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'EXECUTIVE_SUMMARY',
                      title: 'Executive Summary',
                      desc: 'High-level posture rating, critical risk overview, and remediation roadmap for leadership.',
                    },
                    {
                      id: 'TECHNICAL_DETAILED',
                      title: 'Technical Detailed (Recommended)',
                      desc: 'Full finding breakdown, CVSS scores, remediation code snippets, and evidence traces for engineers.',
                    },
                    {
                      id: 'FULL_ASSESSMENT',
                      title: 'Full Assessment',
                      desc: 'End-to-end audit archive including raw HTTP traces, scope metadata, and compliance mapping.',
                    },
                  ].map((format) => (
                    <div
                      key={format.id}
                      onClick={() => setReportType(format.id as any)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        reportType === format.id
                          ? 'bg-cyber-850 border-cyan-500/60 shadow-sm'
                          : 'bg-cyber-900/30 border-cyber-border hover:bg-cyber-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">{format.title}</span>
                        {reportType === format.id && (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{format.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-cyber-900 hover:bg-cyber-850 text-xs font-mono text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetScanId || isGenerating}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-cyber-950 font-bold text-xs font-mono transition-all cursor-pointer"
                >
                  <Download className={`w-3.5 h-3.5 ${isGenerating ? 'animate-bounce' : ''}`} />
                  <span>{isGenerating ? 'Generating PDF...' : 'Download PDF Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Report Preview Drawer */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setPreviewReport(null)}
          />

          <div className="relative w-full max-w-2xl rounded-2xl bg-cyber-950 border border-cyber-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">{previewReport.title}</h3>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-3.5 rounded-lg bg-cyber-900/50 border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-mono font-semibold">Executive Narrative:</span>
                <p className="text-slate-200 leading-relaxed font-sans">{previewReport.summary || 'No summary provided.'}</p>
              </div>

              {previewReport.scan && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div className="p-2.5 rounded-lg bg-cyber-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Critical</span>
                    <p className="text-lg font-bold text-rose-400">{previewReport.scan.criticalCount}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyber-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">High</span>
                    <p className="text-lg font-bold text-orange-400">{previewReport.scan.highCount}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyber-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Medium</span>
                    <p className="text-lg font-bold text-amber-400">{previewReport.scan.mediumCount}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyber-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Low</span>
                    <p className="text-lg font-bold text-blue-400">{previewReport.scan.lowCount}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border">
              <button
                onClick={() => setPreviewReport(null)}
                className="px-4 py-2 rounded-lg bg-cyber-900 text-xs font-mono text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownload(previewReport.scanId, previewReport.reportType);
                  setPreviewReport(null);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-500 text-cyber-950 font-bold text-xs font-mono hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
