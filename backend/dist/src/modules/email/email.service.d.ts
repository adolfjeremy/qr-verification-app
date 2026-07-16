export declare class EmailService {
    private resend;
    private readonly logger;
    constructor();
    sendSignatureRequest(toEmail: string, toName: string, documentTitle: string, signLink: string): Promise<void>;
}
