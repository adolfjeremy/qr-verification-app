import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
export declare class UserController {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    getSavedSignatures(req: Request): Promise<{
        id: string;
        userId: string;
        signatureBase64: string;
        createdAt: Date;
    }[]>;
    saveSignature(req: Request, signatureBase64: string): Promise<{
        id: string;
        userId: string;
        signatureBase64: string;
        createdAt: Date;
    }>;
    deleteSignature(req: Request, id: string): Promise<{
        message: string;
    }>;
}
