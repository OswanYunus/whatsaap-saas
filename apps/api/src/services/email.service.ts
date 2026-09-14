import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "../utils/logger";

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      logger.info(`[EmailService] Configured SMTP transporter for host: ${host}:${port}`);
    } else {
      logger.warn(`[EmailService] SMTP credentials missing in environment (SMTP_HOST, SMTP_USER, SMTP_PASS).`);
    }
  }

  async sendVerificationCode(toEmail: string, code: string): Promise<boolean> {
    if (!this.transporter) {
      this.initTransporter();
    }

    if (!this.transporter) {
      logger.warn(`[EmailService] Cannot send email to ${toEmail}: SMTP transporter is not configured.`);
      return false;
    }

    const from = process.env.SMTP_FROM || `"Tukonnect Digital" <${process.env.SMTP_USER || "noreply@tukonectdigital.co.ke"}>`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; text-align: center;">Tukonnect Digital</h2>
        <p style="color: #475569; font-size: 15px;">Welcome to Tukonnect Digital! Use the verification code below to verify your email address:</p>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #22c55e;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This code will expire in 1 hour. If you did not create an account, please ignore this email.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to: toEmail,
        subject: "Verify your Tukonnect Digital email address",
        html: htmlContent,
        text: `Your Tukonnect Digital verification code is: ${code}`
      });
      logger.info(`[EmailService] Successfully sent verification email to ${toEmail}`);
      return true;
    } catch (err) {
      logger.error(`[EmailService] Failed to send email to ${toEmail}: ${(err as Error).message}`);
      return false;
    }
  }
}

export const emailService = new EmailService();
