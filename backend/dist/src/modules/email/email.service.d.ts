export declare class EmailService {
    private resend;
    private readonly logger;
    constructor();
    sendSignatureRequest(toEmail: string, toName: string, documentTitle: string, signLink: string): Promise<void>;
    sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<void>;
    sendInviteEmail(toEmail: string, inviteLink: string): Promise<void>;
}
