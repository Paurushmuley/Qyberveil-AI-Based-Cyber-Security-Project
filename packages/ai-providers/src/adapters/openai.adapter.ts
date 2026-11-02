import OpenAI from 'openai';
import { AIProvider } from '@vulnsight/shared-types';
import { z } from 'zod';
import {
  AIProviderAdapter,
  AICompletionOptions,
  ProviderConnectionTestResult,
} from '../types.js';
import { SUPPORTED_MODELS } from '../models.js';

export class OpenAIAdapter implements AIProviderAdapter {
  public readonly provider = AIProvider.OPENAI;
  public readonly modelName: string;
  private client: OpenAI;

  constructor(apiKey: string, modelName = 'gpt-4o', baseUrl?: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('OpenAI API key is required');
    }
    this.modelName = modelName;
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
    });
  }

  public async testConnection(): Promise<ProviderConnectionTestResult> {
    const startTime = Date.now();
    try {
      // Test authentication and model access with a low-cost 5-token ping
      await this.client.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: 'Respond with "PONG" only.' }],
        max_tokens: 5,
        temperature: 0,
      });

      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        provider: this.provider,
        model: this.modelName,
        latencyMs,
        message: `Successfully connected to OpenAI (${this.modelName}). Verification response received.`,
        availableModels: await this.listAvailableModels(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: this.provider,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
        message: 'Failed to connect to OpenAI',
        error: err instanceof Error ? err.message : 'Unknown OpenAI error',
      };
    }
  }

  public async generateCompletion(prompt: string, options?: AICompletionOptions): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await this.client.chat.completions.create({
      model: this.modelName,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 2048,
      response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response');
    }

    return content;
  }

  public async generateStructuredCompletion<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: AICompletionOptions
  ): Promise<T> {
    const enhancedPrompt = `${prompt}\n\nYou MUST respond with valid JSON object adhering to the schema.`;

    const rawOutput = await this.generateCompletion(enhancedPrompt, {
      ...options,
      jsonMode: true,
    });

    try {
      const parsedJson = JSON.parse(rawOutput);
      return schema.parse(parsedJson);
    } catch (err) {
      throw new Error(
        `OpenAI output failed schema validation: ${err instanceof Error ? err.message : 'Invalid JSON'}. Raw output: ${rawOutput.slice(0, 200)}...`
      );
    }
  }

  public async listAvailableModels(): Promise<string[]> {
    try {
      const list = await this.client.models.list();
      const ids = list.data.map((m) => m.id);
      return ids.filter((id) => id.startsWith('gpt-') || id.startsWith('o3-') || id.startsWith('o1-'));
    } catch {
      return (SUPPORTED_MODELS[AIProvider.OPENAI] || []).map((m) => m.id);
    }
  }
}
