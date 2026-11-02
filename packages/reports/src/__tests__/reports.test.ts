import { describe, it, expect } from 'vitest';
import { PDFReportBuilder } from '../pdf-builder.js';
import { AuditReportType, FindingSeverity, FindingCategory } from '@vulnsight/shared-types';

describe('PDFReportBuilder', () => {
  it('generates a valid PDF buffer with %PDF- header for executive reports', async () => {
    const buffer = await PDFReportBuilder.generateReportBuffer({
      projectName: 'Acme Portal',
      targetUrl: 'https://staging.acme.com',
      inScopePaths: ['/api', '/portal'],
      scanDate: '2026-10-28',
      reportType: AuditReportType.EXECUTIVE_SUMMARY,
      executiveSummary: 'Assessment completed with 2 findings.',
      totalFindings: 2,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 1,
      lowCount: 0,
      infoCount: 0,
      findings: [],
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    // Check PDF magic header "%PDF-"
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
  });

  it('generates a multi-page technical report with finding descriptions and remediation', async () => {
    const buffer = await PDFReportBuilder.generateReportBuffer({
      projectName: 'Acme API Gateway',
      targetUrl: 'https://api.acme.com',
      inScopePaths: ['/v1'],
      scanDate: '2026-10-28',
      reportType: AuditReportType.TECHNICAL_DETAILED,
      totalFindings: 1,
      criticalCount: 1,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
      findings: [
        {
          findingId: 'abc12345',
          title: 'Remote SQL Injection',
          description: 'Parameter user_id is vulnerable to SQL injection.',
          category: FindingCategory.INJECTION,
          severity: FindingSeverity.CRITICAL,
          endpoint: '/v1/users',
          httpMethod: 'POST',
          cweId: '89',
          cvssScore: 9.8,
          evidenceText: "user_id=1' OR 1=1--",
          remediation: 'Use parameterized SQL queries.',
          regressionTest: 'curl -X POST https://api.acme.com/v1/users',
        },
      ],
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
  });
});
