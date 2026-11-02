import { describe, it, expect } from 'vitest';
import {
  targetUrlSchema,
  createTargetSchema,
  createProjectSchema,
  configureAiProviderSchema,
  isRestrictedOrPrivateHost,
} from '../index.js';
import { AIProvider, TargetVerificationMethod } from '@vulnsight/shared-types';

describe('SSRF & Scope Guardrails', () => {
  it('identifies private IPs, loopback, and metadata endpoints as restricted', () => {
    expect(isRestrictedOrPrivateHost('localhost')).toBe(true);
    expect(isRestrictedOrPrivateHost('127.0.0.1')).toBe(true);
    expect(isRestrictedOrPrivateHost('10.0.1.5')).toBe(true);
    expect(isRestrictedOrPrivateHost('172.20.0.1')).toBe(true);
    expect(isRestrictedOrPrivateHost('192.168.1.100')).toBe(true);
    expect(isRestrictedOrPrivateHost('169.254.169.254')).toBe(true);
    expect(isRestrictedOrPrivateHost('api.internal')).toBe(true);
    expect(isRestrictedOrPrivateHost('app.local')).toBe(true);
  });

  it('allows public legitimate hostnames', () => {
    expect(isRestrictedOrPrivateHost('example.com')).toBe(false);
    expect(isRestrictedOrPrivateHost('api.github.com')).toBe(false);
    expect(isRestrictedOrPrivateHost('staging-portal.company.org')).toBe(false);
  });

  it('rejects targets pointing to localhost or private IPs by default', () => {
    expect(() => targetUrlSchema.parse('http://127.0.0.1:8080')).toThrow();
    expect(() => targetUrlSchema.parse('http://localhost:3000')).toThrow();
    expect(() => targetUrlSchema.parse('http://169.254.169.254/latest/meta-data')).toThrow();
    expect(() => targetUrlSchema.parse('http://192.168.1.50:4000')).toThrow();
  });

  it('accepts legitimate public HTTP/HTTPS URLs', () => {
    const validUrl = 'https://app.vulnsight.example.com';
    expect(targetUrlSchema.parse(validUrl)).toBe(validUrl);
  });
});

describe('Target Scope Definition Schema', () => {
  it('validates and applies defaults for target scope registration', () => {
    const validTarget = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      url: 'https://staging.targetapp.com',
      inScopePaths: ['/api/v1', '/portal'],
      verificationMethod: TargetVerificationMethod.DOCUMENTED_AUTHORIZATION,
    };

    const parsed = createTargetSchema.parse(validTarget);
    expect(parsed.url).toBe('https://staging.targetapp.com');
    expect(parsed.inScopePaths).toEqual(['/api/v1', '/portal']);
    expect(parsed.excludedPaths).toEqual([]);
  });

  it('rejects in-scope paths that do not start with a leading slash', () => {
    const invalidTarget = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      url: 'https://staging.targetapp.com',
      inScopePaths: ['api/v1'],
    };

    expect(() => createTargetSchema.parse(invalidTarget)).toThrow();
  });
});

describe('Project Validation Schema', () => {
  it('requires project name between 2 and 100 characters', () => {
    expect(() => createProjectSchema.parse({ name: 'A' })).toThrow();
    expect(createProjectSchema.parse({ name: 'Valid Project' }).name).toBe('Valid Project');
  });
});

describe('AI Provider Configuration Schema', () => {
  it('requires API key for cloud providers like OpenAI, Gemini, Grok', () => {
    expect(() =>
      configureAiProviderSchema.parse({
        provider: AIProvider.GEMINI,
        modelName: 'gemini-1.5-pro',
      })
    ).toThrow();

    const validCloud = configureAiProviderSchema.parse({
      provider: AIProvider.OPENAI,
      modelName: 'gpt-4o',
      apiKey: 'sk-proj-test123456789',
    });
    expect(validCloud.apiKey).toBe('sk-proj-test123456789');
  });

  it('allows Ollama without API key but requires baseUrl', () => {
    const validOllama = configureAiProviderSchema.parse({
      provider: AIProvider.OLLAMA,
      modelName: 'llama3.3',
      baseUrl: 'http://localhost:11434',
    });
    expect(validOllama.baseUrl).toBe('http://localhost:11434');
    expect(validOllama.apiKey).toBeUndefined();
  });
});
