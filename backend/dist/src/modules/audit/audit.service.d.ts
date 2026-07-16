import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    logAction(documentId: string, action: string, userId?: string, ipAddress?: string, userAgent?: string, details?: string): Promise<{
        id: string;
        createdAt: Date;
        action: string;
        ipAddress: string | null;
        userAgent: string | null;
        details: string | null;
        documentId: string;
        userId: string | null;
    }>;
    getLogsForDocument(documentId: string): Promise<({
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
    getAllLogs(): Promise<({
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
}
