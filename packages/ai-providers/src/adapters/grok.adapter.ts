import OpenAI from 'openai';
import { AIProvider } from '@vulnsight/shared-types';
import { z } from 'zod';
import {
  AIProviderAdapter,
  AICompletionOptions,
  ProviderConnectionTestResult,
} from '../types.js';
import { SUPPORTED_MODELS } from '../models.js';

export class GrokAdapter implements AIProviderAdapter {
  public readonly provider = AIProvider.GROK;
  public readonly modelName: string;
  private client: OpenAI;

  constructor(apiKey: string, modelName = 'grok-2', baseUrl = 'https://api.x.ai/v1') {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('xAI Grok API key is required');
    }
    this.modelName = modelName;
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    });
  }

  public async testConnection(): Promise<ProviderConnectionTestResult> {
    const startTime = Date.now();
    try {
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
        message: `Successfully connected to xAI Grok (${this.modelName}). Verification response received.`,
        availableModels: await this.listAvailableModels(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: this.provider,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
        message: 'Failed to connect to xAI Grok',
        error: err instanceof Error ? err.message : 'Unknown xAI error',
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
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error('xAI Grok returned an empty response');
    }

    return content;
  }

  public async generateStructuredCompletion<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: AICompletionOptions
  ): Promise<T> {
    const enhancedPrompt = `${prompt}\n\nYou MUST respond with valid JSON adhering to the schema. Do not enclose the output in code fences.`;

    const rawOutput = await this.generateCompletion(enhancedPrompt, options);

    const cleaned = rawOutput
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      const parsedJson = JSON.parse(cleaned);
      return schema.parse(parsedJson);
    } catch (err) {
      throw new Error(
        `Grok output failed schema validation: ${err instanceof Error ? err.message : 'Invalid JSON'}. Raw output: ${cleaned.slice(0, 200)}...`
      );
    }
  }

  public async listAvailableModels(): Promise<string[]> {
    try {
      const list = await this.client.models.list();
      return list.data.map((m) => m.id);
    } catch {
      return (SUPPORTED_MODELS[AIProvider.GROK] || []).map((m) => m.id);
    }
  }
}
