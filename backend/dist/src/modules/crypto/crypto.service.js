"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CryptoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const common_1 = require("@nestjs/common");
const forge = require("node-forge");
const fs = require("fs");
const path = require("path");
const signpdf_1 = require("@signpdf/signpdf");
const signer_p12_1 = require("@signpdf/signer-p12");
let CryptoService = CryptoService_1 = class CryptoService {
    constructor() {
        this.logger = new common_1.Logger(CryptoService_1.name);
        this.p12Buffer = null;
        this.certPath = path.join(process.cwd(), 'certificate.p12');
        this.p12Password = 'bapp-enterprise-secure';
    }
    onModuleInit() {
        this.ensureCertificateExists();
    }
    ensureCertificateExists() {
        if (fs.existsSync(this.certPath)) {
            this.p12Buffer = fs.readFileSync(this.certPath);
            this.logger.log('Loaded existing cryptographic certificate');
            return;
        }
        this.logger.log('Generating new Self-Signed PKI Certificate for digital signatures...');
        const keys = forge.pki.rsa.generateKeyPair(2048);
        const cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5);
        const attrs = [
            { name: 'commonName', value: 'BAPP E-Signature Authority' },
            { name: 'countryName', value: 'ID' },
            { shortName: 'ST', value: 'Jakarta' },
            { name: 'localityName', value: 'Jakarta' },
            { name: 'organizationName', value: 'BAPP' },
            { shortName: 'OU', value: 'Engineering' },
            { name: 'emailAddress', value: process.env.BAPP_AUTHORITY_EMAIL || 'admin@bumiasriprimapratama.com' }
        ];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(keys.privateKey, forge.md.sha256.create());
        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], this.p12Password, { generateLocalKeyId: true, friendlyName: 'BAPP Authority' });
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
        const p12Buffer = Buffer.from(p12Der, 'binary');
        fs.writeFileSync(this.certPath, p12Buffer);
        this.p12Buffer = p12Buffer;
        this.logger.log('Successfully generated and saved self-signed certificate.p12');
    }
    async signPdf(pdfBuffer) {
        if (!this.p12Buffer) {
            throw new Error('Cryptographic certificate not loaded');
        }
        try {
            const { PDFDocument } = require('pdf-lib');
            const { pdflibAddPlaceholder } = require('@signpdf/placeholder-pdf-lib');
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            pdflibAddPlaceholder({
                pdfDoc,
                reason: 'Digitally Verified by BAPP Enterprise',
                contactInfo: process.env.BAPP_AUTHORITY_EMAIL || '',
                name: 'BAPP Authority',
                location: 'Jakarta, ID'
            });
            const pdfBytes = await pdfDoc.save();
            const pdfWithPlaceholder = Buffer.from(pdfBytes);
            const signer = new signer_p12_1.P12Signer(this.p12Buffer, { passphrase: this.p12Password });
            const signedPdf = await signpdf_1.default.sign(pdfWithPlaceholder, signer);
            this.logger.log('PDF digitally signed successfully');
            return signedPdf;
        }
        catch (error) {
            this.logger.error(`Failed to digitally sign PDF: ${error.message}`);
            throw error;
        }
    }
};
exports.CryptoService = CryptoService;
exports.CryptoService = CryptoService = CryptoService_1 = __decorate([
    (0, common_1.Injectable)()
], CryptoService);
//# sourceMappingURL=crypto.service.js.map