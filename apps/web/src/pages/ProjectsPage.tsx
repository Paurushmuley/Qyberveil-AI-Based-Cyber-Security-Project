import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  FolderGit2,
  Plus,
  Target,
  Calendar,
  Check,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Project form states
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  // Target form states
  const [targetUrl, setTargetUrl] = useState('');
  const [inScopePaths, setInScopePaths] = useState('/');
  const [excludedPaths, setExcludedPaths] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('DOCUMENTED_AUTHORIZATION');

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });

  // Fetch targets for expanded project
  const { data: projectTargets = [] } = useQuery({
    queryKey: ['targets', expandedProjectId],
    queryFn: () => (expandedProjectId ? api.listTargets(expandedProjectId) : Promise.resolve([])),
    enabled: !!expandedProjectId,
  });

  const createProjectMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setShowProjectModal(false);
      setProjectName('');
      setProjectDesc('');
      setErrorMsg('');
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const createTargetMutation = useMutation({
    mutationFn: api.createTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowTargetModal(false);
      setTargetUrl('');
      setInScopePaths('/');
      setExcludedPaths('');
      setErrorMsg('');
      setSuccessMsg('Target registered successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const verifyTargetMutation = useMutation({
    mutationFn: (targetId: string) => api.verifyTarget(targetId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['targets', expandedProjectId] });
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setErrorMsg('Project name is required');
      return;
    }
    createProjectMutation.mutate({ name: projectName, description: projectDesc });
  };

  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !targetUrl.trim()) {
      setErrorMsg('Project ID and Target URL are required');
      return;
    }

    createTargetMutation.mutate({
      projectId: selectedProjectId,
      url: targetUrl.trim(),
      inScopePaths: inScopePaths.split(',').map((p) => p.trim()).filter(Boolean),
      excludedPaths: excludedPaths.split(',').map((p) => p.trim()).filter(Boolean),
      verificationMethod,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Applications & Scope Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Register applications, define strict in-scope boundaries, and verify authorized testing permissions.
          </p>
        </div>
        <button
          onClick={() => setShowProjectModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono transition-colors shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-cyber-850/60 border border-cyber-border" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-cyber-border bg-cyber-850/30 space-y-3">
          <div className="w-12 h-12 rounded-full bg-cyber-900 border border-cyber-border mx-auto flex items-center justify-center text-slate-500">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <p className="text-base font-medium text-slate-200">No applications registered</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create an application project to configure authorized targets, define testing scopes, and run scans.
          </p>
          <button
            onClick={() => setShowProjectModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Target</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const isExpanded = expandedProjectId === project.id;

            return (
              <div
                key={project.id}
                className="rounded-xl border border-cyber-border bg-cyber-850/40 overflow-hidden transition-colors"
              >
                <div
                  onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                  className="p-5 hover:bg-cyber-900/40 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <button className="text-slate-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white text-base tracking-tight">{project.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          ID: {project.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{project.targetCount} Targets</span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectId(project.id);
                        setShowTargetModal(true);
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Target</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Target List */}
                {isExpanded && (
                  <div className="p-6 bg-cyber-950/70 border-t border-cyber-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wide">
                        Authorized Targets ({projectTargets.length})
                      </h4>
                    </div>

                    {projectTargets.length === 0 ? (
                      <p className="text-xs text-slate-500 font-mono">No target endpoints registered for this project.</p>
                    ) : (
                      <div className="space-y-3 font-mono text-xs">
                        {projectTargets.map((t: any) => (
                          <div
                            key={t.id}
                            className="p-4 rounded-xl border border-cyber-border bg-cyber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-white text-sm">{t.url}</span>
                                {t.isVerified ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>VERIFIED</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1">
                                    <ShieldAlert className="w-3 h-3" />
                                    <span>PENDING VERIFICATION</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-[11px]">
                                In-scope: {t.inScopePaths?.join(', ') || '/'} | Excluded: {t.excludedPaths?.join(', ') || 'None'}
                              </p>
                              {t.verificationToken && !t.isVerified && (
                                <p className="text-slate-500 text-[10px]">
                                  Verification Token: <code className="text-cyan-400">{t.verificationToken}</code>
                                </p>
                              )}
                            </div>

                            {!t.isVerified && (
                              <button
                                onClick={() => verifyTargetMutation.mutate(t.id)}
                                disabled={verifyTargetMutation.isPending}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify Ownership</span>
                              </button>
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

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-cyber-900 border border-cyber-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white font-mono">Register Application Project</h2>
            <form onSubmit={handleProjectSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Application Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Acme Customer Portal"
                  className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Description & Context</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="e.g. Staging environment for storefront and auth APIs."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{createProjectMutation.isPending ? 'Creating...' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target & Scope Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-cyber-900 border border-cyber-border rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <span>Register Authorized Target & Scope</span>
            </h2>

            <form onSubmit={handleTargetSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Target Base URL</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://staging.targetapp.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  SSRF protection: Private RFC 1918 subnets and cloud metadata endpoints are strictly rejected.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">In-Scope Path Prefixes (Comma-separated)</label>
                <input
                  type="text"
                  value={inScopePaths}
                  onChange={(e) => setInScopePaths(e.target.value)}
                  placeholder="/api, /v1, /dashboard"
                  className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Excluded Path Prefixes (Comma-separated)</label>
                <input
                  type="text"
                  value={excludedPaths}
                  onChange={(e) => setExcludedPaths(e.target.value)}
                  placeholder="/admin/reset, /auth/logout"
                  className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Verification Method</label>
                <select
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="DOCUMENTED_AUTHORIZATION">Documented Authorization (Staging / Permitted)</option>
                  <option value="HTTP_FILE_TOKEN">HTTP Well-Known File Token (/.well-known/vulnsight-verify.txt)</option>
                  <option value="DNS_TXT">DNS TXT Record Verification</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTargetMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{createTargetMutation.isPending ? 'Registering...' : 'Authorize Target'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
