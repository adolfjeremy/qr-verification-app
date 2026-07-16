import { QrService } from '../qr/qr.service';
export interface SignItem {
    type: 'signature' | 'qrcode' | 'qrcode_doc' | 'qrcode_verify';
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    base64Image?: string;
    qrContent?: string;
}
export declare class DocumentService {
    private readonly qrService;
    constructor(qrService: QrService);
    processDocument(pdfBuffer: Buffer, items: SignItem[]): Promise<Buffer>;
}
