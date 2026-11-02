import { z } from 'zod';
import {
  ScanProfile,
  AIProvider,
  TargetVerificationMethod,
} from '@vulnsight/shared-types';

/**
 * SSRF & Scope Guardrail Validation:
 * Rejects private IP ranges, loopback, link-local, and AWS/GCP/Azure cloud metadata endpoints
 * unless explicitly operating in ALLOW_PRIVATE_TARGETS test mode.
 */
const PRIVATE_OR_RESERVED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,          // AWS/GCP metadata & link-local
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /\.internal$/i,
  /\.local$/i,
];

export function isRestrictedOrPrivateHost(hostname: string): boolean {
  return PRIVATE_OR_RESERVED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

// ==========================================
// Target & Scope Schemas
// ==========================================

export const targetUrlSchema = z.string().url().refine((val) => {
  try {
    const parsed = new URL(val);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Check against forbidden localhost/private/metadata ranges unless environment allows
    if (process.env.ALLOW_PRIVATE_TARGETS !== 'true' && isRestrictedOrPrivateHost(parsed.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}, {
  message: 'Target URL must be a valid HTTP or HTTPS URL and cannot target private/loopback/cloud metadata addresses without explicit dev configuration.',
});

export const createTargetSchema = z.object({
  projectId: z.string().min(1, { message: 'Valid Project ID is required' }),
  url: targetUrlSchema,
  inScopePaths: z.array(z.string().regex(/^\//, { message: 'In-scope path must start with /' })).default(['/']),
  excludedPaths: z.array(z.string().regex(/^\//, { message: 'Excluded path must start with /' })).default([]),
  verificationMethod: z.nativeEnum(TargetVerificationMethod).default(TargetVerificationMethod.DOCUMENTED_AUTHORIZATION),
  authorizationNotes: z.string().max(2000).optional(),
});

export type CreateTargetInput = z.infer<typeof createTargetSchema>;

// ==========================================
// Project Schemas
// ==========================================

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(1000).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ==========================================
// Scan Launch Schemas
// ==========================================

export const triggerScanSchema = z.object({
  projectId: z.string().min(1, 'Valid Project ID is required'),
  targetId: z.string().min(1, 'Valid Target ID is required'),
  profile: z.nativeEnum(ScanProfile).default(ScanProfile.BASELINE),
  customHeaders: z.record(z.string()).optional(),
  openApiSpecUrl: z.string().url().optional(),
});

export type TriggerScanInput = z.infer<typeof triggerScanSchema>;

// ==========================================
// AI Provider Configuration Schemas
// ==========================================

export const configureAiProviderSchema = z.object({
  provider: z.nativeEnum(AIProvider),
  modelName: z.string().min(1, 'Model name is required'),
  apiKey: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // If Ollama, baseUrl is required but apiKey is optional
  if (data.provider === AIProvider.OLLAMA) {
    return !!data.baseUrl;
  }
  // For cloud providers (OpenAI, Gemini, Grok), apiKey is mandatory
  return !!data.apiKey && data.apiKey.trim().length > 0;
}, {
  message: 'Cloud AI providers require an API key; Ollama requires a valid local or remote baseUrl.',
});

export type ConfigureAiProviderInput = z.infer<typeof configureAiProviderSchema>;

// ==========================================
// User & Auth Management Schemas
// ==========================================

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').trim(),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Current password is required to change your password',
  path: ['currentPassword'],
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
