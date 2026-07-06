import { DocumentService } from './document.service';
import { Response } from 'express';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    signDocument(file: Express.Multer.File, signDataStr: string, res: Response): Promise<void>;
    saveDocument(file: Express.Multer.File, signDataStr: string, documentId: string): Promise<{
        id: any;
        message: string;
        url: string;
    }>;
}
