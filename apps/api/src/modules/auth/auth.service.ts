import bcrypt from "bcryptjs";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import type { RegisterInput, LoginInput, ResetPasswordInput } from "./auth.schema";
import { logger } from "../../utils/logger";
import { whatsappManager } from "../whatsapp/whatsapp.manager";

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

    // Send code (Log to console/logger so user can see it in VPS logs)
    logger.info(`\n[EMAIL VERIFICATION] Code for ${input.email} is: ${verificationCode}\n`);
    
    // Try sending code via WhatsApp if there's any active connection
    try {
      const instances = await prisma.instance.findMany({
        where: { status: "CONNECTED" }
      });
      if (instances.length > 0) {
        // Send via the first active instance
        const text = `Your Tukonnect digital verification code is: ${verificationCode}`;
        await whatsappManager.sendMessage(instances[0].id, input.phoneNumber, text);
        logger.info(`Sent email verification code to ${input.phoneNumber} via WhatsApp instance ${instances[0].id}`);
      }
    } catch (err) {
      logger.warn(`Failed to send WhatsApp verification to ${input.phoneNumber}: ${(err as Error).message}`);
    }

    return user;
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
      throw new AppError("Invalid verification code", 400, "INVALID_CODE");
    }

    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
      throw new AppError("Verification code has expired", 400, "EXPIRED_CODE");
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

    // Auto-update admin status if it matches superuser email
    if (user.email.toLowerCase() === "oswanbarackyunus@gmail.com" && !user.isAdmin) {
      return prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true }
      });
    }

    return user;
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

    // Try sending code via WhatsApp if there's any active connection
    try {
      const instances = await prisma.instance.findMany({
        where: { status: "CONNECTED" }
      });
      if (instances.length > 0) {
        const text = `Your Tukonnect digital password reset code is: ${code}`;
        await whatsappManager.sendMessage(instances[0].id, phoneNumber, text);
        logger.info(`Sent password reset code to ${phoneNumber} via WhatsApp`);
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