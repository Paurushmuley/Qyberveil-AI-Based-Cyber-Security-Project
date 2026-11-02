import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { FindingNormalizer } from '@vulnsight/scanner';
import { PDFReportBuilder } from '@vulnsight/reports';
import { AuditReportType, FindingSeverity, FindingCategory } from '@vulnsight/shared-types';

describe('End-to-End Pipeline & Integration Verification', () => {
  const app = createApp();

  it('Pipeline Step 1: Healthcheck verifies diagnostic contracts', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('services');
  });

  it('Pipeline Step 2: Rejects scan requests targeting private network addresses (SSRF defense)', async () => {
    const res = await request(app)
      .post('/api/targets')
      .send({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        url: 'http://169.254.169.254/latest/meta-data/',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Pipeline Step 3: FindingNormalizer produces deterministic cross-scan correlations', () => {
    const id1 = FindingNormalizer.generateFindingId('app.example.com', '/api/v1/auth', 'BROKEN_AUTHENTICATION', 'token');
    const id2 = FindingNormalizer.generateFindingId('app.example.com', '/api/v1/auth', 'BROKEN_AUTHENTICATION', 'token');
    expect(id1).toBe(id2);
  });

  it('Pipeline Step 4: Generates downloadable PDF Audit Report with valid headers and disclaimers', async () => {
    const pdfBuffer = await PDFReportBuilder.generateReportBuffer({
      projectName: 'E2E Assessment Portal',
      targetUrl: 'https://staging.targetapp.com',
      inScopePaths: ['/api', '/v1'],
      scanDate: '2026-10-28',
      reportType: AuditReportType.TECHNICAL_DETAILED,
      totalFindings: 1,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
      findings: [
        {
          findingId: 'f1234567',
          title: 'Missing Content Security Policy',
          description: 'CSP header missing from HTTP responses.',
          category: FindingCategory.SECURITY_MISCONFIGURATION,
          severity: FindingSeverity.HIGH,
          endpoint: '/api/v1',
          httpMethod: 'GET',
          evidenceText: 'HTTP 200 OK without CSP header',
          remediation: 'Implement default-src self.',
        },
      ],
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });
});
