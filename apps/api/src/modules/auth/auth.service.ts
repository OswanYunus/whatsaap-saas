import bcrypt from "bcryptjs";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import type { RegisterInput, LoginInput, ResetPasswordInput } from "./auth.schema";
import { logger } from "../../utils/logger";
import { whatsappManager } from "../whatsapp/whatsapp.manager";
import { emailService } from "../../services/email.service";

const SALT_ROUNDS = 10;

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) {
    digits = digits.substring(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  return digits;
}

function toWhatsAppNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "254" + digits.substring(1);
  } else if (!digits.startsWith("254") && digits.length === 9) {
    digits = "254" + digits;
  }
  return digits;
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existing) {
      throw new AppError(
        "An account with this email already exists",
        409,
        "EMAIL_TAKEN"
      );
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Elevate admin automatically for oswanbarackyunus@gmail.com
    const isAdmin = input.email.toLowerCase() === "oswanbarackyunus@gmail.com";

    // Auto-verify user so they are immediately granted access without dead-ends
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phoneNumber: toWhatsAppNumber(input.phoneNumber),
        isVerified: true,
        verificationCode,
        verificationCodeExpiresAt,
        isAdmin
      }
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: input.workspaceName
      }
    });

    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "OWNER"
      }
    });

    // Send welcome / verification notice via WhatsApp from Sammy Swaleh's OTP instance
    try {
      const otpInstance = await this.getSystemOTPWhatsAppInstance();
      if (otpInstance && input.phoneNumber) {
        const targetPhone = toWhatsAppNumber(input.phoneNumber);
        const text = `Welcome to Tukonnect Digital! Your workspace "${input.workspaceName}" is active.\nVerification code: ${verificationCode}\n\nAccess dashboard: https://wa.tukonectdigital.co.ke`;
        await whatsappManager.sendMessage(otpInstance.id, targetPhone, text);
        logger.info(`Sent welcome/verification code to ${targetPhone} via OTP WhatsApp instance ${otpInstance.id}`);
      }
    } catch (err) {
      logger.warn(`Failed to send WhatsApp verification: ${(err as Error).message}`);
    }

    // Attempt SMTP if configured
    try {
      await emailService.sendVerificationCode(input.email, verificationCode);
    } catch {
      // SMTP optional
    }

    return user;
  }

  private async getSystemOTPWhatsAppInstance() {
    // 1. Try instance belonging to sammyswaleh@gmail.com with phone 254785210406 or connected
    let instance = await prisma.instance.findFirst({
      where: {
        workspace: {
          members: {
            some: {
              user: {
                email: "sammyswaleh@gmail.com"
              }
            }
          }
        },
        OR: [
          { phoneNumber: { contains: "785210406" } },
          { status: "CONNECTED" }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    // 2. Fallback to any instance owned by sammyswaleh@gmail.com
    if (!instance) {
      instance = await prisma.instance.findFirst({
        where: {
          workspace: {
            members: {
              some: {
                user: {
                  email: "sammyswaleh@gmail.com"
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    // 3. Fallback to oswanbarackyunus@gmail.com
    if (!instance) {
      instance = await prisma.instance.findFirst({
        where: {
          status: "CONNECTED",
          workspace: {
            members: {
              some: {
                user: {
                  email: "oswanbarackyunus@gmail.com"
                }
              }
            }
          }
        }
      });
    }

    // Proactively reconnect socket in memory if not already running
    if (instance && !whatsappManager.hasActiveSocket(instance.id)) {
      try {
        await whatsappManager.connectInstance(instance.id);
      } catch (err) {
        logger.warn(`Could not connect OTP instance ${instance.id}: ${(err as Error).message}`);
      }
    }

    return instance;
  }

  async verifyEmail(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Account not found", 404, "NOT_FOUND");
    }

    if (user.isVerified) {
      return user;
    }

    if (user.verificationCode !== code) {
      throw new AppError("Invalid verification code.", 400, "INVALID_CODE");
    }

    return prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null
      }
    });
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Account not found", 404, "NOT_FOUND");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiresAt
      }
    });

    // Send via WhatsApp if available
    try {
      const otpInstance = await this.getSystemOTPWhatsAppInstance();
      if (otpInstance && user.phoneNumber) {
        const targetPhone = toWhatsAppNumber(user.phoneNumber);
        const text = `Your Tukonnect Digital verification code is: ${verificationCode}`;
        await whatsappManager.sendMessage(otpInstance.id, targetPhone, text);
        logger.info(`Resent verification code to ${targetPhone} via OTP WhatsApp instance ${otpInstance.id}`);
      }
    } catch (err) {
      logger.warn(`Failed to send WhatsApp verification: ${(err as Error).message}`);
    }

    try {
      await emailService.sendVerificationCode(email, verificationCode);
    } catch {
      // SMTP optional
    }

    return { success: true };
  }

  async validateCredentials(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    if (user.isBlocked) {
      throw new AppError("Your account has been blocked. Please contact support.", 403, "ACCOUNT_BLOCKED");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    // Auto-verify valid registered users so they are never blocked by unconfigured SMTP
    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
      user.isVerified = true;
    }

    // Auto-update admin status if it matches superuser email, and always update lastLoginAt
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(user.email.toLowerCase() === "oswanbarackyunus@gmail.com" && !user.isAdmin ? { isAdmin: true } : {})
      }
    });

    return updatedUser;
  }

  async forgotPassword(phoneNumber: string) {
    const cleanPhone = normalizePhone(phoneNumber);
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: {
          contains: cleanPhone
        }
      }
    });

    if (!user) {
      throw new AppError("Account with this phone number not found", 404, "NOT_FOUND");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordCode: code,
        resetPasswordCodeExpiresAt: expiresAt
      }
    });

    logger.info(`\n[PASSWORD RESET] Code for ${user.email} (${phoneNumber}) is: ${code}\n`);

    const targetPhone = toWhatsAppNumber(user.phoneNumber || phoneNumber);

    // Send via WhatsApp from Sammy Swaleh's OTP instance
    try {
      const otpInstance = await this.getSystemOTPWhatsAppInstance();
      if (otpInstance) {
        const text = `Your Tukonnect Digital password reset code is: ${code}\n\nThis code will expire in 15 minutes.`;
        await whatsappManager.sendMessage(otpInstance.id, targetPhone, text);
        logger.info(`Sent password reset code to ${targetPhone} via OTP WhatsApp instance ${otpInstance.id}`);
      } else {
        logger.error("No OTP WhatsApp instance available to send password reset code");
      }
    } catch (err) {
      logger.warn(`Failed to send WhatsApp reset code to ${targetPhone}: ${(err as Error).message}`);
    }

    // Also send via email if configured
    try {
      await emailService.sendVerificationCode(user.email, code);
    } catch {
      // SMTP optional
    }

    return { success: true };
  }

  async verifyResetCode(phoneNumber: string, code: string) {
    const cleanPhone = normalizePhone(phoneNumber);
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: { contains: cleanPhone }
      }
    });

    if (!user || user.resetPasswordCode !== code) {
      throw new AppError("Invalid reset code. Please check your WhatsApp messages or request a new code.", 400, "INVALID_CODE");
    }

    if (user.resetPasswordCodeExpiresAt && user.resetPasswordCodeExpiresAt < new Date()) {
      throw new AppError("Reset code has expired. Please request a new code.", 400, "EXPIRED_CODE");
    }

    return { success: true };
  }

  async resetPassword(input: ResetPasswordInput) {
    const cleanPhone = normalizePhone(input.phoneNumber);
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: { contains: cleanPhone }
      }
    });

    if (!user || user.resetPasswordCode !== input.code) {
      throw new AppError("Invalid code", 400, "INVALID_CODE");
    }

    if (user.resetPasswordCodeExpiresAt && user.resetPasswordCodeExpiresAt < new Date()) {
      throw new AppError("Code has expired", 400, "EXPIRED_CODE");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isVerified: true, // Mark verified so user can immediately login!
        resetPasswordCode: null,
        resetPasswordCodeExpiresAt: null
      }
    });

    return { success: true };
  }
}

export const authService = new AuthService();