import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  
  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY is not set. Emails will be logged to console instead of being sent.');
    }
  }

  async sendSignatureRequest(toEmail: string, toName: string, documentTitle: string, signLink: string) {
    const subject = `[BAPP E-Signature] Signature Requested: ${documentTitle}`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2563eb;">BAPP E-Signature</h2>
        </div>
        <p>Hello <strong>${toName}</strong>,</p>
        <p>You have been requested to sign the following document:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: #1e293b;">${documentTitle}</h3>
        </div>
        <p>Please click the button below to review and sign the document securely:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review & Sign Document</a>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 40px; text-align: center;">
          If you did not expect this request, please ignore this email.<br>
          This link will expire once the document is signed or cancelled.
        </p>
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Powered by <a href="https://wa.me/6285110555352" style="color: #1e3a8a; text-decoration: none; font-weight: bold;">Pixby PastiSign</a></p>
          <p>Bumi Asri Prima Pratama</p>
        </div>
      </div>
    `;

    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'BAPP E-Signature <onboarding@resend.dev>',
          to: toEmail,
          subject,
          html: htmlContent,
        });
        if (error) {
          this.logger.error(`Resend API Error: ${error.message}`);
          throw new Error(`Failed to send email: ${error.message}`);
        }
        this.logger.log(`Signature request email sent to ${toEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${toEmail}: ${error.message}`);
        throw new Error('Failed to send email');
      }
    } else {
      this.logger.log('--- SIMULATED EMAIL SENT ---');
      this.logger.log(`To: ${toEmail}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Link: ${signLink}`);
      this.logger.log('----------------------------');
    }
  }

  async sendPasswordResetEmail(toEmail: string, resetLink: string) {
    const subject = `[BAPP E-Signature] Password Reset Request`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2563eb;">BAPP E-Signature</h2>
        </div>
        <p>Hello,</p>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p>Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 40px; text-align: center;">
          This link will expire in 1 hour.
        </p>
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Powered by <a href="https://wa.me/6285110555352" style="color: #1e3a8a; text-decoration: none; font-weight: bold;">Pixby PastiSign</a></p>
          <p>Bumi Asri Prima Pratama</p>
        </div>
      </div>
    `;

    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'BAPP E-Signature <onboarding@resend.dev>',
          to: toEmail,
          subject,
          html: htmlContent,
        });
        if (error) {
          this.logger.error(`Resend API Error: ${error.message}`);
          throw new Error(`Failed to send email: ${error.message}`);
        }
        this.logger.log(`Password reset email sent to ${toEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send password reset email to ${toEmail}: ${error.message}`);
        throw new Error('Failed to send email');
      }
    } else {
      this.logger.log('--- SIMULATED PASSWORD RESET EMAIL SENT ---');
      this.logger.log(`To: ${toEmail}`);
      this.logger.log(`Link: ${resetLink}`);
      this.logger.log('----------------------------');
    }
  }

  async sendInviteEmail(toEmail: string, inviteLink: string) {
    const subject = `[BAPP E-Signature] You are invited to BAPP E-Signature`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2563eb;">BAPP E-Signature</h2>
        </div>
        <p>Hello,</p>
        <p>You have been invited by the Super Admin to join BAPP E-Signature.</p>
        <p>Click the button below to register your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invite & Register</a>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 40px; text-align: center;">
          This invitation link will expire in 24 hours.
        </p>
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Powered by <a href="https://wa.me/6285110555352" style="color: #1e3a8a; text-decoration: none; font-weight: bold;">Pixby PastiSign</a></p>
          <p>Bumi Asri Prima Pratama</p>
        </div>
      </div>
    `;

    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'BAPP E-Signature <onboarding@resend.dev>',
          to: toEmail,
          subject,
          html: htmlContent,
        });
        if (error) {
          this.logger.error(`Resend API Error: ${error.message}`);
          throw new Error(`Failed to send email: ${error.message}`);
        }
        this.logger.log(`Invite email sent to ${toEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send invite email to ${toEmail}: ${error.message}`);
        throw new Error('Failed to send email');
      }
    } else {
      this.logger.log('--- SIMULATED INVITE EMAIL SENT ---');
      this.logger.log(`To: ${toEmail}`);
      this.logger.log(`Link: ${inviteLink}`);
      this.logger.log('----------------------------');
    }
  }
}
