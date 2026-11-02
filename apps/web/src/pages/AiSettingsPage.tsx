import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ModelDescriptor, ProviderConnectionTestResult } from '../services/api';
import { AIProvider } from '@vulnsight/shared-types';
import {
  Sparkles,
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Play,
  Save,
  Info,
  Server,
  Zap,
} from 'lucide-react';

const PROVIDERS = [
  {
    id: AIProvider.GEMINI,
    name: 'Google Gemini',
    tagline: 'Deep reasoning, 1M+ context window, ultra-fast triage',
    icon: Sparkles,
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/10',
    defaultModel: 'gemini-2.0-flash',
    requiresKey: true,
  },
  {
    id: AIProvider.OPENAI,
    name: 'OpenAI',
    tagline: 'Industry benchmark models (GPT-4o, o3-mini)',
    icon: Zap,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    defaultModel: 'gpt-4o',
    requiresKey: true,
  },
  {
    id: AIProvider.GROK,
    name: 'xAI Grok',
    tagline: 'High-capability technical reasoning (Grok-2)',
    icon: Key,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    defaultModel: 'grok-2',
    requiresKey: true,
  },
  {
    id: AIProvider.OLLAMA,
    name: 'Ollama (Local AI)',
    tagline: 'Private, offline inference without sending data to cloud APIs',
    icon: Cpu,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    defaultModel: 'llama3.3',
    requiresKey: false,
  },
];

export const AiSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AIProvider.GEMINI);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [modelName, setModelName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [testResult, setTestResult] = useState<ProviderConnectionTestResult | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Fetch saved configs
  const { data: configs = [], isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: api.getAiConfigs,
  });

  // Fetch models for active tab
  const { data: availableModels = [] } = useQuery<ModelDescriptor[]>({
    queryKey: ['ai-models', selectedProvider],
    queryFn: () => api.getAiModels(selectedProvider),
  });

  const activeSavedConfig = configs.find((c) => c.provider === selectedProvider);

  // Sync model and baseUrl defaults when tab changes
  useEffect(() => {
    setTestResult(null);
    setSaveSuccessMsg('');
    setApiKey('');

    if (activeSavedConfig) {
      setModelName(activeSavedConfig.modelName);
      setBaseUrl(activeSavedConfig.baseUrl || (selectedProvider === AIProvider.OLLAMA ? 'http://localhost:11434' : ''));
    } else {
      const providerMeta = PROVIDERS.find((p) => p.id === selectedProvider);
      setModelName(providerMeta?.defaultModel || '');
      setBaseUrl(selectedProvider === AIProvider.OLLAMA ? 'http://localhost:11434' : '');
    }
  }, [selectedProvider, activeSavedConfig]);

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: () =>
      api.testAiProvider({
        provider: selectedProvider,
        modelName,
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      }),
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (err: Error) => {
      setTestResult({
        success: false,
        provider: selectedProvider,
        model: modelName,
        latencyMs: 0,
        message: 'Connection test failed',
        error: err.message,
      });
    },
  });

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      api.saveAiConfig({
        provider: selectedProvider,
        modelName,
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
        isActive: true,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
      setSaveSuccessMsg(res.message);
      setApiKey(''); // Clear plaintext key from state
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    },
  });

  // Delete config mutation
  const deleteMutation = useMutation({
    mutationFn: (provider: AIProvider) => api.deleteAiConfig(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
      setTestResult(null);
    },
  });

  const isOllama = selectedProvider === AIProvider.OLLAMA;
  const currentProviderMeta = PROVIDERS.find((p) => p.id === selectedProvider);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center space-x-2">
          <span>AI Provider & Credential Management</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure AI reasoning engines for vulnerability analysis, root-cause explanation, and remediation guidance.
        </p>
      </div>

      {/* Security Notice Callout */}
      <div className="p-4 rounded-xl border border-cyber-border bg-gradient-to-r from-cyber-850/60 to-cyber-900/60 text-xs flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200 font-mono">Zero-Leak Server-Side Encryption</p>
          <p className="text-slate-400 leading-relaxed">
            All submitted API keys are immediately encrypted on the server using authenticated AES-256-GCM. Credentials are never logged in application logs and are never exposed back to client-side JavaScript.
          </p>
        </div>
      </div>

      {/* Provider Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PROVIDERS.map((provider) => {
          const Icon = provider.icon;
          const isSelected = selectedProvider === provider.id;
          const hasSaved = configs.some((c) => c.provider === provider.id && (c.hasKeyConfigured || c.provider === AIProvider.OLLAMA));

          return (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? `${provider.borderColor} bg-cyber-850 shadow-md shadow-cyan-500/5`
                  : 'border-cyber-border bg-cyber-900/50 hover:bg-cyber-850/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${provider.bgColor} ${provider.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {hasSaved && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>CONFIGURED</span>
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-white">{provider.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{provider.tagline}</p>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-cyber-border text-[11px] font-mono text-cyan-400 flex items-center space-x-1">
                  <span>Selected Provider</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Configuration Form Card */}
      <div className="p-6 rounded-xl border border-cyber-border bg-cyber-850/50 backdrop-blur space-y-6">
        <div className="flex items-center justify-between border-b border-cyber-border pb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${currentProviderMeta?.bgColor} ${currentProviderMeta?.color}`}>
              {currentProviderMeta?.icon && <currentProviderMeta.icon className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                Configure {currentProviderMeta?.name}
              </h2>
              <p className="text-xs text-slate-400">
                {isOllama ? 'Local offline inference model settings' : 'Cloud API credentials & model selection'}
              </p>
            </div>
          </div>

          {activeSavedConfig?.maskedKey && (
            <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyber-900 border border-cyber-border text-slate-300 flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saved Key: {activeSavedConfig.maskedKey}</span>
            </div>
          )}
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* API Key Input (Cloud only) */}
          {!isOllama && (
            <div>
              <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5">
                {currentProviderMeta?.name} API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    activeSavedConfig?.hasKeyConfigured
                      ? '•••••••••••••••••••••••••••••••• (Leave blank to keep existing encrypted key)'
                      : selectedProvider === AIProvider.OPENAI
                      ? 'sk-proj-...'
                      : selectedProvider === AIProvider.GEMINI
                      ? 'AIzaSy...'
                      : 'xai-...'
                  }
                  className="w-full px-3 py-2.5 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Keys are stored encrypted on the server using AES-256-GCM.
              </p>
            </div>
          )}

          {/* Endpoint / Base URL Input (Ollama or custom gateway) */}
          {isOllama && (
            <div>
              <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5">
                Local Ollama Endpoint URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3 py-2.5 rounded-lg bg-cyber-950 border border-cyber-border text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Must point to your running Ollama daemon (e.g. `http://localhost:11434` or Docker network alias `http://ollama:11434`).
              </p>
            </div>
          )}

          {/* Model Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5">
              Reasoning Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableModels.map((m) => {
                const isModelSelected = modelName === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setModelName(m.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isModelSelected
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-cyber-border bg-cyber-950/60 hover:bg-cyber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{m.name}</span>
                      {m.recommended && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{m.description}</p>
                    {m.contextWindow && (
                      <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                        Context: {(m.contextWindow / 1000).toFixed(0)}k tokens
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connection Test Diagnostics Banner */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border text-xs font-mono space-y-1.5 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  {testResult.success ? 'Connection Verification Successful' : 'Connection Verification Failed'}
                </span>
                {testResult.latencyMs > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 ml-auto">
                    {testResult.latencyMs}ms
                  </span>
                )}
              </div>
              <p className="text-slate-300">{testResult.message}</p>
              {testResult.error && (
                <p className="text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900/60 font-mono text-[11px]">
                  {testResult.error}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-cyber-border">
            <button
              type="button"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending || (!apiKey && !activeSavedConfig?.hasKeyConfigured && !isOllama)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold transition-colors disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${testMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{testMutation.isPending ? 'Testing Connection...' : 'Test Provider Connection'}</span>
            </button>

            <div className="flex items-center space-x-3">
              {activeSavedConfig && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(selectedProvider)}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-mono transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Credentials</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || (!apiKey && !activeSavedConfig?.hasKeyConfigured && !isOllama)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono transition-colors shadow-lg shadow-cyan-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saveMutation.isPending ? 'Encrypting & Saving...' : 'Save & Set Active'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configured Providers Table */}
      <div className="p-6 rounded-xl border border-cyber-border bg-cyber-850/40 backdrop-blur space-y-4">
        <div className="flex items-center justify-between border-b border-cyber-border pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Persisted Provider Configurations
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {configs.length} Configured
          </span>
        </div>

        {isLoadingConfigs ? (
          <div className="p-4 text-center text-slate-400 font-mono text-xs animate-pulse">
            Loading configured providers...
          </div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-1">
            <p className="text-slate-300 font-medium">No AI provider credentials configured yet</p>
            <p className="text-slate-500">Configure Google Gemini, OpenAI, xAI Grok, or Ollama above to activate AI-powered vulnerability triage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cyber-900/60 border-b border-cyber-border text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Provider</th>
                  <th className="py-2.5 px-4">Model</th>
                  <th className="py-2.5 px-4">Credential Status</th>
                  <th className="py-2.5 px-4">Connection Tested</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border font-mono">
                {configs.map((c) => (
                  <tr key={c.id} className="hover:bg-cyber-900/30">
                    <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                      <span>{c.provider}</span>
                      {c.isActive && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.modelName}</td>
                    <td className="py-3 px-4">
                      {c.provider === AIProvider.OLLAMA ? (
                        <span className="text-cyan-400 text-[11px]">Local ({c.baseUrl || 'localhost:11434'})</span>
                      ) : c.maskedKey ? (
                        <span className="text-slate-300 flex items-center space-x-1.5">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          <span>{c.maskedKey}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">No key stored</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.isTested ? (
                        <span className="text-emerald-400 text-[11px] flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified ({c.lastTestedAt ? new Date(c.lastTestedAt).toLocaleDateString() : 'Active'})</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Pending Test</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(c.provider)}
                        className="text-rose-400 hover:text-rose-300 text-xs inline-flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deployment & Boundary Documentation */}
      <div className="p-5 rounded-xl border border-cyber-border bg-cyber-900/40 text-xs space-y-2">
        <div className="flex items-center space-x-2 font-mono font-semibold text-slate-200">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Local Development vs. Hosted Vercel Deployment Notice</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          When running Qyberveil locally, local Ollama inference (<code className="text-cyan-300">http://localhost:11434</code>) operates without cloud API keys or telemetry. When deployed to hosted Vercel environments, serverless functions cannot connect to your personal machine's localhost without an explicit tunnel or companion service; cloud providers (Gemini, OpenAI, Grok) should be configured in hosted mode.
        </p>
      </div>
    </div>
  );
};
