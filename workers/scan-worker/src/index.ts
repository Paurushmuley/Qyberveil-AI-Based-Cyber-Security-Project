import dotenv from 'dotenv';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { ScannerEngine, ScopeRule } from '@vulnsight/scanner';
import { ScanStatus, FindingStatus } from '@vulnsight/shared-types';

dotenv.config();

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('🛡️ VulnSight AI Scan Worker starting...');
console.log(`   Connecting to Redis Queue: ${redisUrl}`);

interface ScanJobData {
  scanId: string;
  targetId: string;
  projectId: string;
  targetUrl: string;
  host: string;
  inScopePaths: string[];
  excludedPaths: string[];
  profile: string;
  customHeaders?: Record<string, string>;
  openApiSpecUrl?: string;
  userId: string;
}

const worker = new Worker<ScanJobData>(
  'scan-jobs',
  async (job: Job<ScanJobData>) => {
    const { scanId, targetUrl, host, inScopePaths, excludedPaths, profile, customHeaders, openApiSpecUrl } = job.data;
    console.log(`[Worker] Picked up scan job ${job.id} for target: ${targetUrl}`);

    // Update scan status to RUNNING
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: ScanStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    const scopeRule: ScopeRule = {
      targetUrl,
      host,
      inScopePaths,
      excludedPaths,
    };

    const engine = new ScannerEngine(scopeRule);

    try {
      const result = await engine.executeScan({
        profile: profile as unknown as import('@vulnsight/shared-types').ScanProfile,
        customHeaders,
        openApiSpecUrl,
        onProgress: async (progress, msg) => {
          await job.updateProgress(progress);
          console.log(`[Scan ${scanId}] (${progress}%) ${msg}`);
        },
      });

      // Persist findings & evidence
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

      // Mark COMPLETED
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
          summary: `Scan completed. Identified ${result.totalFindings} findings across ${result.endpointsScanned.length} scanned endpoints.`,
        },
      });

      console.log(`[Worker] Scan ${scanId} completed with ${result.totalFindings} findings.`);
      return { success: true, totalFindings: result.totalFindings };
    } catch (err: unknown) {
      console.error(`[Worker] Scan ${scanId} failed:`, err);
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: ScanStatus.FAILED,
          completedAt: new Date(),
          failureReason: err instanceof Error ? err.message : 'Scan execution error',
        },
      });
      throw err;
    }
  },
  {
    connection: {
      url: redisUrl,
      maxRetriesPerRequest: null,
    },
    concurrency: 2,
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
});

const handleShutdown = async () => {
  console.log('\n[Worker] Gracefully closing scan worker...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
