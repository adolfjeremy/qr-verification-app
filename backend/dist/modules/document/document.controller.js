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
let DocumentController = class DocumentController {
    constructor(documentService) {
        this.documentService = documentService;
    }
    async signDocument(file, signDataStr, res) {
        if (!file) {
            throw new common_1.BadRequestException('Document file is required.');
        }
        if (!signDataStr) {
            throw new common_1.BadRequestException('signData payload is required.');
        }
        let signData;
        try {
            signData = JSON.parse(signDataStr);
        }
        catch (e) {
            throw new common_1.BadRequestException('Invalid JSON in signData.');
        }
        try {
            const signedPdfBuffer = await this.documentService.processDocument(file.buffer, signData.items);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="signed-document.pdf"',
                'Content-Length': signedPdfBuffer.length,
            });
            res.end(signedPdfBuffer);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to process document: ${error.message}`);
        }
    }
    async saveDocument(file, signDataStr, documentId) {
        if (!file) {
            throw new common_1.BadRequestException('Document file is required.');
        }
        if (!signDataStr) {
            throw new common_1.BadRequestException('signData payload is required.');
        }
        let signData;
        try {
            signData = JSON.parse(signDataStr);
        }
        catch (e) {
            throw new common_1.BadRequestException('Invalid JSON in signData.');
        }
        try {
            const signedPdfBuffer = await this.documentService.processDocument(file.buffer, signData.items);
            const fs = require('fs');
            const path = require('path');
            const id = documentId || require('crypto').randomUUID();
            const fileName = `${id}.pdf`;
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            fs.writeFileSync(path.join(uploadsDir, fileName), signedPdfBuffer);
            return {
                id,
                message: 'Document saved successfully',
                url: `http://localhost:3000/uploads/${fileName}`
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to save document: ${error.message}`);
        }
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Post)('sign'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('signData')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "signDocument", null);
__decorate([
    (0, common_1.Post)('save'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('signData')),
    __param(2, (0, common_1.Body)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "saveDocument", null);
exports.DocumentController = DocumentController = __decorate([
    (0, common_1.Controller)('api/documents'),
    __metadata("design:paramtypes", [document_service_1.DocumentService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map