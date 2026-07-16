"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrService = void 0;
const common_1 = require("@nestjs/common");
const QRCode = require("qrcode");
const sharp = require("sharp");
let QrService = class QrService {
    async generateQrCode(content, isVerify = false) {
        try {
            const color = isVerify ? { dark: '#064ad4ff', light: '#ffffffff' } : { dark: '#000000ff', light: '#ffffffff' };
            const qrBuffer = await QRCode.toBuffer(content, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 1000,
                color,
            });
            if (!isVerify) {
                return qrBuffer;
            }
            const path = require('path');
            const fs = require('fs');
            const logoPath = path.join(process.cwd(), '..', 'frontend', 'src', 'assets', 'logo-verified.png');
            let compositeBuffer;
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                const resizedLogo = await sharp(logoBuffer)
                    .resize(400, 400, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                    .flatten({ background: { r: 255, g: 255, b: 255 } })
                    .png()
                    .toBuffer();
                compositeBuffer = await sharp(qrBuffer)
                    .composite([{ input: resizedLogo, gravity: 'center' }])
                    .png()
                    .toBuffer();
            }
            else {
                const svgLogo = Buffer.from(`
          <svg width="75" height="75" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white" rx="10"/>
            <text x="50%" y="50%" font-family="Arial" font-size="20" font-weight="bold" fill="#2563eb" text-anchor="middle" dominant-baseline="middle">BAPP</text>
          </svg>
        `);
                compositeBuffer = await sharp(qrBuffer)
                    .composite([{ input: svgLogo, gravity: 'center' }])
                    .png()
                    .toBuffer();
            }
            return compositeBuffer;
        }
        catch (error) {
            throw new Error(`Failed to generate QR Code: ${error.message}`);
        }
    }
};
exports.QrService = QrService;
exports.QrService = QrService = __decorate([
    (0, common_1.Injectable)()
], QrService);
//# sourceMappingURL=qr.service.js.map