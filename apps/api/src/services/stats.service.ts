import { prisma } from './prisma.service.js';
import { DashboardMetrics, ScanStatus, FindingSeverity, ScanProfile } from '@vulnsight/shared-types';

export class StatsService {
  public static async getDashboardMetrics(userId?: string): Promise<DashboardMetrics> {
    const projectFilter = userId ? { userId } : {};

    try {
      const [
        totalApplications,
        totalScans,
        criticalFindings,
        highFindings,
        mediumFindings,
        lowFindings,
        infoFindings,
        remediatedFindings,
        recentScansRaw,
      ] = await Promise.all([
        prisma.project.count({ where: projectFilter }),
        prisma.scan.count({
          where: userId ? { project: { userId } } : {},
        }),
        prisma.finding.count({
          where: {
            severity: FindingSeverity.CRITICAL,
            ...(userId && { scan: { project: { userId } } }),
          },
        }),
        prisma.finding.count({
          where: {
            severity: FindingSeverity.HIGH,
            ...(userId && { scan: { project: { userId } } }),
          },
        }),
        prisma.finding.count({
          where: {
            severity: FindingSeverity.MEDIUM,
            ...(userId && { scan: { project: { userId } } }),
          },
        }),
        prisma.finding.count({
          where: {
            severity: FindingSeverity.LOW,
            ...(userId && { scan: { project: { userId } } }),
          },
        }),
        prisma.finding.count({
          where: {
            severity: FindingSeverity.INFORMATIONAL,
            ...(userId && { scan: { project: { userId } } }),
          },
        }),
        prisma.finding.count({
          where: {
            status: 'RESOLVED',
            ...(userId && { scan: { project: { userId } } }),
          },
        }),
        prisma.scan.findMany({
          where: userId ? { project: { userId } } : {},
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            target: {
              select: { url: true },
            },
          },
        }),
      ]);

      return {
        totalApplications,
        totalScans,
        criticalFindings,
        highFindings,
        mediumFindings,
        lowFindings,
        infoFindings,
        totalFindings: criticalFindings + highFindings + mediumFindings + lowFindings + infoFindings,
        remediatedFindingsCount: remediatedFindings,
        recentScans: recentScansRaw.map((s) => ({
          id: s.id,
          projectId: s.projectId,
          targetId: s.targetId,
          targetUrl: s.target.url,
          status: s.status as unknown as ScanStatus,
          profile: s.profile as unknown as ScanProfile,
          startedAt: s.startedAt?.toISOString(),
          completedAt: s.completedAt?.toISOString(),
          durationSeconds: s.durationSeconds ?? undefined,
          totalFindings: s.totalFindings,
          criticalCount: s.criticalCount,
          highCount: s.highCount,
          mediumCount: s.mediumCount,
          lowCount: s.lowCount,
          infoCount: s.infoCount,
          summary: s.summary ?? undefined,
          failureReason: s.failureReason ?? undefined,
          createdAt: s.createdAt.toISOString(),
        })),
      };
    } catch {
      // Return zeroed initial state if database not initialized / connected yet
      return {
        totalApplications: 0,
        totalScans: 0,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
        infoFindings: 0,
        totalFindings: 0,
        remediatedFindingsCount: 0,
        recentScans: [],
      };
    }
  }
}
