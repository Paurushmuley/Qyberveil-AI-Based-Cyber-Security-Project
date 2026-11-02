import { prisma } from './prisma.service.js';
import { PDFReportBuilder } from '@vulnsight/reports';
import { AuditReportType } from '@vulnsight/shared-types';

export class ReportService {
  /**
   * Generates a downloadable security audit PDF report for a scan
   */
  public static async generateReport(scanId: string, reportType: AuditReportType) {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        project: true,
        target: true,
        findings: {
          include: { evidence: true },
          orderBy: { severityScore: 'desc' },
        },
      },
    });

    if (!scan) {
      throw new Error(`Scan ${scanId} not found`);
    }

    const pdfBuffer = await PDFReportBuilder.generateReportBuffer({
      projectName: scan.project.name,
      targetUrl: scan.target.url,
      inScopePaths: scan.target.inScopePaths,
      scanDate: scan.completedAt ? scan.completedAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      reportType,
      executiveSummary: scan.summary ?? undefined,
      totalFindings: scan.totalFindings,
      criticalCount: scan.criticalCount,
      highCount: scan.highCount,
      mediumCount: scan.mediumCount,
      lowCount: scan.lowCount,
      infoCount: scan.infoCount,
      findings: scan.findings.map((f) => ({
        findingId: f.findingId,
        title: f.title,
        description: f.description,
        category: f.category as unknown as import('@vulnsight/shared-types').FindingCategory,
        severity: f.severity as unknown as import('@vulnsight/shared-types').FindingSeverity,
        endpoint: f.endpoint,
        httpMethod: f.httpMethod,
        cweId: f.cweId ?? undefined,
        cvssScore: f.cvssScore ?? undefined,
        evidenceText: f.evidence[0]?.evidenceText ?? undefined,
        remediation: f.remediation ?? undefined,
      })),
    });

    // Save report record in PostgreSQL
    const auditReport = await prisma.auditReport.create({
      data: {
        projectId: scan.projectId,
        scanId: scan.id,
        reportType: reportType as unknown as import('@prisma/client').AuditReportType,
        title: `${scan.project.name} - ${reportType} Report`,
        summary: scan.summary,
      },
    });

    return {
      reportId: auditReport.id,
      pdfBuffer,
      filename: `Qyberveil_${scan.project.name.replace(/\s+/g, '_')}_${reportType}_${scan.id.slice(0, 8)}.pdf`,
    };
  }

  public static async listReports(projectId: string) {
    return prisma.auditReport.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { scan: true },
    });
  }
}
