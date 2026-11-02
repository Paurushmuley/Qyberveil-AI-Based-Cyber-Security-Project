import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScopeValidator } from '../scope-validator.js';
import { FindingNormalizer } from '../normalizer.js';
import { CustomSecurityChecks } from '../custom-checks.js';
import { ScannerEngine } from '../engine.js';
import { FindingSeverity, FindingCategory, ScanProfile } from '@vulnsight/shared-types';

describe('ScopeValidator', () => {
  const rule = {
    targetUrl: 'https://staging.vulnsight.com',
    host: 'staging.vulnsight.com',
    inScopePaths: ['/api', '/dashboard'],
    excludedPaths: ['/api/admin/reset', '/dashboard/logout'],
    allowSubdomains: false,
  };

  const validator = new ScopeValidator(rule);

  it('allows declared in-scope paths on the target host', () => {
    expect(validator.isUrlInScope('https://staging.vulnsight.com/api/v1/users').allowed).toBe(true);
    expect(validator.isUrlInScope('https://staging.vulnsight.com/dashboard').allowed).toBe(true);
  });

  it('rejects paths outside declared in-scope paths', () => {
    const res = validator.isUrlInScope('https://staging.vulnsight.com/internal-docs');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('outside declared in-scope paths');
  });

  it('strictly blocks excluded paths even if under in-scope prefix', () => {
    const res = validator.isUrlInScope('https://staging.vulnsight.com/api/admin/reset');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('excluded path pattern');
  });

  it('rejects out-of-scope redirected destinations during crawl', () => {
    const redirectCheck = validator.validateRedirect(
      'https://staging.vulnsight.com/api/oauth',
      'https://malicious-external-site.com/callback'
    );
    expect(redirectCheck.allowed).toBe(false);
    expect(redirectCheck.reason).toContain('Disallowed redirect');
  });
});

describe('FindingNormalizer', () => {
  it('generates deterministic findingIds for identical vulnerabilities across scans', () => {
    const id1 = FindingNormalizer.generateFindingId('app.example.com', '/api/users', 'INJECTION', 'id', '89');
    const id2 = FindingNormalizer.generateFindingId('app.example.com', '/api/users', 'INJECTION', 'id', '89');
    const id3 = FindingNormalizer.generateFindingId('app.example.com', '/api/orders', 'INJECTION', 'id', '89');

    expect(id1).toBe(id2);
    expect(id1).not.toBe(id3);
    expect(id1).toHaveLength(16);
  });

  it('correctly maps raw ZAP alerts to normalized finding schema', () => {
    const rawAlert = {
      source: 'OWASP_ZAP' as const,
      alertName: 'SQL Injection in User Search',
      description: 'SQL injection possible via the query parameter.',
      uri: 'https://staging.example.com/api/search?q=1',
      method: 'GET',
      param: 'q',
      attack: "1' OR '1'='1",
      rawSeverity: 'High' as const,
      rawConfidence: 'High' as const,
      cweId: '89',
      solution: 'Use parameterized queries.',
    };

    const normalized = FindingNormalizer.normalizeAlert(rawAlert, 'staging.example.com');
    expect(normalized.category).toBe(FindingCategory.INJECTION);
    expect(normalized.severity).toBe(FindingSeverity.HIGH);
    expect(normalized.cvssScore).toBeGreaterThanOrEqual(7.0);
    expect(normalized.evidence.requestPayload).toBe("1' OR '1'='1");
    expect(normalized.evidence.curlCommand).toContain('curl -X GET');
  });
});

describe('CustomSecurityChecks', () => {
  it('flags missing HSTS, CSP, and X-Content-Type-Options headers', () => {
    const alerts = CustomSecurityChecks.checkSecurityHeaders(
      'https://app.example.com',
      200,
      { 'content-type': 'text/html' }
    );

    const alertNames = alerts.map((a) => a.alertName);
    expect(alertNames).toContain('Missing HTTP Strict Transport Security (HSTS) Header');
    expect(alertNames).toContain('Missing Content Security Policy (CSP) Header');
    expect(alertNames).toContain('Missing or Invalid X-Content-Type-Options Header');
  });

  it('detects missing HttpOnly, Secure, and SameSite attributes on cookies', () => {
    const cookieHeader = 'session_id=abc123xyz; Path=/';
    const alerts = CustomSecurityChecks.checkCookies('https://app.example.com', [cookieHeader]);

    const alertNames = alerts.map((a) => a.alertName);
    expect(alertNames.some((n) => n.includes('HttpOnly'))).toBe(true);
    expect(alertNames.some((n) => n.includes('Secure'))).toBe(true);
    expect(alertNames.some((n) => n.includes('SameSite'))).toBe(true);
  });
});

describe('ScannerEngine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes a baseline scan and computes severity totals correctly', async () => {
    const engine = new ScannerEngine({
      targetUrl: 'https://target.example.com',
      host: 'target.example.com',
      inScopePaths: ['/'],
      excludedPaths: [],
    });

    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('8080')) {
        return { ok: false } as Response; // ZAP offline
      }
      return {
        status: 200,
        headers: new Headers({
          'content-type': 'text/html',
          'x-powered-by': 'Express',
        }),
      } as Response;
    });

    const result = await engine.executeScan({
      profile: ScanProfile.BASELINE,
    });

    expect(result.targetUrl).toBe('https://target.example.com');
    expect(result.totalFindings).toBeGreaterThan(0);
    expect(result.findings.some((f) => f.title.includes('X-Powered-By'))).toBe(true);
    expect(result.logs.length).toBeGreaterThan(0);
  });
});
