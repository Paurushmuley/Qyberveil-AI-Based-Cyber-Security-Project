import { AuditReportType, FindingSeverity, FindingCategory } from '@vulnsight/shared-types';

export interface ReportFindingDetail {
  findingId: string;
  title: string;
  description: string;
  category: FindingCategory;
  severity: FindingSeverity;
  endpoint: string;
  httpMethod: string;
  cweId?: string;
  cvssScore?: number;
  evidenceText?: string;
  remediation?: string;
  regressionTest?: string;
}

export interface ReportGenerationInput {
  projectName: string;
  targetUrl: string;
  inScopePaths: string[];
  scanDate: string;
  reportType: AuditReportType;
  executiveSummary?: string;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  findings: ReportFindingDetail[];
  generatedBy?: string;
}
