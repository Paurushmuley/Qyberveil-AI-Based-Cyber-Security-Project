import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { AIProvider } from '@vulnsight/shared-types';
import {
  AIProviderFactory,
  GeminiAdapter,
  OpenAIAdapter,
  GrokAdapter,
  OllamaAdapter,
  SUPPORTED_MODELS,
  DEFAULT_MODEL_BY_PROVIDER,
} from '../index.js';

describe('AIProviderFactory', () => {
  it('creates a GeminiAdapter with valid API key', () => {
    const adapter = AIProviderFactory.createAdapter({
      provider: AIProvider.GEMINI,
      modelName: 'gemini-2.0-flash',
      apiKey: 'test-gemini-key',
    });
    expect(adapter).toBeInstanceOf(GeminiAdapter);
    expect(adapter.provider).toBe(AIProvider.GEMINI);
    expect(adapter.modelName).toBe('gemini-2.0-flash');
  });

  it('creates an OpenAIAdapter with valid API key', () => {
    const adapter = AIProviderFactory.createAdapter({
      provider: AIProvider.OPENAI,
      modelName: 'gpt-4o',
      apiKey: 'sk-test-key',
    });
    expect(adapter).toBeInstanceOf(OpenAIAdapter);
    expect(adapter.provider).toBe(AIProvider.OPENAI);
    expect(adapter.modelName).toBe('gpt-4o');
  });

  it('creates a GrokAdapter with valid API key', () => {
    const adapter = AIProviderFactory.createAdapter({
      provider: AIProvider.GROK,
      modelName: 'grok-2',
      apiKey: 'xai-test-key',
    });
    expect(adapter).toBeInstanceOf(GrokAdapter);
    expect(adapter.provider).toBe(AIProvider.GROK);
    expect(adapter.modelName).toBe('grok-2');
  });

  it('creates an OllamaAdapter without requiring an API key', () => {
    const adapter = AIProviderFactory.createAdapter({
      provider: AIProvider.OLLAMA,
      modelName: 'llama3.3',
      baseUrl: 'http://localhost:11434',
    });
    expect(adapter).toBeInstanceOf(OllamaAdapter);
    expect(adapter.provider).toBe(AIProvider.OLLAMA);
    expect(adapter.modelName).toBe('llama3.3');
  });

  it('throws an error if cloud providers are configured without an API key', () => {
    expect(() =>
      AIProviderFactory.createAdapter({
        provider: AIProvider.OPENAI,
        modelName: 'gpt-4o',
      })
    ).toThrow('API Key is required');
  });

  it('uses default models when not explicitly specified', () => {
    expect(DEFAULT_MODEL_BY_PROVIDER[AIProvider.GEMINI]).toBe('gemini-2.0-flash');
    expect(DEFAULT_MODEL_BY_PROVIDER[AIProvider.OPENAI]).toBe('gpt-4o');
    expect(DEFAULT_MODEL_BY_PROVIDER[AIProvider.GROK]).toBe('grok-2');
    expect(DEFAULT_MODEL_BY_PROVIDER[AIProvider.OLLAMA]).toBe('llama3.3');
  });
});

describe('OllamaAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports connection success when Ollama /api/tags returns models', async () => {
    const adapter = new OllamaAdapter('llama3.3', 'http://127.0.0.1:11434');

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [{ name: 'llama3.3:latest' }, { name: 'deepseek-r1:latest' }],
      }),
    } as Response);

    const result = await adapter.testConnection();
    expect(result.success).toBe(true);
    expect(result.provider).toBe(AIProvider.OLLAMA);
    expect(result.model).toBe('llama3.3');
    expect(result.message).toContain('is ready');
  });

  it('reports helpful error when Ollama daemon is offline', async () => {
    const adapter = new OllamaAdapter('llama3.3', 'http://127.0.0.1:11434');

    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await adapter.testConnection();
    expect(result.success).toBe(false);
    expect(result.error).toContain('ECONNREFUSED');
    expect(result.error).toContain('Ensure Ollama is running');
  });

  it('parses structured JSON output correctly against a Zod schema', async () => {
    const adapter = new OllamaAdapter('llama3.3', 'http://127.0.0.1:11434');

    const testSchema = z.object({
      vulnerability: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
      remediationSteps: z.array(z.string()),
    });

    const mockOutput = JSON.stringify({
      vulnerability: 'SQL Injection',
      severity: 'HIGH',
      remediationSteps: ['Use parameterized queries', 'Sanitize input'],
    });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: mockOutput }),
    } as Response);

    const parsed = await adapter.generateStructuredCompletion('Analyze SQL vulnerability', testSchema);
    expect(parsed.vulnerability).toBe('SQL Injection');
    expect(parsed.severity).toBe('HIGH');
    expect(parsed.remediationSteps).toHaveLength(2);
  });
});

describe('Supported Model Catalog', () => {
  it('defines recommended models for all 4 providers', () => {
    for (const provider of [AIProvider.GEMINI, AIProvider.OPENAI, AIProvider.GROK, AIProvider.OLLAMA]) {
      const models = SUPPORTED_MODELS[provider];
      expect(models.length).toBeGreaterThan(0);
      const hasRecommended = models.some((m) => m.recommended);
      expect(hasRecommended).toBe(true);
    }
  });
});
