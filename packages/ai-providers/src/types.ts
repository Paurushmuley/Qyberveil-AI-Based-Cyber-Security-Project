import { AIProvider } from '@vulnsight/shared-types';
import { z } from 'zod';

export interface ProviderConnectionTestResult {
  success: boolean;
  provider: AIProvider;
  model: string;
  latencyMs: number;
  message: string;
  availableModels?: string[];
  error?: string;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
}

export interface AIProviderConfigOptions {
  provider: AIProvider;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ModelDescriptor {
  id: string;
  name: string;
  description: string;
  recommended: boolean;
  contextWindow?: number;
}

export interface AIProviderAdapter {
  readonly provider: AIProvider;
  readonly modelName: string;

  /**
   * Performs an isolated connectivity and authentication test.
   */
  testConnection(): Promise<ProviderConnectionTestResult>;

  /**
   * Generates a raw text completion from the provider.
   */
  generateCompletion(prompt: string, options?: AICompletionOptions): Promise<string>;

  /**
   * Generates a completion and validates the output against a strict Zod schema.
   */
  generateStructuredCompletion<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: AICompletionOptions
  ): Promise<T>;

  /**
   * Queries or lists supported/available models for this provider.
   */
  listAvailableModels(): Promise<string[]>;
}
