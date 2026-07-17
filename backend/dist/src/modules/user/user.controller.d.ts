import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
export declare class UserController {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    getAllUsers(req: Request): Promise<{
        id: string;
        email: string;
        name: string;
    }[]>;
    getSavedSignatures(req: Request): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        signatureBase64: string;
    }[]>;
    saveSignature(req: Request, signatureBase64: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        signatureBase64: string;
    }>;
    deleteSignature(req: Request, id: string): Promise<{
        message: string;
    }>;
}
