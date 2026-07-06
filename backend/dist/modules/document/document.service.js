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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const pdf_lib_1 = require("pdf-lib");
const qr_service_1 = require("../qr/qr.service");
const coordinate_util_1 = require("../../common/utils/coordinate.util");
let DocumentService = class DocumentService {
    constructor(qrService) {
        this.qrService = qrService;
    }
    async processDocument(pdfBuffer, items) {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        for (const item of items) {
            const pageIndex = item.pageNumber - 1;
            if (pageIndex < 0 || pageIndex >= pages.length) {
                continue;
            }
            const page = pages[pageIndex];
            const { height: pageHeight } = page.getSize();
            const pdfY = (0, coordinate_util_1.convertYCoordinate)(pageHeight, item.y, item.height);
            if ((item.type === 'qrcode' || item.type === 'qrcode_doc' || item.type === 'qrcode_verify') && item.qrContent) {
                const isVerify = item.type === 'qrcode_verify';
                const qrBuffer = await this.qrService.generateQrCode(item.qrContent, isVerify);
                const qrImage = await pdfDoc.embedPng(qrBuffer);
                page.drawImage(qrImage, {
                    x: item.x,
                    y: pdfY,
                    width: item.width,
                    height: item.height,
                });
            }
            else if (item.type === 'signature' && item.base64Image) {
                const base64Data = item.base64Image.replace(/^data:image\/png;base64,/, "");
                const signatureBuffer = Buffer.from(base64Data, 'base64');
                const signatureImage = await pdfDoc.embedPng(signatureBuffer);
                page.drawImage(signatureImage, {
                    x: item.x,
                    y: pdfY,
                    width: item.width,
                    height: item.height,
                });
            }
        }
        const modifiedPdfBytes = await pdfDoc.save();
        return Buffer.from(modifiedPdfBytes);
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [qr_service_1.QrService])
], DocumentService);
//# sourceMappingURL=document.service.js.map