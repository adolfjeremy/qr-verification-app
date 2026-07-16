import { AuditService } from './audit.service';
import { Request } from 'express';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getAllLogs(req: Request): Promise<({
        user: {
            email: string;
            name: string;
        };
        document: {
            title: string;
        };
    } & {
        id: string;
        createdAt: Date;
        action: string;
        ipAddress: string | null;
        userAgent: string | null;
        details: string | null;
        documentId: string;
        userId: string | null;
    })[]>;
    getDocumentLogs(id: string, req: Request): Promise<({
        user: {
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        action: string;
        ipAddress: string | null;
        userAgent: string | null;
        details: string | null;
        documentId: string;
        userId: string | null;
    })[]>;
}
