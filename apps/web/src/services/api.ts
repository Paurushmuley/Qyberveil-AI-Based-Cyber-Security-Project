import {
  ApiResponse,
  ServiceHealthStatus,
  DashboardMetrics,
  ProjectSummary,
  AIProvider,
  UserSummary,
  AuthResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from '@vulnsight/shared-types';

export interface UserAIConfig {
  id: string;
  provider: AIProvider;
  modelName: string;
  baseUrl?: string;
  hasKeyConfigured: boolean;
  maskedKey?: string;
  isActive: boolean;
  isTested: boolean;
  lastTestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelDescriptor {
  id: string;
  name: string;
  description: string;
  recommended: boolean;
  contextWindow?: number;
}

export interface ProviderConnectionTestResult {
  success: boolean;
  provider: AIProvider;
  model: string;
  latencyMs: number;
  message: string;
  availableModels?: string[];
  error?: string;
}

export interface FindingItem {
  id: string;
  findingId: string;
  title: string;
  description: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  severityScore?: number;
  cvssScore?: number;
  cweId?: string;
  status: 'CONFIRMED' | 'POTENTIAL' | 'NOT_REPRODUCED' | 'ACCEPTED_RISK' | 'RESOLVED';
  endpoint: string;
  httpMethod: string;
  param?: string;
  confidence: string;
  confidenceRationale?: string;
  remediation?: string;
  scannerSource: string;
  aiAnalyzed: boolean;
  createdAt: string;
  scan?: {
    id: string;
    profile: string;
    status: string;
    project?: { id: string; name: string };
    target?: { id: string; url: string; host: string };
  };
  evidence?: Array<{
    id: string;
    requestPayload?: string;
    responseStatus?: number;
    responseHeaders?: any;
    responseBodySample?: string;
    evidenceText?: string;
    curlCommand?: string;
  }>;
}

export interface ScanItem {
  id: string;
  projectId: string;
  targetId: string;
  status: string;
  profile: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  summary?: string;
  createdAt: string;
  target?: {
    id: string;
    url: string;
    host: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface PostureSummary {
  overallScore: number;
  postureRating: 'EXCELLENT' | 'ADEQUATE' | 'ELEVATED_RISK' | 'CRITICAL_ACTION_REQUIRED';
  executiveNarrative: string;
  topRemediationPriorities: string[];
  attackSurfaceSummary: string;
}

export interface AuditReportItem {
  id: string;
  projectId: string;
  scanId: string;
  reportType: 'EXECUTIVE_SUMMARY' | 'TECHNICAL_DETAILED' | 'FULL_ASSESSMENT';
  title: string;
  summary?: string;
  createdAt: string;
  project?: { id: string; name: string };
  scan?: {
    id: string;
    status: string;
    profile: string;
    completedAt?: string;
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    target?: { url: string; host: string };
  };
}

export interface ParsedEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  operationId?: string;
  tags: string[];
  parameters: Array<{
    name: string;
    in: string;
    required: boolean;
    type?: string;
    description?: string;
  }>;
  hasRequestBody: boolean;
  security?: string[];
}

export interface ParsedOpenApiSpec {
  title: string;
  version: string;
  description?: string;
  servers: string[];
  totalEndpoints: number;
  endpoints: ParsedEndpoint[];
  securitySchemes: Record<string, any>;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('qyberveil_token');
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
  });

  const data: ApiResponse<T> = await res.json();
  if (!res.ok && !data.data) {
    throw new Error(data.error?.message || `HTTP ${res.status}: Request failed`);
  }
  return data.data as T;
}

export const api = {
  // Authentication & User Management
  auth: {
    login: (input: { email: string; password: string }) =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    register: (input: { email: string; password: string; name?: string }) =>
      request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    forgotPassword: (input: { email: string }) =>
      request<ForgotPasswordResponse>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    resetPassword: (input: { token: string; newPassword: string }) =>
      request<ResetPasswordResponse>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    getMe: () => request<UserSummary>('/api/auth/me'),
    updateProfile: (input: { name?: string; currentPassword?: string; newPassword?: string }) =>
      request<UserSummary>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  },
  getHealth: () => request<ServiceHealthStatus>('/health'),
  getDashboardMetrics: () => request<DashboardMetrics>('/api/stats'),
  getProjects: () => request<ProjectSummary[]>('/api/projects'),
  createProject: (input: { name: string; description?: string }) =>
    request<ProjectSummary>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getAiConfigs: () => request<UserAIConfig[]>('/api/ai/config'),
  saveAiConfig: (input: {
    provider: AIProvider;
    modelName: string;
    apiKey?: string;
    baseUrl?: string;
    isActive?: boolean;
  }) =>
    request<{ message: string }>('/api/ai/config', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  testAiProvider: (input: {
    provider: AIProvider;
    modelName: string;
    apiKey?: string;
    baseUrl?: string;
  }) =>
    request<ProviderConnectionTestResult>('/api/ai/test', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  deleteAiConfig: (provider: AIProvider) =>
    request<{ message: string }>(`/api/ai/config/${provider}`, {
      method: 'DELETE',
    }),
  getAiModels: (provider: AIProvider) =>
    request<ModelDescriptor[]>(`/api/ai/models/${provider}`),
  listTargets: (projectId: string) =>
    request<any[]>(`/api/targets?projectId=${projectId}`),
  createTarget: (input: {
    projectId: string;
    url: string;
    inScopePaths?: string[];
    excludedPaths?: string[];
    verificationMethod?: string;
  }) =>
    request<any>('/api/targets', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  verifyTarget: (targetId: string) =>
    request<{ success: boolean; message: string }>(`/api/targets/${targetId}/verify`, {
      method: 'POST',
    }),
  triggerScan: (input: {
    projectId: string;
    targetId: string;
    profile: string;
    openApiSpecUrl?: string;
  }) =>
    request<any>('/api/scans', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getScanDetails: (scanId: string) => request<any>(`/api/scans/${scanId}`),
  cancelScan: (scanId: string) =>
    request<any>(`/api/scans/${scanId}/cancel`, {
      method: 'POST',
    }),
  compareScans: (input: { projectId: string; baseScanId: string; targetScanId: string }) =>
    request<any>('/api/scans/compare', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  analyzeFinding: (findingId: string) =>
    request<any>(`/api/scans/findings/${findingId}/analyze`, {
      method: 'POST',
    }),
  listFindings: (params?: {
    projectId?: string;
    scanId?: string;
    severity?: string;
    status?: string;
    category?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.scanId) query.set('scanId', params.scanId);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString();
    return request<FindingItem[]>(`/api/scans/findings${queryString ? `?${queryString}` : ''}`);
  },
  getPostureSummary: (scanId: string) =>
    request<PostureSummary>('/api/scans/posture', {
      method: 'POST',
      body: JSON.stringify({ scanId }),
    }),
  listReports: (projectId?: string) => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return request<AuditReportItem[]>(`/api/scans/reports${query}`);
  },
  listScans: (projectId?: string) => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return request<ScanItem[]>(`/api/scans${query}`);
  },
  parseOpenApiSpec: (input: { specContent?: string; specUrl?: string }) =>
    request<ParsedOpenApiSpec>('/api/scans/openapi/parse', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getReportUrl: (scanId: string, type = 'TECHNICAL_DETAILED') =>
    `/api/scans/${scanId}/report?type=${type}`,
};
