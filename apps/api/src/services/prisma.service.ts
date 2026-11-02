import { PrismaClient } from '@prisma/client';

class PrismaService {
  private static instance: PrismaClient | null = null;

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    }
    return PrismaService.instance;
  }

  public static async checkConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    const startTime = Date.now();
    try {
      const client = PrismaService.getInstance();
      await client.$queryRaw`SELECT 1`;
      return {
        connected: true,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      return {
        connected: false,
        error: err instanceof Error ? err.message : 'Unknown database error',
      };
    }
  }

  public static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
      PrismaService.instance = null;
    }
  }
}

export const prisma = PrismaService.getInstance();
export const checkDatabaseHealth = PrismaService.checkConnection;
export const disconnectPrisma = PrismaService.disconnect;
