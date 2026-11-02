import PDFDocument from 'pdfkit';
import { ReportGenerationInput } from './types.js';
import { AuditReportType } from '@vulnsight/shared-types';

export class PDFReportBuilder {
  /**
   * Generates a PDF buffer containing the complete security assessment report
   */
  public static async generateReportBuffer(input: ReportGenerationInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `Qyberveil Security Assessment - ${input.projectName}`,
            Author: 'Qyberveil Automated Platform',
            Subject: 'Application Security Assessment Report',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: Error) => reject(err));

        // 1. Header Banner
        doc.rect(40, 40, 515, 60).fill('#0B0F19');
        doc.fillColor('#06B6D4').fontSize(20).font('Helvetica-Bold').text('Qyberveil', 55, 52);
        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('APPLICATION SECURITY ASSESSMENT REPORT', 55, 78);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica').text(`Report Type: ${input.reportType}`, 380, 55, { align: 'right' });
        doc.fillColor('#94A3B8').fontSize(8).text(`Date: ${input.scanDate}`, 380, 70, { align: 'right' });

        doc.moveDown(4);

        // 2. Executive Scope & Assessment Summary
        doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('1. Assessment Scope & Target Overview');
        doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.5);

        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        doc.text(`Application Name: ${input.projectName}`);
        doc.text(`Target URL: ${input.targetUrl}`);
        doc.text(`Declared In-Scope Paths: ${input.inScopePaths.join(', ') || '/'}`);
        doc.text(`Assessor / Platform: Qyberveil Platform v0.1.0 (Automated Assessment)`);

        doc.moveDown(1.5);

        // 3. Finding Severity Breakdown Table
        doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('2. Vulnerability Posture & Severity Breakdown');
        doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.5);

        // Summary Cards
        const cardY = doc.y;
        const cardWidth = 95;
        const cardHeight = 45;

        // Critical
        doc.rect(40, cardY, cardWidth, cardHeight).fillAndStroke('#FFF1F2', '#FECDD3');
        doc.fillColor('#E11D48').fontSize(16).font('Helvetica-Bold').text(String(input.criticalCount), 50, cardY + 8);
        doc.fillColor('#9F1239').fontSize(8).font('Helvetica').text('CRITICAL', 50, cardY + 28);

        // High
        doc.rect(145, cardY, cardWidth, cardHeight).fillAndStroke('#FFFBEB', '#FDE68A');
        doc.fillColor('#D97706').fontSize(16).font('Helvetica-Bold').text(String(input.highCount), 155, cardY + 8);
        doc.fillColor('#92400E').fontSize(8).font('Helvetica').text('HIGH', 155, cardY + 28);

        // Medium
        doc.rect(250, cardY, cardWidth, cardHeight).fillAndStroke('#F0F9FF', '#BAE6FD');
        doc.fillColor('#0284C7').fontSize(16).font('Helvetica-Bold').text(String(input.mediumCount), 260, cardY + 8);
        doc.fillColor('#075985').fontSize(8).font('Helvetica').text('MEDIUM', 260, cardY + 28);

        // Low
        doc.rect(355, cardY, cardWidth, cardHeight).fillAndStroke('#F8FAFC', '#E2E8F0');
        doc.fillColor('#475569').fontSize(16).font('Helvetica-Bold').text(String(input.lowCount), 365, cardY + 8);
        doc.fillColor('#334155').fontSize(8).font('Helvetica').text('LOW', 365, cardY + 28);

        // Total
        doc.rect(460, cardY, cardWidth, cardHeight).fillAndStroke('#F1F5F9', '#CBD5E1');
        doc.fillColor('#0F172A').fontSize(16).font('Helvetica-Bold').text(String(input.totalFindings), 470, cardY + 8);
        doc.fillColor('#1E293B').fontSize(8).font('Helvetica').text('TOTAL FINDINGS', 470, cardY + 28);

        doc.y = cardY + cardHeight + 20;

        // Executive Narrative
        if (input.executiveSummary) {
          doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold').text('Executive Summary:');
          doc.fillColor('#475569').fontSize(9).font('Helvetica').text(input.executiveSummary, { lineGap: 2 });
          doc.moveDown(1);
        }

        // 4. Detailed Technical Findings (for technical and full assessment reports)
        if (input.reportType !== AuditReportType.EXECUTIVE_SUMMARY && input.findings.length > 0) {
          doc.addPage();
          doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('3. Detailed Technical Findings & Remediation');
          doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
          doc.moveDown(1);

          input.findings.forEach((f, idx) => {
            // Check if page overflow
            if (doc.y > 680) {
              doc.addPage();
            }

            doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text(`${idx + 1}. ${f.title}`);
            doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(
              `Severity: ${f.severity}  |  Category: ${f.category}  |  CWE: ${f.cweId || 'N/A'}  |  Endpoint: [${f.httpMethod}] ${f.endpoint}`
            );
            doc.moveDown(0.3);

            doc.fillColor('#334155').fontSize(8.5).font('Helvetica').text(f.description, { lineGap: 1.5 });

            if (f.evidenceText) {
              doc.moveDown(0.2);
              doc.fillColor('#0284C7').fontSize(8).font('Helvetica-Bold').text('Observed Evidence:');
              doc.fillColor('#475569').fontSize(8).font('Courier').text(f.evidenceText.slice(0, 300));
            }

            if (f.remediation) {
              doc.moveDown(0.2);
              doc.fillColor('#10B981').fontSize(8).font('Helvetica-Bold').text('Remediation Guidance:');
              doc.fillColor('#1E293B').fontSize(8).font('Helvetica').text(f.remediation.slice(0, 400), { lineGap: 1 });
            }

            doc.moveDown(1);
          });
        }

        // 5. Mandatory Disclaimer & Limitations
        if (doc.y > 660) {
          doc.addPage();
        } else {
          doc.moveDown(2);
        }

        doc.rect(40, doc.y, 515, 75).fillAndStroke('#F8FAFC', '#E2E8F0');
        const disclaimerY = doc.y + 8;
        doc.fillColor('#B45309').fontSize(9).font('Helvetica-Bold').text('IMPORTANT ASSESSMENT LIMITATIONS & LEGAL DISCLAIMER', 50, disclaimerY);
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(
          'This automated security assessment was performed by Qyberveil against verified, in-scope target boundaries. Automated DAST scanning does not constitute a comprehensive manual penetration test, architectural threat model, or exhaustive source-code audit. Zero-day vulnerabilities, complex multi-step business logic flaws, and non-deterministic authorization exploits may remain undetected. Remediations should be tested in staging before production deployment.',
          50,
          disclaimerY + 16,
          { width: 495, lineGap: 1.5 }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
