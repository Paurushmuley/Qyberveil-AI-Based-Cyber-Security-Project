import { prisma } from './prisma.service.js';
import { EncryptionService } from './encryption.service.js';
import { AIProvider } from '@vulnsight/shared-types';
import { ConfigureAiProviderInput } from '@vulnsight/validation';
import {
  AIProviderFactory,
  SUPPORTED_MODELS,
  ProviderConnectionTestResult,
} from '@vulnsight/ai-providers';

export interface UserAIConfigView {
  id: string;
  provider: AIProvider;
  modelName: string;
  baseUrl?: string;
  hasKeyConfigured: boolean;
  maskedKey?: string;
  isActive: boolean;
  isTested: boolean;
  lastTestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class AIConfigService {
  /**
   * Retrieves all configured AI providers for the user with masked credentials
   */
  public static async getUserConfigs(userId: string): Promise<UserAIConfigView[]> {
    try {
      const records = await prisma.aIProviderConfiguration.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      return records.map((r) => {
        let masked: string | undefined = undefined;
        if (r.encryptedApiKey) {
          try {
            const decrypted = EncryptionService.decrypt(r.encryptedApiKey);
            masked = EncryptionService.maskApiKey(decrypted);
          } catch {
            masked = '****';
          }
        }

        return {
          id: r.id,
          provider: r.provider as unknown as AIProvider,
          modelName: r.modelName,
          baseUrl: r.baseUrl ?? undefined,
          hasKeyConfigured: !!r.encryptedApiKey,
          maskedKey: masked,
          isActive: r.isActive,
          isTested: r.isTested,
          lastTestedAt: r.lastTestedAt?.toISOString(),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Saves or updates a provider configuration, securely encrypting any submitted API key
   */
  public static async saveConfig(userId: string, input: ConfigureAiProviderInput) {
    let encryptedKey: string | undefined = undefined;

    if (input.apiKey && input.apiKey.trim().length > 0) {
      encryptedKey = EncryptionService.encrypt(input.apiKey.trim());
    }

    // Ensure user exists (for local development demo user)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'developer@vulnsight.local',
        passwordHash: 'dev_mock_hash',
      },
    });

    const existing = await prisma.aIProviderConfiguration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: input.provider as unknown as import('@prisma/client').AIProvider,
        },
      },
    });

    const data = {
      modelName: input.modelName,
      baseUrl: input.baseUrl,
      isActive: input.isActive,
      ...(encryptedKey ? { encryptedApiKey: encryptedKey } : {}),
    };

    if (existing) {
      return prisma.aIProviderConfiguration.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.aIProviderConfiguration.create({
      data: {
        userId,
        provider: input.provider as unknown as import('@prisma/client').AIProvider,
        ...data,
      },
    });
  }

  /**
   * Deletes a saved provider configuration and its encrypted key
   */
  public static async deleteConfig(userId: string, provider: AIProvider) {
    return prisma.aIProviderConfiguration.deleteMany({
      where: {
        userId,
        provider: provider as unknown as import('@prisma/client').AIProvider,
      },
    });
  }

  /**
   * Tests connectivity to a provider using either a freshly submitted key or the stored encrypted key
   */
  public static async testProvider(
    userId: string,
    params: {
      provider: AIProvider;
      modelName: string;
      apiKey?: string;
      baseUrl?: string;
    }
  ): Promise<ProviderConnectionTestResult> {
    let activeKey = params.apiKey;

    // If key not provided in test payload, attempt to retrieve from stored encrypted record
    if (!activeKey && params.provider !== AIProvider.OLLAMA) {
      const record = await prisma.aIProviderConfiguration.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: params.provider as unknown as import('@prisma/client').AIProvider,
          },
        },
      });

      if (record?.encryptedApiKey) {
        activeKey = EncryptionService.decrypt(record.encryptedApiKey);
      }
    }

    const adapter = AIProviderFactory.createAdapter({
      provider: params.provider,
      modelName: params.modelName,
      apiKey: activeKey,
      baseUrl: params.baseUrl,
    });

    const result = await adapter.testConnection();

    // If test was successful, update the isTested flag in the database if record exists
    if (result.success) {
      try {
        await prisma.aIProviderConfiguration.updateMany({
          where: {
            userId,
            provider: params.provider as unknown as import('@prisma/client').AIProvider,
          },
          data: {
            isTested: true,
            lastTestedAt: new Date(),
          },
        });
      } catch {
        // Non-fatal if DB not yet initialized
      }
    }

    return result;
  }

  /**
   * Returns supported models catalog
   */
  public static getSupportedModels(provider: AIProvider) {
    return SUPPORTED_MODELS[provider] || [];
  }
}
