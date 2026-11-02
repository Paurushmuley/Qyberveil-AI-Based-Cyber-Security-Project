import crypto from 'crypto';
import {
  FindingSeverity,
  FindingCategory,
  FindingStatus,
  FindingConfidence,
} from '@vulnsight/shared-types';
import { RawScannerAlert, NormalizedFindingPayload } from './types.js';

export class FindingNormalizer {
  /**
   * Generates a deterministic hash identifier for a finding based on core coordinates
   * to enable cross-scan correlation, deduplication, and regression re-testing.
   */
  public static generateFindingId(
    host: string,
    path: string,
    category: string,
    param?: string,
    cweId?: string
  ): string {
    const rawSignature = [
      host.toLowerCase(),
      path.toLowerCase().replace(/\/+$/, '') || '/',
      category.toUpperCase(),
      (param || '').toLowerCase(),
      cweId || '',
    ].join('|');

    return crypto.createHash('sha256').update(rawSignature).digest('hex').slice(0, 16);
  }

  /**
   * Maps raw scanner alerts (ZAP, OpenAPI, or custom checks) to the internal normalized schema.
   */
  public static normalizeAlert(alert: RawScannerAlert, targetHost: string): NormalizedFindingPayload {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(alert.uri);
    } catch {
      parsedUrl = new URL(`http://${targetHost}${alert.uri.startsWith('/') ? alert.uri : `/${alert.uri}`}`);
    }

    const path = parsedUrl.pathname || '/';
    const category = FindingNormalizer.mapCategory(alert.alertName, alert.description, alert.cweId);
    const severity = FindingNormalizer.mapSeverity(alert.rawSeverity);
    const confidence = FindingNormalizer.mapConfidence(alert.rawConfidence);

    const findingId = FindingNormalizer.generateFindingId(
      targetHost,
      path,
      category,
      alert.param,
      alert.cweId
    );

    const curlCommand = FindingNormalizer.buildCurlCommand(
      alert.uri,
      alert.method,
      alert.requestHeaders,
      alert.requestBody
    );

    return {
      findingId,
      title: alert.alertName,
      description: alert.description,
      category,
      severity,
      severityScore: FindingNormalizer.getSeverityScore(severity),
      cvssScore: FindingNormalizer.estimateCvssScore(severity, confidence),
      cweId: alert.cweId || undefined,
      status: FindingStatus.POTENTIAL,
      endpoint: path,
      httpMethod: alert.method.toUpperCase(),
      param: alert.param || undefined,
      confidence,
      confidenceRationale: `Observed via ${alert.source} with scanner confidence level "${alert.rawConfidence}".`,
      remediation: alert.solution || undefined,
      scannerSource: alert.source,
      evidence: {
        requestPayload: alert.attack || alert.requestBody || undefined,
        responseStatus: alert.responseStatus,
        responseHeaders: alert.responseHeaders,
        responseBodySample: alert.responseBodySample,
        evidenceText: alert.evidenceText,
        curlCommand,
      },
    };
  }

  private static mapSeverity(raw: string): FindingSeverity {
    switch (raw.toLowerCase()) {
      case 'high':
        return FindingSeverity.HIGH;
      case 'medium':
        return FindingSeverity.MEDIUM;
      case 'low':
        return FindingSeverity.LOW;
      case 'informational':
      case 'info':
      default:
        return FindingSeverity.INFORMATIONAL;
    }
  }

  private static mapConfidence(raw: string): FindingConfidence {
    switch (raw.toLowerCase()) {
      case 'high':
      case 'certain':
        return FindingConfidence.HIGH;
      case 'medium':
      case 'firm':
        return FindingConfidence.MEDIUM;
      case 'low':
      case 'tentative':
        return FindingConfidence.LOW;
      case 'false positive':
        return FindingConfidence.FALSE_POSITIVE_SUSPECTED;
      default:
        return FindingConfidence.MEDIUM;
    }
  }

  private static mapCategory(title: string, desc: string, cwe?: string): FindingCategory {
    const text = `${title} ${desc} CWE-${cwe || ''}`.toLowerCase();

    if (text.includes('sql') || text.includes('injection') || text.includes('cwe-89')) {
      return FindingCategory.INJECTION;
    }
    if (text.includes('cross site scripting') || text.includes('xss') || text.includes('cwe-79')) {
      return FindingCategory.CROSS_SITE_SCRIPTING;
    }
    if (text.includes('ssrf') || text.includes('server side request forgery') || text.includes('cwe-918')) {
      return FindingCategory.SSRF;
    }
    if (text.includes('authentication') || text.includes('session') || text.includes('cwe-287')) {
      return FindingCategory.BROKEN_AUTHENTICATION;
    }
    if (text.includes('access control') || text.includes('authorization') || text.includes('cwe-285')) {
      return FindingCategory.BROKEN_ACCESS_CONTROL;
    }
    if (text.includes('cors') || text.includes('header') || text.includes('cookie') || text.includes('cwe-16')) {
      return FindingCategory.SECURITY_MISCONFIGURATION;
    }
    if (text.includes('disclosure') || text.includes('sensitive') || text.includes('leak') || text.includes('cwe-200')) {
      return FindingCategory.SENSITIVE_DATA_EXPOSURE;
    }
    if (text.includes('openapi') || text.includes('swagger') || text.includes('api')) {
      return FindingCategory.API_VULNERABILITY;
    }
    return FindingCategory.OTHER;
  }

  private static getSeverityScore(severity: FindingSeverity): number {
    switch (severity) {
      case FindingSeverity.CRITICAL:
        return 9.5;
      case FindingSeverity.HIGH:
        return 8.0;
      case FindingSeverity.MEDIUM:
        return 5.5;
      case FindingSeverity.LOW:
        return 3.0;
      case FindingSeverity.INFORMATIONAL:
      default:
        return 0.5;
    }
  }

  private static estimateCvssScore(severity: FindingSeverity, confidence: FindingConfidence): number {
    const base = FindingNormalizer.getSeverityScore(severity);
    const confidenceMultiplier =
      confidence === FindingConfidence.HIGH
        ? 1.0
        : confidence === FindingConfidence.MEDIUM
        ? 0.9
        : 0.8;
    return Number((base * confidenceMultiplier).toFixed(1));
  }

  private static buildCurlCommand(
    uri: string,
    method: string,
    headers?: Record<string, string>,
    body?: string
  ): string {
    const parts = [`curl -X ${method.toUpperCase()}`, `"${uri}"`];

    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (!['host', 'content-length'].includes(k.toLowerCase())) {
          parts.push(`-H "${k}: ${v}"`);
        }
      }
    }

    if (body) {
      parts.push(`-d '${body}'`);
    }

    return parts.join(' \\\n  ');
  }
}
