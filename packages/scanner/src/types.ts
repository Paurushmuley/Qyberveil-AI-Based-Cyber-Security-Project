import {
  FindingSeverity,
  FindingCategory,
  FindingStatus,
  FindingConfidence,
  ScanProfile,
} from '@vulnsight/shared-types';

export interface ScopeRule {
  targetUrl: string;
  host: string;
  inScopePaths: string[];
  excludedPaths: string[];
  allowSubdomains?: boolean;
}

export interface RawScannerAlert {
  source: 'OWASP_ZAP' | 'CUSTOM_BASELINE' | 'OPENAPI_DISCOVERY';
  pluginId?: string;
  alertName: string;
  description: string;
  uri: string;
  method: string;
  param?: string;
  attack?: string;
  evidenceText?: string;
  rawSeverity: 'High' | 'Medium' | 'Low' | 'Informational';
  rawConfidence: 'High' | 'Medium' | 'Low' | 'False Positive';
  cweId?: string;
  wascId?: string;
  solution?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBodySample?: string;
}

export interface NormalizedFindingPayload {
  findingId: string; // Deterministic hash for correlation across scans
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
  evidence: {
    requestPayload?: string;
    responseStatus?: number;
    responseHeaders?: Record<string, string>;
    responseBodySample?: string;
    evidenceText?: string;
    curlCommand?: string;
  };
}

export interface ScanExecutionOptions {
  profile: ScanProfile;
  customHeaders?: Record<string, string>;
  openApiSpecUrl?: string;
  timeoutMs?: number;
  maxDepth?: number;
  onProgress?: (progress: number, message: string) => void;
  isCancelled?: () => boolean;
}

export interface ScanExecutionResult {
  targetUrl: string;
  profile: ScanProfile;
  durationMs: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  findings: NormalizedFindingPayload[];
  endpointsScanned: string[];
  logs: string[];
}
