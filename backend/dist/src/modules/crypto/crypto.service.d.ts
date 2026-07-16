import { OnModuleInit } from '@nestjs/common';
export declare class CryptoService implements OnModuleInit {
    private readonly logger;
    private p12Buffer;
    private readonly certPath;
    private readonly p12Password;
    onModuleInit(): void;
    private ensureCertificateExists;
    signPdf(pdfBuffer: Buffer): Promise<Buffer>;
}
