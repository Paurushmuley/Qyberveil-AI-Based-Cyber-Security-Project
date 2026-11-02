import crypto from 'crypto';
import { config } from '../config/index.js';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits

  /**
   * Derive a 32-byte key from the master secret using SHA-256
   */
  private static getKey(): Buffer {
    return crypto.createHash('sha256').update(config.ENCRYPTION_KEY).digest();
  }

  /**
   * Encrypts plaintext using authenticated AES-256-GCM
   * Returns formatted string: "iv:authTag:ciphertext" (hex encoded)
   */
  public static encrypt(plaintext: string): string {
    if (!plaintext) return '';

    const key = EncryptionService.getKey();
    const iv = crypto.randomBytes(EncryptionService.IV_LENGTH);

    const cipher = crypto.createCipheriv(EncryptionService.ALGORITHM, key, iv, {
      authTagLength: EncryptionService.AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts an authenticated ciphertext string
   * Throws if tampered with, wrong key, or invalid format
   */
  public static decrypt(encryptedStr: string): string {
    if (!encryptedStr) return '';

    const parts = encryptedStr.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format: expected iv:authTag:ciphertext');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts as [string, string, string];
    const key = EncryptionService.getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(EncryptionService.ALGORITHM, key, iv, {
      authTagLength: EncryptionService.AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Safely masks an API key so only the last 4 characters are visible
   * e.g. "sk-proj-1234567890abcdef" -> "sk-...cdef"
   */
  public static maskApiKey(key?: string): string {
    if (!key) return '';
    if (key.length <= 8) return '****';
    const prefix = key.startsWith('sk-') ? 'sk-...' : '...';
    return `${prefix}${key.slice(-4)}`;
  }
}
