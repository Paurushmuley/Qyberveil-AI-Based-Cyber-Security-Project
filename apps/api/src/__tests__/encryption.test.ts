import { describe, it, expect } from 'vitest';
import { EncryptionService } from '../services/encryption.service.js';

describe('EncryptionService (AES-256-GCM)', () => {
  it('encrypts and decrypts sensitive API keys accurately', () => {
    const rawKey = 'sk-proj-super-secret-api-key-1234567890';
    const encrypted = EncryptionService.encrypt(rawKey);

    expect(encrypted).not.toBe(rawKey);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = EncryptionService.decrypt(encrypted);
    expect(decrypted).toBe(rawKey);
  });

  it('generates different ciphertexts for identical inputs due to random IV', () => {
    const rawKey = 'gemini-secret-api-key-abc';
    const enc1 = EncryptionService.encrypt(rawKey);
    const enc2 = EncryptionService.encrypt(rawKey);

    expect(enc1).not.toBe(enc2);
    expect(EncryptionService.decrypt(enc1)).toBe(rawKey);
    expect(EncryptionService.decrypt(enc2)).toBe(rawKey);
  });

  it('detects tampering and rejects manipulated ciphertext or auth tags', () => {
    const rawKey = 'xai-grok-api-key-999';
    const encrypted = EncryptionService.encrypt(rawKey);
    const [iv, authTag, ciphertext] = encrypted.split(':');

    // Tamper with ciphertext by altering last byte
    const tamperedCiphertext =
      ciphertext!.slice(0, -2) + (ciphertext!.slice(-2) === 'aa' ? 'bb' : 'aa');
    const tamperedPayload = `${iv}:${authTag}:${tamperedCiphertext}`;

    expect(() => EncryptionService.decrypt(tamperedPayload)).toThrow();
  });

  it('masks API keys safely without exposing full secrets', () => {
    expect(EncryptionService.maskApiKey('sk-proj-123456789abcdef')).toBe('sk-...cdef');
    expect(EncryptionService.maskApiKey('AIzaSyD-1234567890abcdef')).toBe('...cdef');
    expect(EncryptionService.maskApiKey('short')).toBe('****');
    expect(EncryptionService.maskApiKey('')).toBe('');
  });
});
