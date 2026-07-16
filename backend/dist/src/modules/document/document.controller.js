"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const document_service_1 = require("./document.service");
const storage_service_1 = require("../storage/storage.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const crypto = require("crypto");
let DocumentController = class DocumentController {
    constructor(documentService, storageService, prismaService) {
        this.documentService = documentService;
        this.storageService = storageService;
        this.prismaService = prismaService;
    }
    async getUserDocuments(req) {
        const user = req.user;
        return this.prismaService.document.findMany({
            where: { uploaderId: user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
            },
        });
    }
    async publishDocument(signDataStr, documentId, req) {
        if (!documentId)
            throw new common_1.BadRequestException('documentId is required.');
        if (!signDataStr)
            throw new common_1.BadRequestException('signData payload is required.');
        let signData;
        try {
            signData = JSON.parse(signDataStr);
        }
        catch (e) {
            throw new common_1.BadRequestException('Invalid JSON in signData.');
        }
        try {
            const user = req.user;
            const document = await this.prismaService.document.findUnique({ where: { id: documentId } });
            if (!document || document.uploaderId !== user.id)
                throw new common_1.BadRequestException('Unauthorized');
            const fileBuffer = await this.storageService.getFileBuffer(document.fileUrl);
            const signedPdfBuffer = await this.documentService.processDocument(fileBuffer, signData.items);
            await this.storageService.uploadFile(document.fileUrl, signedPdfBuffer);
            await this.prismaService.document.update({
                where: { id: documentId },
                data: { status: 'SIGNED', items: signData.items || [] }
            });
            return { message: 'Document published successfully' };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to publish document: ${error.message}`);
        }
    }
    async exportDocument(id, req, res) {
        const user = req.user;
        const document = await this.prismaService.document.findUnique({ where: { id } });
        if (!document)
            throw new common_1.BadRequestException('Document not found');
        if (document.uploaderId !== user.id)
            throw new common_1.BadRequestException('Unauthorized access to document');
        const fileBuffer = await this.storageService.getFileBuffer(document.fileUrl);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="signed-document-${id.substring(0, 8)}.pdf"`,
            'Content-Length': fileBuffer.length,
        });
        res.end(fileBuffer);
    }
    async createDraft(file, req) {
        if (!file)
            throw new common_1.BadRequestException('Document file is required.');
        try {
            const id = crypto.randomUUID();
            const fileName = `${id}.pdf`;
            await this.storageService.uploadFile(fileName, file.buffer);
            const user = req.user;
            const document = await this.prismaService.document.create({
                data: {
                    id,
                    title: file.originalname || 'Untitled Document',
                    status: 'DRAFT',
                    fileUrl: fileName,
                    uploaderId: user.id,
                    items: [],
                }
            });
            return { id: document.id };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create draft: ${error.message}`);
        }
    }
    async getDocumentDetails(id, req) {
        const user = req.user;
        const document = await this.prismaService.document.findUnique({ where: { id } });
        if (!document)
            throw new common_1.BadRequestException('Document not found');
        if (document.uploaderId !== user.id)
            throw new common_1.BadRequestException('Unauthorized access to document');
        const API_URL = process.env.API_URL || 'http://localhost:3000';
        return {
            ...document,
            fileViewUrl: `${API_URL}/api/documents/${id}/view`,
        };
    }
    async saveDocumentDraft(signDataStr, documentId, req) {
        if (!signDataStr || !documentId)
            throw new common_1.BadRequestException('Payload is required.');
        let signData;
        try {
            signData = JSON.parse(signDataStr);
        }
        catch (e) {
            throw new common_1.BadRequestException('Invalid JSON in signData.');
        }
        const user = req.user;
        const document = await this.prismaService.document.findUnique({ where: { id: documentId } });
        if (!document || document.uploaderId !== user.id)
            throw new common_1.BadRequestException('Unauthorized');
        try {
            await this.prismaService.document.update({
                where: { id: documentId },
                data: { items: signData.items || [] }
            });
            return { message: 'Document saved successfully' };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to save document: ${error.message}`);
        }
    }
    async viewDocument(res, id) {
        try {
            const fileName = `${id}.pdf`;
            const fileBuffer = await this.storageService.getFileBuffer(fileName);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${fileName}"`,
                'Content-Length': fileBuffer.length,
            });
            res.end(fileBuffer);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Document not found`);
        }
    }
    async verifyDocument(id) {
        const document = await this.prismaService.document.findUnique({
            where: { id },
            include: {
                uploader: { select: { email: true, name: true } },
            }
        });
        if (!document) {
            throw new common_1.BadRequestException(`Document not found`);
        }
        return {
            documentId: document.id,
            title: document.title,
            status: document.status,
            signedDate: document.updatedAt,
            uploader: document.uploader.email,
            uploaderName: document.uploader.name,
        };
    }
    async deleteDocument(id, req) {
        const user = req.user;
        const document = await this.prismaService.document.findUnique({
            where: { id },
        });
        if (!document) {
            throw new common_1.BadRequestException('Document not found');
        }
        if (document.uploaderId !== user.id) {
            throw new common_1.BadRequestException('You do not have permission to delete this document');
        }
        try {
            await this.prismaService.signature.deleteMany({ where: { documentId: id } });
            await this.prismaService.verification.deleteMany({ where: { documentId: id } });
            await this.prismaService.document.delete({
                where: { id },
            });
            await this.storageService.deleteFile(document.fileUrl);
            return { message: 'Document deleted successfully' };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to delete document: ${error.message}`);
        }
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getUserDocuments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('publish'),
    __param(0, (0, common_1.Body)('signData')),
    __param(1, (0, common_1.Body)('documentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "publishDocument", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/export'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "exportDocument", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('draft'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document')),
    __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'pdf' })
        .build({ errorHttpStatusCode: common_1.HttpStatus.UNPROCESSABLE_ENTITY }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "createDraft", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getDocumentDetails", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('save'),
    __param(0, (0, common_1.Body)('signData')),
    __param(1, (0, common_1.Body)('documentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "saveDocumentDraft", null);
__decorate([
    (0, common_1.Get)(':id/view'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "viewDocument", null);
__decorate([
    (0, common_1.Get)(':id/verify'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "verifyDocument", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "deleteDocument", null);
exports.DocumentController = DocumentController = __decorate([
    (0, common_1.Controller)('api/documents'),
    __metadata("design:paramtypes", [document_service_1.DocumentService,
        storage_service_1.StorageService,
        prisma_service_1.PrismaService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map