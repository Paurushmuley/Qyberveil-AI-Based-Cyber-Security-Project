/**
 * @vulnsight/shared-types
 * Core domain types and contracts shared across Frontend, API, AI Services, and Scan Workers.
 */

// ==========================================
// Enums
// ==========================================

export enum UserRole {
  ADMIN = 'ADMIN',
  SECURITY_ANALYST = 'SECURITY_ANALYST',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
}

export enum TargetVerificationMethod {
  DNS_TXT = 'DNS_TXT',
  HTTP_META_TAG = 'HTTP_META_TAG',
  HTTP_FILE_TOKEN = 'HTTP_FILE_TOKEN',
  DOCUMENTED_AUTHORIZATION = 'DOCUMENTED_AUTHORIZATION',
}

export enum TargetVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum ScanProfile {
  BASELINE = 'BASELINE',                 // Passive, headers, cookies, TLS, OpenAPI inventory
  API_SECURITY = 'API_SECURITY',         // Dedicated REST/OpenAPI parameter and auth checks
  FULL_ACTIVE = 'FULL_ACTIVE',           // Active injections (requires documented authorization)
  CUSTOM = 'CUSTOM',
}

export enum ScanStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum FindingSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL',
}

export enum FindingCategory {
  INJECTION = 'INJECTION',
  BROKEN_AUTHENTICATION = 'BROKEN_AUTHENTICATION',
  SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE',
  XML_EXTERNAL_ENTITIES = 'XML_EXTERNAL_ENTITIES',
  BROKEN_ACCESS_CONTROL = 'BROKEN_ACCESS_CONTROL',
  SECURITY_MISCONFIGURATION = 'SECURITY_MISCONFIGURATION',
  CROSS_SITE_SCRIPTING = 'CROSS_SITE_SCRIPTING',
  INSECURE_DESERIALIZATION = 'INSECURE_DESERIALIZATION',
  VULNERABLE_COMPONENTS = 'VULNERABLE_COMPONENTS',
  INSUFFICIENT_LOGGING = 'INSUFFICIENT_LOGGING',
  SSRF = 'SSRF',
  API_VULNERABILITY = 'API_VULNERABILITY',
  OTHER = 'OTHER',
}

export enum FindingStatus {
  CONFIRMED = 'CONFIRMED',
  POTENTIAL = 'POTENTIAL',
  NOT_REPRODUCED = 'NOT_REPRODUCED',
  ACCEPTED_RISK = 'ACCEPTED_RISK',
  RESOLVED = 'RESOLVED',
}

export enum FindingConfidence {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  FALSE_POSITIVE_SUSPECTED = 'FALSE_POSITIVE_SUSPECTED',
}

export enum AIProvider {
  OPENAI = 'OPENAI',
  GEMINI = 'GEMINI',
  GROK = 'GROK',
  OLLAMA = 'OLLAMA',
}

export enum AuditReportType {
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  TECHNICAL_DETAILED = 'TECHNICAL_DETAILED',
  FULL_ASSESSMENT = 'FULL_ASSESSMENT',
}

// ==========================================
// Entities
// ==========================================

export interface UserSummary {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: UserSummary;
  token: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  userId: string;
  targetCount: number;
  scanCount: number;
  lastScanAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorizedTargetSummary {
  id: string;
  projectId: string;
  url: string;
  host: string;
  inScopePaths: string[];
  excludedPaths: string[];
  isVerified: boolean;
  verificationMethod: TargetVerificationMethod;
  verificationStatus: TargetVerificationStatus;
  verificationToken?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanSummary {
  id: string;
  projectId: string;
  targetId: string;
  targetUrl: string;
  status: ScanStatus;
  profile: ScanProfile;
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
  failureReason?: string;
  createdAt: string;
}

export interface FindingSummary {
  id: string;
  scanId: string;
  findingId: string;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  severityScore?: number;
  cvssScore?: number;
  cweId?: string;
  status: FindingStatus;
  endpoint: string;
  httpMethod: string;
  param?: string;
  confidence: FindingConfidence;
  confidenceRationale?: string;
  remediation?: string;
  scannerSource: string;
  aiAnalyzed: boolean;
  createdAt: string;
}

export interface FindingEvidenceDetail {
  id: string;
  findingId: string;
  requestPayload?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBodySample?: string;
  evidenceText?: string;
  curlCommand?: string;
  createdAt: string;
}

export interface AIProviderConfigSummary {
  id: string;
  userId: string;
  provider: AIProvider;
  modelName: string;
  baseUrl?: string;
  hasKeyConfigured: boolean;
  isActive: boolean;
  isTested: boolean;
  lastTestedAt?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalApplications: number;
  totalScans: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  infoFindings: number;
  totalFindings: number;
  remediatedFindingsCount: number;
  recentScans: ScanSummary[];
}

// ==========================================
// Health & Diagnostics
// ==========================================

export interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      latencyMs?: number;
      error?: string;
    };
    redis: {
      status: 'connected' | 'disconnected' | 'error' | 'optional_disabled';
      latencyMs?: number;
      error?: string;
    };
  };
}

// ==========================================
// API Transport Envelopes
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
