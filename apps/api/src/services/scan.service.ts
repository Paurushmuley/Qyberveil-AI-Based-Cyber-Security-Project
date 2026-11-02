import { prisma } from './prisma.service.js';
import { TriggerScanInput } from '@vulnsight/validation';
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
}
