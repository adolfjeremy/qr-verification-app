import { DocumentService } from './document.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { Response, Request } from 'express';
export declare class DocumentController {
    private readonly documentService;
    private readonly storageService;
    private readonly prismaService;
    constructor(documentService: DocumentService, storageService: StorageService, prismaService: PrismaService);
    getUserDocuments(req: Request): Promise<{
        id: string;
        title: string;
        status: string;
        createdAt: Date;
    }[]>;
    publishDocument(signDataStr: string, documentId: string, req: Request): Promise<{
        message: string;
    }>;
    exportDocument(id: string, req: Request, res: Response): Promise<void>;
    createDraft(file: Express.Multer.File, req: Request): Promise<{
        id: string;
    }>;
    getDocumentDetails(id: string, req: Request): Promise<{
        fileViewUrl: string;
        id: string;
        title: string;
        status: string;
        fileUrl: string;
        items: import("@prisma/client/runtime/client").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        uploaderId: string;
    }>;
    saveDocumentDraft(signDataStr: string, documentId: string, req: Request): Promise<{
        message: string;
    }>;
    viewDocument(res: Response, id: string): Promise<void>;
    verifyDocument(id: string): Promise<{
        documentId: string;
        title: string;
        status: string;
        signedDate: Date;
        uploader: string;
        uploaderName: string;
    }>;
    deleteDocument(id: string, req: Request): Promise<{
        message: string;
    }>;
}
