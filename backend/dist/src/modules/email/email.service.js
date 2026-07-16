"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
let EmailService = EmailService_1 = class EmailService {
    constructor() {
        this.resend = null;
        this.logger = new common_1.Logger(EmailService_1.name);
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
            this.resend = new resend_1.Resend(apiKey);
        }
        else {
            this.logger.warn('RESEND_API_KEY is not set. Emails will be logged to console instead of being sent.');
        }
    }
    async sendSignatureRequest(toEmail, toName, documentTitle, signLink) {
        const subject = `Signature Requested: ${documentTitle}`;
        const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2563eb;">BAPP Enterprise Portal</h2>
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
      </div>
    `;
        if (this.resend) {
            try {
                await this.resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'BAPP E-Signature <onboarding@resend.dev>',
                    to: toEmail,
                    subject,
                    html: htmlContent,
                });
                this.logger.log(`Signature request email sent to ${toEmail}`);
            }
            catch (error) {
                this.logger.error(`Failed to send email to ${toEmail}: ${error.message}`);
                throw new Error('Failed to send email');
            }
        }
        else {
            this.logger.log('--- SIMULATED EMAIL SENT ---');
            this.logger.log(`To: ${toEmail}`);
            this.logger.log(`Subject: ${subject}`);
            this.logger.log(`Link: ${signLink}`);
            this.logger.log('----------------------------');
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map