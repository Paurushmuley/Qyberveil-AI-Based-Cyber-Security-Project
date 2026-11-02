import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { AIProvider } from '@vulnsight/shared-types';

describe('AI Provider Management Endpoints', () => {
  const app = createApp();

  it('GET /api/ai/models/GEMINI returns supported models catalog', async () => {
    const res = await request(app).get('/api/ai/models/GEMINI');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((m: { id: string }) => m.id === 'gemini-2.0-flash')).toBe(true);
  });

  it('GET /api/ai/models/INVALID_PROVIDER returns 400 Bad Request', async () => {
    const res = await request(app).get('/api/ai/models/UNKNOWN_PROVIDER');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('POST /api/ai/config rejects cloud provider config without an API key', async () => {
    const res = await request(app)
      .post('/api/ai/config')
      .send({
        provider: AIProvider.OPENAI,
        modelName: 'gpt-4o',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/ai/test returns structured failure diagnostics when Ollama daemon is unreachable', async () => {
    const res = await request(app)
      .post('/api/ai/test')
      .send({
        provider: AIProvider.OLLAMA,
        modelName: 'llama3.3',
        baseUrl: 'http://127.0.0.1:54321', // Unreachable port
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.data.provider).toBe(AIProvider.OLLAMA);
    expect(res.body.data.error).toBeDefined();
    expect(res.body.data.message).toContain('Failed to connect');
  });
});
