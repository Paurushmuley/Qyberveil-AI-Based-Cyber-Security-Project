import YAML from 'yaml';
import { prisma } from './prisma.service.js';
import { TriggerScanInput, isRestrictedOrPrivateHost } from '@vulnsight/validation';
import { ScannerEngine, ScopeRule } from '@vulnsight/scanner';
import { ScanStatus, FindingStatus } from '@vulnsight/shared-types';

export class ScanService {
  /**
   * Launches or queues a security scan against an authorized target
   */
  public static async triggerScan(userId: string, input: TriggerScanInput) {
    const target = await prisma.authorizedTarget.findUnique({
      where: { id: input.targetId },
      include: { project: true },
    });

    if (!target) {
      throw new Error(`Target ${input.targetId} not found`);
    }

    if (!target.isVerified && target.verificationStatus !== 'VERIFIED') {
      throw new Error(`Target ${target.url} is not verified. Active scanning requires verified ownership or documented scope authorization.`);
    }

    // Create initial Scan record in QUEUED state
    const scan = await prisma.scan.create({
      data: {
        projectId: input.projectId,
        targetId: input.targetId,
        status: ScanStatus.QUEUED,
        profile: input.profile as unknown as import('@prisma/client').ScanProfile,
      },
    });

    // Execute scan (runs asynchronously; in production worker or embedded server worker)
    ScanService.runScanWorkflow(scan.id, target, input, userId).catch((err) => {
      console.error(`[ScanService] Scan ${scan.id} failed:`, err);
    });

    return scan;
  }

  private static async runScanWorkflow(
    scanId: string,
    target: { id: string; url: string; host: string; inScopePaths: string[]; excludedPaths: string[] },
    input: TriggerScanInput,
    _userId: string
  ) {
    // 1. Mark scan as RUNNING
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: ScanStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    const scopeRule: ScopeRule = {
      targetUrl: target.url,
      host: target.host,
      inScopePaths: target.inScopePaths,
      excludedPaths: target.excludedPaths,
    };

    const engine = new ScannerEngine(scopeRule);

    try {
      const result = await engine.executeScan({
        profile: input.profile,
        customHeaders: input.customHeaders,
        openApiSpecUrl: input.openApiSpecUrl,
      });

      // 2. Persist findings & evidence to PostgreSQL
      for (const f of result.findings) {
        const finding = await prisma.finding.create({
          data: {
            scanId,
            findingId: f.findingId,
            title: f.title,
            description: f.description,
            category: f.category as unknown as import('@prisma/client').FindingCategory,
            severity: f.severity as unknown as import('@prisma/client').FindingSeverity,
            severityScore: f.severityScore,
            cvssScore: f.cvssScore,
            cweId: f.cweId,
            status: FindingStatus.POTENTIAL,
            endpoint: f.endpoint,
            httpMethod: f.httpMethod,
            param: f.param,
            confidence: f.confidence as unknown as import('@prisma/client').FindingConfidence,
            confidenceRationale: f.confidenceRationale,
            remediation: f.remediation,
            scannerSource: f.scannerSource,
            aiAnalyzed: false,
          },
        });

        // Store detailed request/response evidence
        await prisma.findingEvidence.create({
          data: {
            findingId: finding.id,
            requestPayload: f.evidence.requestPayload,
            responseStatus: f.evidence.responseStatus,
            responseHeaders: f.evidence.responseHeaders || {},
            responseBodySample: f.evidence.responseBodySample,
            evidenceText: f.evidence.evidenceText,
            curlCommand: f.evidence.curlCommand,
          },
        });
      }

      // 3. Mark Scan as COMPLETED with updated metrics
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: ScanStatus.COMPLETED,
          completedAt: new Date(),
          durationSeconds: Math.round(result.durationMs / 1000),
          totalFindings: result.totalFindings,
          criticalCount: result.criticalCount,
          highCount: result.highCount,
          mediumCount: result.mediumCount,
          lowCount: result.lowCount,
          infoCount: result.infoCount,
          summary: `Scan completed successfully. Found ${result.totalFindings} potential security findings across ${result.endpointsScanned.length} scanned endpoints.`,
        },
      });
    } catch (err: unknown) {
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: ScanStatus.FAILED,
          completedAt: new Date(),
          failureReason: err instanceof Error ? err.message : 'Unknown scanner failure',
        },
      });
    }
  }

  public static async getScanDetails(scanId: string) {
    return prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        target: true,
        project: true,
        findings: {
          include: { evidence: true },
          orderBy: { severityScore: 'desc' },
        },
        jobs: true,
        reports: true,
      },
    });
  }

  public static async cancelScan(scanId: string) {
    return prisma.scan.update({
      where: { id: scanId },
      data: {
        status: ScanStatus.CANCELLED,
        completedAt: new Date(),
        failureReason: 'Scan manually cancelled by user.',
      },
    });
  }

  /**
   * Compares two scans to identify new, persistent, and resolved findings
   */
  public static async compareScans(projectId: string, baseScanId: string, targetScanId: string) {
    const [baseScan, targetScan] = await Promise.all([
      prisma.scan.findUnique({
        where: { id: baseScanId },
        include: { findings: true },
      }),
      prisma.scan.findUnique({
        where: { id: targetScanId },
        include: { findings: true },
      }),
    ]);

    if (!baseScan || !targetScan) {
      throw new Error('Both base and target scan records are required for comparison');
    }

    const baseFindingIds = new Set(baseScan.findings.map((f) => f.findingId));
    const targetFindingIds = new Set(targetScan.findings.map((f) => f.findingId));

    const newFindings = targetScan.findings.filter((f) => !baseFindingIds.has(f.findingId));
    const resolvedFindings = baseScan.findings.filter((f) => !targetFindingIds.has(f.findingId));
    const persistentFindings = targetScan.findings.filter((f) => baseFindingIds.has(f.findingId));

    const comparison = await prisma.scanComparison.create({
      data: {
        projectId,
        baseScanId,
        targetScanId,
        newFindingsCount: newFindings.length,
        resolvedFindingsCount: resolvedFindings.length,
        persistentFindingsCount: persistentFindings.length,
      },
    });

    return {
      comparisonId: comparison.id,
      baseScanId,
      targetScanId,
      metrics: {
        newCount: newFindings.length,
        resolvedCount: resolvedFindings.length,
        persistentCount: persistentFindings.length,
      },
      newFindings,
      resolvedFindings,
      persistentFindings,
    };
  }

  /**
   * Updates finding lifecycle status (e.g. ACCEPTED_RISK, RESOLVED)
   */
  public static async updateFindingStatus(findingId: string, status: FindingStatus) {
    return prisma.finding.update({
      where: { id: findingId },
      data: { status: status as unknown as import('@prisma/client').FindingStatus },
    });
  }

  /**
   * Lists findings across scans with optional filters
   */
  public static async listFindings(options: {
    projectId?: string;
    scanId?: string;
    severity?: string;
    status?: string;
    category?: string;
    search?: string;
  }) {
    const where: any = {};
    if (options.scanId) {
      where.scanId = options.scanId;
    } else if (options.projectId) {
      where.scan = { projectId: options.projectId };
    }
    if (options.severity && options.severity !== 'ALL') {
      where.severity = options.severity;
    }
    if (options.status && options.status !== 'ALL') {
      where.status = options.status;
    }
    if (options.category && options.category !== 'ALL') {
      where.category = options.category;
    }
    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { endpoint: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { cweId: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    return prisma.finding.findMany({
      where,
      include: {
        evidence: true,
        scan: {
          include: {
            project: true,
            target: true,
          },
        },
      },
      orderBy: [
        { severityScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    });
  }

  /**
   * Parses an OpenAPI / Swagger spec from raw text/JSON or URL
   */
  public static async parseOpenApiSpec(input: { specContent?: string; specUrl?: string }) {
    let rawContent = input.specContent;

    if (!rawContent && input.specUrl) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(input.specUrl);
      } catch {
        throw new Error('Invalid OpenAPI URL provided');
      }

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP/HTTPS URLs are permitted');
      }

      if (process.env.ALLOW_PRIVATE_TARGETS !== 'true' && isRestrictedOrPrivateHost(parsedUrl.hostname)) {
        throw new Error(`SSRF blocked: Host ${parsedUrl.hostname} is restricted`);
      }

      const res = await fetch(input.specUrl, {
        headers: { 'User-Agent': 'Qyberveil-API-Scanner/0.1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch OpenAPI spec from URL (HTTP ${res.status})`);
      }

      rawContent = await res.text();
    }

    if (!rawContent) {
      throw new Error('Either specContent or specUrl must be provided');
    }

    let specObj: any;
    try {
      specObj = JSON.parse(rawContent);
    } catch {
      try {
        specObj = YAML.parse(rawContent);
      } catch {
        throw new Error('Failed to parse OpenAPI specification as JSON or YAML');
      }
    }

    if (!specObj || typeof specObj !== 'object') {
      throw new Error('Invalid OpenAPI specification format');
    }

    const title = specObj.info?.title || 'API Specification';
    const version = specObj.info?.version || '1.0.0';
    const description = specObj.info?.description || '';
    const servers = Array.isArray(specObj.servers)
      ? specObj.servers.map((s: any) => s.url)
      : specObj.host
      ? [`${specObj.schemes?.[0] || 'https'}://${specObj.host}${specObj.basePath || ''}`]
      : [];

    const endpoints: Array<{
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
    }> = [];

    const paths = specObj.paths || {};
    const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

    for (const [pathStr, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;
      const commonParams = Array.isArray((pathItem as any).parameters) ? (pathItem as any).parameters : [];

      for (const [method, op] of Object.entries(pathItem as any)) {
        if (!validMethods.includes(method.toLowerCase())) continue;
        const operation = op as any;
        const opParams = Array.isArray(operation.parameters) ? operation.parameters : [];
        const combinedParams = [...commonParams, ...opParams].map((p: any) => ({
          name: p.name || 'unnamed',
          in: p.in || 'query',
          required: Boolean(p.required),
          type: p.schema?.type || p.type || 'string',
          description: p.description,
        }));

        const security = Array.isArray(operation.security)
          ? operation.security.map((sec: any) => Object.keys(sec)[0]).filter(Boolean)
          : Array.isArray(specObj.security)
          ? specObj.security.map((sec: any) => Object.keys(sec)[0]).filter(Boolean)
          : [];

        endpoints.push({
          path: pathStr,
          method: method.toUpperCase(),
          summary: operation.summary || '',
          description: operation.description || '',
          operationId: operation.operationId,
          tags: Array.isArray(operation.tags) && operation.tags.length > 0 ? operation.tags : ['General'],
          parameters: combinedParams,
          hasRequestBody: Boolean(operation.requestBody || operation.parameters?.some((p: any) => p.in === 'body')),
          security,
        });
      }
    }

    return {
      title,
      version,
      description,
      servers,
      totalEndpoints: endpoints.length,
      endpoints,
      securitySchemes: specObj.components?.securitySchemes || specObj.securityDefinitions || {},
    };
  }
}
