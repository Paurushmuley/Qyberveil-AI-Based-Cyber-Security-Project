import { FindingSeverity, ScanProfile } from '@vulnsight/shared-types';
import {
  ScopeRule,
  ScanExecutionOptions,
  ScanExecutionResult,
  RawScannerAlert,
  NormalizedFindingPayload,
} from './types.js';
import { ScopeValidator } from './scope-validator.js';
import { CustomSecurityChecks } from './custom-checks.js';
import { FindingNormalizer } from './normalizer.js';
import { ZAPScannerClient } from './zap-client.js';

export class ScannerEngine {
  private readonly validator: ScopeValidator;
  private readonly targetUrl: string;
  private readonly targetHost: string;
  private readonly zapClient: ZAPScannerClient;

  constructor(scopeRule: ScopeRule) {
    this.validator = new ScopeValidator(scopeRule);
    this.targetUrl = scopeRule.targetUrl;
    this.targetHost = scopeRule.host;
    this.zapClient = new ZAPScannerClient();
  }

  /**
   * Executes a bounded, scope-controlled security scan
   */
  public async executeScan(options: ScanExecutionOptions): Promise<ScanExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const rawAlerts: RawScannerAlert[] = [];
    const endpointsScanned: string[] = [];

    const log = (msg: string) => {
      logs.push(`[${new Date().toISOString()}] ${msg}`);
      options.onProgress?.(logs.length * 5, msg);
    };

    log(`Starting security assessment for ${this.targetUrl} [Profile: ${options.profile}]`);

    // 1. Initial Scope & Target Validation
    const scopeCheck = this.validator.isUrlInScope(this.targetUrl);
    if (!scopeCheck.allowed) {
      throw new Error(`Target authorization / scope violation: ${scopeCheck.reason}`);
    }

    if (options.isCancelled?.()) {
      log('Scan cancelled by user.');
      return this.buildResult(rawAlerts, endpointsScanned, logs, startTime, options.profile);
    }

    // 2. Baseline HTTP Discovery & Header / Cookie Inspection
    log('Conducting baseline HTTP probe and security header audit...');
    try {
      const probeRes = await fetch(this.targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Qyberveil-Security-Scanner/0.1.0',
          ...options.customHeaders,
        },
        redirect: 'manual', // Prevent silent redirects across security boundaries
        signal: AbortSignal.timeout(options.timeoutMs || 15000),
      });

      endpointsScanned.push(this.targetUrl);

      // Check redirect safety
      const location = probeRes.headers.get('location');
      if (location && [301, 302, 307, 308].includes(probeRes.status)) {
        log(`Inspecting redirect destination: ${location}`);
        const resolvedRedirect = new URL(location, this.targetUrl).toString();
        const redirectCheck = this.validator.validateRedirect(this.targetUrl, resolvedRedirect);
        if (!redirectCheck.allowed) {
          log(`WARNING: Blocked unauthorized redirect: ${redirectCheck.reason}`);
          rawAlerts.push({
            source: 'CUSTOM_BASELINE',
            alertName: 'Uncontrolled Redirect to Out-of-Scope Destination',
            description: `Target returned a redirect to ${resolvedRedirect}, which is outside the declared scope boundaries.`,
            uri: this.targetUrl,
            method: 'GET',
            rawSeverity: 'Medium',
            rawConfidence: 'High',
            cweId: '601',
            solution: 'Ensure redirects validate destination URLs against allowed in-scope hosts.',
          });
        }
      }

      // Convert Headers to standard Record
      const responseHeaders: Record<string, string> = {};
      probeRes.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      // Analyze Headers
      const headerAlerts = CustomSecurityChecks.checkSecurityHeaders(
        this.targetUrl,
        probeRes.status,
        responseHeaders
      );
      rawAlerts.push(...headerAlerts);

      // Analyze Cookies
      const setCookieHeader = probeRes.headers.get('set-cookie');
      if (setCookieHeader) {
        const cookieAlerts = CustomSecurityChecks.checkCookies(this.targetUrl, [setCookieHeader]);
        rawAlerts.push(...cookieAlerts);
      }

      log(`Baseline probe completed: ${headerAlerts.length} header findings identified.`);
    } catch (err: unknown) {
      log(`Baseline HTTP probe failed: ${err instanceof Error ? err.message : 'Unknown network error'}`);
    }

    if (options.isCancelled?.()) {
      log('Scan cancelled by user.');
      return this.buildResult(rawAlerts, endpointsScanned, logs, startTime, options.profile);
    }

    // 3. OpenAPI / Swagger Import & API Assessment
    if (options.openApiSpecUrl) {
      log(`Importing OpenAPI specification from ${options.openApiSpecUrl}...`);
      try {
        const openApiCheck = this.validator.isUrlInScope(options.openApiSpecUrl);
        if (openApiCheck.allowed) {
          const specRes = await fetch(options.openApiSpecUrl);
          if (specRes.ok) {
            const specData = (await specRes.json()) as { paths?: Record<string, unknown> };
            const endpointPaths = Object.keys(specData.paths || {});
            log(`Discovered ${endpointPaths.length} API endpoints from OpenAPI spec.`);

            for (const ep of endpointPaths.slice(0, 20)) {
              endpointsScanned.push(`${this.targetUrl.replace(/\/+$/, '')}${ep}`);
            }
          }
        }
      } catch (err) {
        log(`OpenAPI discovery warning: ${err instanceof Error ? err.message : 'Failed to parse spec'}`);
      }
    }

    // 4. OWASP ZAP Integration (if ZAP daemon is available)
    const isZapAvailable = await this.zapClient.isAvailable();
    if (isZapAvailable) {
      log('OWASP ZAP daemon detected. Initiating spider and passive alert harvest...');
      try {
        const zapAlerts = await this.zapClient.getAlerts(this.targetUrl);
        // Filter ZAP alerts by in-scope rules
        const inScopeZapAlerts = zapAlerts.filter((a) => this.validator.isUrlInScope(a.uri).allowed);
        rawAlerts.push(...inScopeZapAlerts);
        log(`Collected ${inScopeZapAlerts.length} in-scope findings from OWASP ZAP.`);
      } catch (err) {
        log(`ZAP collection warning: ${err instanceof Error ? err.message : 'ZAP communication error'}`);
      }
    } else {
      log('OWASP ZAP daemon not running; completed native security baseline analysis.');
    }

    log(`Scan completed in ${Date.now() - startTime}ms.`);
    return this.buildResult(rawAlerts, endpointsScanned, logs, startTime, options.profile);
  }

  private buildResult(
    rawAlerts: RawScannerAlert[],
    endpointsScanned: string[],
    logs: string[],
    startTime: number,
    profile: ScanProfile
  ): ScanExecutionResult {
    // Deduplicate and normalize
    const normalizedMap = new Map<string, NormalizedFindingPayload>();

    for (const alert of rawAlerts) {
      const normalized = FindingNormalizer.normalizeAlert(alert, this.targetHost);
      if (!normalizedMap.has(normalized.findingId)) {
        normalizedMap.set(normalized.findingId, normalized);
      }
    }

    const findings = Array.from(normalizedMap.values());

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let infoCount = 0;

    for (const f of findings) {
      switch (f.severity) {
        case FindingSeverity.CRITICAL:
          criticalCount++;
          break;
        case FindingSeverity.HIGH:
          highCount++;
          break;
        case FindingSeverity.MEDIUM:
          mediumCount++;
          break;
        case FindingSeverity.LOW:
          lowCount++;
          break;
        case FindingSeverity.INFORMATIONAL:
        default:
          infoCount++;
          break;
      }
    }

    return {
      targetUrl: this.targetUrl,
      profile,
      durationMs: Date.now() - startTime,
      totalFindings: findings.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      findings,
      endpointsScanned,
      logs,
    };
  }
}
