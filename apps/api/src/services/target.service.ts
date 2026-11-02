import crypto from 'crypto';
import dns from 'dns/promises';
import { prisma } from './prisma.service.js';
import { CreateTargetInput } from '@vulnsight/validation';
import { TargetVerificationMethod, TargetVerificationStatus } from '@vulnsight/shared-types';

export class TargetService {
  public static async listTargets(projectId: string) {
    return prisma.authorizedTarget.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getTargetById(id: string) {
    return prisma.authorizedTarget.findUnique({
      where: { id },
    });
  }

  public static async createTarget(input: CreateTargetInput) {
    const parsed = new URL(input.url);
    const host = parsed.hostname;
    const verificationToken = `vulnsight-verify-${crypto.randomBytes(12).toString('hex')}`;

    const isDirectlyAuthorized =
      input.verificationMethod === TargetVerificationMethod.DOCUMENTED_AUTHORIZATION;

    return prisma.authorizedTarget.create({
      data: {
        projectId: input.projectId,
        url: input.url,
        host,
        inScopePaths: input.inScopePaths,
        excludedPaths: input.excludedPaths,
        verificationMethod: input.verificationMethod as unknown as import('@prisma/client').TargetVerificationMethod,
        verificationStatus: isDirectlyAuthorized
          ? TargetVerificationStatus.VERIFIED
          : TargetVerificationStatus.PENDING,
        isVerified: isDirectlyAuthorized,
        verificationToken,
        verifiedAt: isDirectlyAuthorized ? new Date() : null,
        authorizationNotes: input.authorizationNotes,
      },
    });
  }

  public static async verifyTarget(targetId: string): Promise<{ success: boolean; message: string }> {
    const target = await prisma.authorizedTarget.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      throw new Error(`Target ${targetId} not found`);
    }

    if (target.isVerified) {
      return { success: true, message: 'Target is already verified' };
    }

    let verified = false;

    if (target.verificationMethod === 'HTTP_FILE_TOKEN') {
      try {
        const verifyUrl = `${target.url.replace(/\/+$/, '')}/.well-known/vulnsight-verify.txt`;
        const res = await fetch(verifyUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const content = await res.text();
          if (content.trim() === target.verificationToken?.trim()) {
            verified = true;
          }
        }
      } catch (err) {
        return {
          success: false,
          message: `HTTP token verification failed: ${err instanceof Error ? err.message : 'File not reachable'}`,
        };
      }
    } else if (target.verificationMethod === 'DNS_TXT') {
      try {
        const records = await dns.resolveTxt(target.host);
        const flatRecords = records.flat();
        if (target.verificationToken && flatRecords.includes(target.verificationToken)) {
          verified = true;
        }
      } catch (err) {
        return {
          success: false,
          message: `DNS TXT verification failed: ${err instanceof Error ? err.message : 'Record not found'}`,
        };
      }
    } else {
      verified = true; // Documented authorization
    }

    if (verified) {
      await prisma.authorizedTarget.update({
        where: { id: targetId },
        data: {
          isVerified: true,
          verificationStatus: TargetVerificationStatus.VERIFIED,
          verifiedAt: new Date(),
        },
      });
      return { success: true, message: 'Target ownership verified successfully' };
    }

    return {
      success: false,
      message: 'Verification check could not confirm expected token or record.',
    };
  }
}
