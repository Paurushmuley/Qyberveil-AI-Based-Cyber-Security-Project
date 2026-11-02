import { AIProvider } from '@vulnsight/shared-types';
import { z } from 'zod';
import {
  AIProviderAdapter,
  AICompletionOptions,
  ProviderConnectionTestResult,
} from '../types.js';
import { SUPPORTED_MODELS } from '../models.js';

export class OllamaAdapter implements AIProviderAdapter {
  public readonly provider = AIProvider.OLLAMA;
  public readonly modelName: string;
  public readonly baseUrl: string;

  constructor(modelName = 'llama3.3', baseUrl = 'http://localhost:11434') {
    this.modelName = modelName;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public async testConnection(): Promise<ProviderConnectionTestResult> {
    const startTime = Date.now();
    try {
      // Query Ollama /api/tags to check health and list installed local models
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Ollama server returned an error status`);
      }

      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const installedModels = (data.models || []).map((m) => m.name.split(':')[0] as string);
      const latencyMs = Date.now() - startTime;

      const hasConfiguredModel = installedModels.some(
        (name) => name.toLowerCase() === this.modelName.toLowerCase() || name.startsWith(this.modelName)
      );

      return {
        success: true,
        provider: this.provider,
        model: this.modelName,
        latencyMs,
        message: hasConfiguredModel
          ? `Connected to local Ollama (${this.baseUrl}). Model "${this.modelName}" is ready.`
          : `Connected to local Ollama (${this.baseUrl}). Note: "${this.modelName}" is not yet pulled (available: ${installedModels.join(', ') || 'none'}). Run "ollama run ${this.modelName}" to download it.`,
        availableModels: installedModels.length > 0 ? installedModels : await this.listAvailableModels(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: this.provider,
        model: this.modelName,
        latencyMs: Date.now() - startTime,
        message: `Failed to connect to local Ollama daemon at ${this.baseUrl}`,
        error:
          err instanceof Error
            ? `${err.message}. Ensure Ollama is running locally ('ollama serve' or Docker).`
            : 'Unknown Ollama connection error',
      };
    }
  }

  public async generateCompletion(prompt: string, options?: AICompletionOptions): Promise<string> {
    const payload = {
      model: this.modelName,
      prompt,
      system: options?.systemPrompt,
      format: options?.jsonMode ? 'json' : undefined,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.2,
        num_predict: options?.maxTokens ?? 2048,
      },
    };

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama generate failed (HTTP ${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { response?: string };
    if (!data.response) {
      throw new Error('Ollama returned empty response');
    }

    return data.response;
  }

  public async generateStructuredCompletion<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: AICompletionOptions
  ): Promise<T> {
    const rawOutput = await this.generateCompletion(prompt, {
      ...options,
      jsonMode: true,
    });

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
        `Ollama output failed schema validation: ${err instanceof Error ? err.message : 'Invalid JSON'}. Raw output: ${cleaned.slice(0, 200)}...`
      );
    }
  }

  public async listAvailableModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (res.ok) {
        const data = (await res.json()) as { models?: Array<{ name: string }> };
        if (data.models && data.models.length > 0) {
          return data.models.map((m) => m.name);
        }
      }
    } catch {
      // Fallback to static catalog if Ollama service is offline
    }
    return (SUPPORTED_MODELS[AIProvider.OLLAMA] || []).map((m) => m.id);
  }
}
