import { Redis } from 'ioredis';
import { config } from '../config/index.js';

class RedisService {
  private static client: Redis | null = null;

  public static getClient(): Redis | null {
    if (!config.REDIS_URL) {
      return null;
    }

    if (!RedisService.client) {
      RedisService.client = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          if (times > 3) return null; // Stop reconnecting in dev/test if Redis not running
          return Math.min(times * 100, 2000);
        },
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      RedisService.client.on('error', () => {
        // Log or handle error passively; healthcheck captures it
      });
    }

    return RedisService.client;
  }

  public static async checkConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    if (!config.REDIS_URL) {
      return { connected: false, error: 'Redis URL not configured' };
    }

    const client = RedisService.getClient();
    if (!client) {
      return { connected: false, error: 'Redis client not initialized' };
    }

    const startTime = Date.now();
    try {
      if (client.status !== 'ready' && client.status !== 'connecting') {
        await client.connect().catch(() => {});
      }
      const pong = await client.ping();
      if (pong === 'PONG') {
        return {
          connected: true,
          latencyMs: Date.now() - startTime,
        };
      }
      return { connected: false, error: `Unexpected ping response: ${pong}` };
    } catch (err: unknown) {
      return {
        connected: false,
        error: err instanceof Error ? err.message : 'Redis connection error',
      };
    }
  }

  public static async disconnect(): Promise<void> {
    if (RedisService.client) {
      try {
        await RedisService.client.quit();
      } catch {
        RedisService.client.disconnect();
      }
      RedisService.client = null;
    }
  }
}

export const checkRedisHealth = RedisService.checkConnection;
export const disconnectRedis = RedisService.disconnect;
