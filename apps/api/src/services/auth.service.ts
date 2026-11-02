import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './prisma.service.js';
import { config } from '../config/index.js';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '@vulnsight/validation';
import { UserRole, UserSummary, AuthResponse, ForgotPasswordResponse, ResetPasswordResponse } from '@vulnsight/shared-types';

export class AuthService {
  private static sanitizeUser(user: {
    id: string;
    email: string;
    name?: string | null;
    role: any;
    isActive: boolean;
    createdAt: Date;
  }): UserSummary {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role as unknown as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private static generateToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Registers a new user account with secure password hashing (bcrypt)
   */
  public static async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      const error: any = new Error('An account with this email address already exists');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name || null,
        passwordHash,
        role: UserRole.SECURITY_ANALYST,
        isActive: true,
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user.id,
        details: { email: user.email, role: user.role },
      },
    }).catch(() => {});

    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: AuthService.sanitizeUser(user),
      token,
    };
  }

  /**
   * Authenticates user credentials and returns JWT bearer token
   */
  public static async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.isActive) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: { email: user.email },
      },
    }).catch(() => {});

    const token = AuthService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: AuthService.sanitizeUser(user),
      token,
    };
  }

  /**
   * Generates a time-limited cryptographically secure password reset token
   */
  public static async forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // Return neutral message to avoid email enumeration
      return {
        message: 'If an account associated with that email exists, reset instructions have been generated.',
      };
    }

    // Generate 32-byte hex token (64 characters)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
      },
    }).catch(() => {});

    return {
      message: 'If an account associated with that email exists, reset instructions have been generated.',
      resetToken, // Returned for dev/preview convenience
    };
  }

  /**
   * Resets password using a verified reset token
   */
  public static async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResponse> {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: input.token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      const error: any = new Error('Invalid or expired password reset token. Please request a new link.');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.newPassword, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'User',
        entityId: user.id,
      },
    }).catch(() => {});

    return {
      message: 'Password successfully updated. You may now log in with your new password.',
    };
  }

  /**
   * Retrieves currently authenticated user profile
   */
  public static async getMe(userId: string): Promise<UserSummary> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return AuthService.sanitizeUser(user);
  }

  /**
   * Updates user profile (name or password)
   */
  public static async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserSummary> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    let passwordHash = user.passwordHash;

    if (input.newPassword && input.currentPassword) {
      const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!passwordMatches) {
        const error: any = new Error('Current password does not match');
        error.statusCode = 400;
        error.code = 'INVALID_CURRENT_PASSWORD';
        throw error;
      }
      passwordHash = await bcrypt.hash(input.newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name !== undefined ? input.name : user.name,
        passwordHash,
      },
    });

    return AuthService.sanitizeUser(updated);
  }
}
