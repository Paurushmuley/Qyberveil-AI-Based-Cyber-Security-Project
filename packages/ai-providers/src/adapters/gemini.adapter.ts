import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from '@vulnsight/shared-types';
import { z } from 'zod';
import {
  AIProviderAdapter,
  AICompletionOptions,
  ProviderConnectionTestResult,
} from '../types.js';
import { SUPPORTED_MODELS } from '../models.js';

export class GeminiAdapter implements AIProviderAdapter {
  public readonly provider = AIProvider.GEMINI;
  public readonly modelName: string;
  private client: GoogleGenerativeAI;

  constructor(apiKey: string, modelName = 'gemini-2.0-flash') {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('Gemini API key is required');
    }
    this.modelName = modelName;
    this.client = new GoogleGenerativeAI(apiKey);
  }

  public async testConnection(): Promise<ProviderConnectionTestResult> {
    const startTime = Date.now();
    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });
      
      // Fast lightweight validation test
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Respond with "PONG" only.' }] }],
        generationConfig: { maxOutputTokens: 5, temperature: 0 },
      });

      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        provider: this.provider,
        model: this.modelName,
        latencyMs,
        message: `Successfully connected to Google Gemini (${this.modelName}). Verification response received.`,
        availableModels: await this.listAvailableModels(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: this.provider,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
        message: 'Failed to connect to Google Gemini',
        error: err instanceof Error ? err.message : 'Unknown Gemini API error',
      };
    }
  }

  public async generateCompletion(prompt: string, options?: AICompletionOptions): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: options?.systemPrompt,
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 2048,
        responseMimeType: options?.jsonMode ? 'application/json' : 'text/plain',
      },
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  public async generateStructuredCompletion<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: AICompletionOptions
  ): Promise<T> {
    const enhancedPrompt = `${prompt}\n\nYou MUST respond with valid JSON that strictly adheres to the requested schema. Do not enclose the output in explanation text.`;

    const rawOutput = await this.generateCompletion(enhancedPrompt, {
      ...options,
      jsonMode: true,
    });

    // Strip optional markdown fencing if returned
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
        `Gemini output failed schema validation: ${err instanceof Error ? err.message : 'Invalid JSON'}. Raw output: ${cleaned.slice(0, 200)}...`
      );
    }
  }

  public async listAvailableModels(): Promise<string[]> {
    return (SUPPORTED_MODELS[AIProvider.GEMINI] || []).map((m) => m.id);
  }
}
