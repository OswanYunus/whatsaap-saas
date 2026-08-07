import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspaceName: z.string().min(2).max(100),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(8, "Phone number must be at least 8 characters")
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Verification code must be 6 digits")
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  phoneNumber: z.string().min(8, "Phone number must be at least 8 characters")
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const verifyResetCodeSchema = z.object({
  phoneNumber: z.string().min(8),
  code: z.string().length(6)
});
export type VerifyResetCodeInput = z.infer<typeof verifyResetCodeSchema>;

export const resetPasswordSchema = z.object({
  phoneNumber: z.string().min(8),
  code: z.string().length(6),
  password: z.string().min(8, "Password must be at least 8 characters")
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;