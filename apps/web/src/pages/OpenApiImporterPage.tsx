import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileCode2,
  Globe,
  Upload,
  Search,
  Lock,
  Unlock,
  Play,
  Code2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { api, ParsedOpenApiSpec } from '../services/api';

const SAMPLE_PETSTORE_SPEC = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Swagger Petstore - Cyber Security Target",
    "version": "1.0.17",
    "description": "Sample API testing perimeter for automated endpoint inventory and vulnerability scans."
  },
  "servers": [
    { "url": "https://petstore.swagger.io/v2" }
  ],
  "paths": {
    "/pet": {
      "post": {
        "tags": ["pet"],
        "summary": "Add a new pet to the store",
        "parameters": [],
        "requestBody": { "required": true },
        "security": [{ "petstore_auth": ["write:pets"] }]
      },
      "put": {
        "tags": ["pet"],
        "summary": "Update an existing pet",
        "parameters": []
      }
    },
    "/pet/findByStatus": {
      "get": {
        "tags": ["pet"],
        "summary": "Finds Pets by status",
        "parameters": [
          { "name": "status", "in": "query", "required": true, "type": "string" }
        ]
      }
    },
    "/pet/{petId}": {
      "get": {
        "tags": ["pet"],
        "summary": "Find pet by ID",
        "parameters": [
          { "name": "petId", "in": "path", "required": true, "type": "integer" }
        ]
      },
      "delete": {
        "tags": ["pet"],
        "summary": "Deletes a pet",
        "parameters": [
          { "name": "api_key", "in": "header", "required": false, "type": "string" },
          { "name": "petId", "in": "path", "required": true, "type": "integer" }
        ]
      }
    },
    "/user/login": {
      "get": {
        "tags": ["user"],
        "summary": "Logs user into the system",
        "parameters": [
          { "name": "username", "in": "query", "required": true, "type": "string" },
          { "name": "password", "in": "query", "required": true, "type": "string" }
        ]
      }
    },
    "/user/createWithList": {
      "post": {
        "tags": ["user"],
        "summary": "Creates list of users with given input array",
        "parameters": [],
        "requestBody": { "required": true }
      }
    }
  }
}`;

export const OpenApiImporterPage: React.FC = () => {
  const navigate = useNavigate();
  const [importMode, setImportMode] = useState<'url' | 'paste' | 'file'>('url');
  const [specUrl, setSpecUrl] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedOpenApiSpec | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

  // Launch scan dialog state
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [launchProjectId, setLaunchProjectId] = useState<string>('');
  const [launchTargetId, setLaunchTargetId] = useState<string>('');
  const [launchProfile, setLaunchProfile] = useState<string>('API_SECURITY');

  // Fetch projects and targets
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  const { data: targets = [] } = useQuery({
    queryKey: ['targets', launchProjectId],
    queryFn: () => (launchProjectId ? api.listTargets(launchProjectId) : Promise.resolve([])),
    enabled: !!launchProjectId,
  });

  // Parse mutation
  const parseMutation = useMutation({
    mutationFn: (input: { specContent?: string; specUrl?: string }) =>
      api.parseOpenApiSpec(input),
    onSuccess: (data) => {
      setParsedData(data);
      setParseError(null);
      // Select all endpoints by default
      const allKeys = new Set(data.endpoints.map((e) => `${e.method}:${e.path}`));
      setSelectedEndpoints(allKeys);
    },
    onError: (err: Error) => {
      setParseError(err.message || 'Failed to parse OpenAPI specification');
    },
  });

  // Launch scan mutation
  const triggerScanMutation = useMutation({
    mutationFn: (input: { projectId: string; targetId: string; profile: string }) =>
      api.triggerScan(input),
    onSuccess: () => {
      setIsLaunchModalOpen(false);
      navigate('/scans');
    },
  });

  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);
    if (importMode === 'url' && specUrl) {
      parseMutation.mutate({ specUrl });
    } else if (importMode === 'paste' && rawContent) {
      parseMutation.mutate({ specContent: rawContent });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawContent(content);
      parseMutation.mutate({ specContent: content });
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setImportMode('paste');
    setRawContent(SAMPLE_PETSTORE_SPEC);
    parseMutation.mutate({ specContent: SAMPLE_PETSTORE_SPEC });
  };

  const toggleEndpointSelection = (key: string) => {
    const updated = new Set(selectedEndpoints);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    setSelectedEndpoints(updated);
  };

  const toggleSelectAll = () => {
    if (!parsedData) return;
    if (selectedEndpoints.size === parsedData.endpoints.length) {
      setSelectedEndpoints(new Set());
    } else {
      setSelectedEndpoints(new Set(parsedData.endpoints.map((e) => `${e.method}:${e.path}`)));
    }
  };

  const toggleExpand = (key: string) => {
    const updated = new Set(expandedEndpoints);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    setExpandedEndpoints(updated);
  };

  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'POST':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  // Collect unique tags
  const tags = parsedData
    ? Array.from(new Set(parsedData.endpoints.flatMap((e) => e.tags)))
    : [];

  // Filter endpoints
  const filteredEndpoints = (parsedData?.endpoints || []).filter((ep) => {
    if (selectedTag !== 'ALL' && !ep.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ep.path.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q) ||
        ep.summary?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyber-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileCode2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">OpenAPI & Swagger Importer</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ingest OpenAPI v2/v3 or Swagger specs, inspect parsed routes and parameters, and initiate targeted API assessments.
          </p>
        </div>

        <button
          onClick={loadSample}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-cyber-900 hover:bg-cyber-850 border border-cyber-border text-xs font-mono text-cyan-300 transition-colors cursor-pointer shrink-0"
        >
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span>Load Sample Swagger Spec</span>
        </button>
      </div>

      {/* Ingestion Panel */}
      <div className="p-4 sm:p-5 rounded-xl border border-cyber-border bg-cyber-900/40 backdrop-blur-sm space-y-4">
        {/* Mode Tabs */}
        <div className="flex items-center space-x-2 border-b border-cyber-border pb-3">
          <button
            onClick={() => setImportMode('url')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              importMode === 'url'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Spec URL</span>
          </button>
          <button
            onClick={() => setImportMode('paste')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              importMode === 'paste'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Paste JSON / YAML</span>
          </button>
          <button
            onClick={() => setImportMode('file')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              importMode === 'file'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Ingestion Form */}
        <form onSubmit={handleParse} className="space-y-3">
          {importMode === 'url' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                required
                placeholder="https://api.example.com/openapi.json or /swagger/v1/swagger.yaml"
                value={specUrl}
                onChange={(e) => setSpecUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-cyber-950 border border-cyber-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={parseMutation.isPending || !specUrl}
                className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-cyber-950 font-bold text-xs font-mono transition-all cursor-pointer shrink-0"
              >
                {parseMutation.isPending ? 'Fetching & Parsing...' : 'Parse Spec'}
              </button>
            </div>
          )}

          {importMode === 'paste' && (
            <div className="space-y-3">
              <textarea
                rows={6}
                required
                placeholder="Paste raw OpenAPI JSON or YAML schema here..."
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                className="w-full p-3 rounded-lg bg-cyber-950 border border-cyber-border font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={parseMutation.isPending || !rawContent}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-cyber-950 font-bold text-xs font-mono transition-all cursor-pointer"
                >
                  {parseMutation.isPending ? 'Parsing...' : 'Parse OpenAPI Schema'}
                </button>
              </div>
            </div>
          )}

          {importMode === 'file' && (
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 text-center space-y-2 cursor-pointer bg-cyber-950/50 transition-colors">
              <Upload className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-xs text-slate-300 font-medium">Click to upload or drag & drop</p>
              <p className="text-[11px] text-slate-500 font-mono">.json, .yaml, or .yml (Max 10MB)</p>
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileUpload}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
            </div>
          )}

          {parseError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{parseError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Parsed Endpoint Catalog */}
      {parsedData && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="p-4 sm:p-5 rounded-xl border border-cyber-border bg-cyber-900/40 backdrop-blur-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">{parsedData.title}</h2>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-xs font-mono border border-cyan-800">
                    v{parsedData.version}
                  </span>
                </div>
                {parsedData.description && (
                  <p className="text-xs text-slate-400 mt-1">{parsedData.description}</p>
                )}
              </div>

              {/* Launch Scan Action */}
              <button
                onClick={() => {
                  if (projects.length > 0) {
                    setLaunchProjectId(projects[0].id);
                  }
                  setIsLaunchModalOpen(true);
                }}
                disabled={selectedEndpoints.size === 0}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-cyber-950 font-bold text-xs font-mono shadow-lg shadow-cyan-950 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Targeted API Scan ({selectedEndpoints.size})</span>
              </button>
            </div>

            {/* Servers & Security Schemes */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
              <span className="text-slate-500">Servers:</span>
              {parsedData.servers.map((srv, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-cyber-950 text-slate-300 border border-slate-800">
                  {srv}
                </span>
              ))}

              <span className="text-slate-500 ml-2">Auth Schemes:</span>
              {Object.keys(parsedData.securitySchemes || {}).length > 0 ? (
                Object.keys(parsedData.securitySchemes).map((sec, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/50">
                    {sec}
                  </span>
                ))
              ) : (
                <span className="text-slate-600">None declared</span>
              )}
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="p-3.5 rounded-xl border border-cyber-border bg-cyber-900/30 flex flex-wrap items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
            >
              {selectedEndpoints.size === parsedData.endpoints.length
                ? 'Deselect All'
                : 'Select All Endpoints'}
            </button>

            {/* Tag Filter */}
            <div className="flex items-center space-x-1 overflow-x-auto text-xs font-mono">
              <button
                onClick={() => setSelectedTag('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedTag === 'ALL'
                    ? 'bg-cyber-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Tags ({parsedData.totalEndpoints})
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedTag === tag
                      ? 'bg-cyber-800 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative ml-auto">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-md bg-cyber-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Endpoint Rows List */}
          <div className="space-y-2">
            {filteredEndpoints.map((ep) => {
              const epKey = `${ep.method}:${ep.path}`;
              const isSelected = selectedEndpoints.has(epKey);
              const isExpanded = expandedEndpoints.has(epKey);

              return (
                <div
                  key={epKey}
                  className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                    isSelected
                      ? 'bg-cyber-900/50 border-cyber-border'
                      : 'bg-cyber-950/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  {/* Row Summary */}
                  <div className="p-3.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEndpointSelection(epKey)}
                        className="rounded border-slate-700 bg-cyber-950 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                      <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded border ${getMethodBadge(ep.method)}`}>
                        {ep.method}
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-semibold text-white">{ep.path}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {ep.summary && (
                        <span className="text-xs text-slate-400 font-sans hidden md:block max-w-xs truncate">
                          {ep.summary}
                        </span>
                      )}

                      {ep.security && ep.security.length > 0 ? (
                        <span className="flex items-center space-x-1 text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{ep.security[0]}</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-[10px] font-mono text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800">
                          <Unlock className="w-2.5 h-2.5" />
                          <span>Public</span>
                        </span>
                      )}

                      <button
                        onClick={() => toggleExpand(epKey)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Parameter Details */}
                  {isExpanded && (
                    <div className="p-3.5 bg-cyber-950 border-t border-slate-800/80 space-y-2 text-xs font-mono">
                      {ep.description && <p className="text-slate-400 font-sans">{ep.description}</p>}
                      <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                        Parameters ({ep.parameters.length})
                      </p>
                      {ep.parameters.length === 0 ? (
                        <p className="text-slate-500 text-[11px]">No formal URL parameters declared.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px]">
                            <thead className="text-slate-500 border-b border-slate-800">
                              <tr>
                                <th className="py-1">Name</th>
                                <th className="py-1">Location</th>
                                <th className="py-1">Type</th>
                                <th className="py-1">Required</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                              {ep.parameters.map((p, idx) => (
                                <tr key={idx} className="text-slate-300">
                                  <td className="py-1 font-semibold text-white">{p.name}</td>
                                  <td className="py-1 text-slate-400">{p.in}</td>
                                  <td className="py-1 text-cyan-300">{p.type}</td>
                                  <td className="py-1">
                                    {p.required ? (
                                      <span className="text-rose-400">Yes</span>
                                    ) : (
                                      <span className="text-slate-500">No</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Launch Targeted API Assessment */}
      {isLaunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsLaunchModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl bg-cyber-950 border border-cyber-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Launch Targeted API Scan</h3>
              </div>
              <button
                onClick={() => setIsLaunchModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Launching bounded security assessment across <strong>{selectedEndpoints.size}</strong> selected endpoints.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 font-semibold">Target Project:</label>
                <select
                  value={launchProjectId}
                  onChange={(e) => setLaunchProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-900 border border-cyber-border text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 font-semibold">Authorized Target Host:</label>
                <select
                  value={launchTargetId}
                  onChange={(e) => setLaunchTargetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-900 border border-cyber-border text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select Target --</option>
                  {targets.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.url} ({t.verificationStatus})
                    </option>
                  ))}
                </select>
                {targets.length === 0 && (
                  <p className="text-[11px] text-amber-400 font-mono">
                    No authorized targets found in this project. Please add an authorized target under Projects.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 font-semibold">Scan Profile:</label>
                <select
                  value={launchProfile}
                  onChange={(e) => setLaunchProfile(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cyber-900 border border-cyber-border text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="PASSIVE_ONLY">Passive Security Baseline</option>
                  <option value="STANDARD_ACTIVE">Standard Active Vulnerability Audit</option>
                  <option value="DEEP_AUDIT">Deep Audit & Full Fuzzing</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border">
              <button
                type="button"
                onClick={() => setIsLaunchModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-cyber-900 text-xs font-mono text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!launchTargetId || triggerScanMutation.isPending}
                onClick={() =>
                  triggerScanMutation.mutate({
                    projectId: launchProjectId,
                    targetId: launchTargetId,
                    profile: launchProfile,
                  })
                }
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-cyber-950 font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{triggerScanMutation.isPending ? 'Starting Scan...' : 'Start Assessment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
