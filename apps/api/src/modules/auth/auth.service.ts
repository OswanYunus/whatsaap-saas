import bcrypt from "bcryptjs";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import type { RegisterInput, LoginInput, ResetPasswordInput } from "./auth.schema";
import { logger } from "../../utils/logger";
import { whatsappManager } from "../whatsapp/whatsapp.manager";
import { emailService } from "../../services/email.service";

const SALT_ROUNDS = 10;

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

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phoneNumber: input.phoneNumber,
        isVerified: false,
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

    // Send real email verification code via SMTP
    await emailService.sendVerificationCode(input.email, verificationCode);
    logger.info(`\n[EMAIL VERIFICATION] Sent code to ${input.email}\n`);

    // Only send via WhatsApp if the Super Admin (oswanbarackyunus@gmail.com) has a connected device
    try {
      const superAdminInstance = await this.getSuperAdminWhatsAppInstance();
      if (superAdminInstance && input.phoneNumber) {
        const text = `Your Tukonnect Digital verification code is: ${verificationCode}`;
        await whatsappManager.sendMessage(superAdminInstance.id, input.phoneNumber, text);
        logger.info(`Sent verification code to ${input.phoneNumber} via Super Admin WhatsApp instance ${superAdminInstance.id}`);
      }
    } catch (err) {
      logger.warn(`Failed to send WhatsApp verification: ${(err as Error).message}`);
    }

    return user;
  }

  private async getSuperAdminWhatsAppInstance() {
    return prisma.instance.findFirst({
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

  async verifyEmail(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Account not found", 404, "NOT_FOUND");
    }

    if (user.isVerified) {
      return user;
    }

    if (user.verificationCode !== code) {
      throw new AppError("Invalid verification code. Please check your email.", 400, "INVALID_CODE");
    }

    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
      throw new AppError("Verification code has expired. Please request a new code.", 400, "EXPIRED_CODE");
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

    if (user.isVerified) {
      throw new AppError("Account is already verified", 400, "BAD_REQUEST");
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

    await emailService.sendVerificationCode(email, verificationCode);
    logger.info(`\n[EMAIL VERIFICATION RESEND] Sent new code to ${email}\n`);

    // Only send via WhatsApp if the Super Admin (oswanbarackyunus@gmail.com) has a connected device
    try {
      const superAdminInstance = await this.getSuperAdminWhatsAppInstance();
      if (superAdminInstance && user.phoneNumber) {
        const text = `Your Tukonnect Digital verification code is: ${verificationCode}`;
        await whatsappManager.sendMessage(superAdminInstance.id, user.phoneNumber, text);
        logger.info(`Resent verification code to ${user.phoneNumber} via Super Admin WhatsApp instance ${superAdminInstance.id}`);
      }
    } catch (err) {
      logger.warn(`Failed to send WhatsApp verification: ${(err as Error).message}`);
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

    if (!user.isVerified) {
      throw new AppError("Your email has not been verified yet.", 403, "EMAIL_UNVERIFIED");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
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
    // Find user by phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "");
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

    // Only send via WhatsApp if the Super Admin (oswanbarackyunus@gmail.com) has a connected device
    try {
      const superAdminInstance = await this.getSuperAdminWhatsAppInstance();
      if (superAdminInstance) {
        const text = `Your Tukonnect digital password reset code is: ${code}`;
        await whatsappManager.sendMessage(superAdminInstance.id, phoneNumber, text);
        logger.info(`Sent password reset code to ${phoneNumber} via Super Admin WhatsApp instance ${superAdminInstance.id}`);
      }
    } catch (err) {
      logger.warn(`Failed to send WhatsApp reset code to ${phoneNumber}: ${(err as Error).message}`);
    }

    return { success: true };
  }

  async verifyResetCode(phoneNumber: string, code: string) {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: { contains: cleanPhone }
      }
    });

    if (!user || user.resetPasswordCode !== code) {
      throw new AppError("Invalid code", 400, "INVALID_CODE");
    }

    if (user.resetPasswordCodeExpiresAt && user.resetPasswordCodeExpiresAt < new Date()) {
      throw new AppError("Code has expired", 400, "EXPIRED_CODE");
    }

    return { success: true };
  }

  async resetPassword(input: ResetPasswordInput) {
    const cleanPhone = input.phoneNumber.replace(/\D/g, "");
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
        resetPasswordCode: null,
        resetPasswordCodeExpiresAt: null
      }
    });

    return { success: true };
  }
}

export const authService = new AuthService();