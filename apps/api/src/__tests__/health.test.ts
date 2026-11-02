import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Health Endpoints', () => {
  const app = createApp();

  it('GET /health returns health structure with timestamp and version', async () => {
    const res = await request(app).get('/health');
    
    // Status can be 200 (if DB/Redis is reachable) or 503 (if primary DB not yet provisioned in test)
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('version');
    expect(res.body.data).toHaveProperty('services');
    expect(res.body.data.services).toHaveProperty('database');
    expect(res.body.data.services).toHaveProperty('redis');
  });

  it('GET /api/health also returns matching health status', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body.data).toHaveProperty('uptimeSeconds');
  });

  it('GET /unknown-path returns standard 404 response', async () => {
    const res = await request(app).get('/unknown-path');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
