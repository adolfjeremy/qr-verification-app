import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';
import signpdf from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';

@Injectable()
export class CryptoService implements OnModuleInit {
  private readonly logger = new Logger(CryptoService.name);
  private p12Buffer: Buffer | null = null;
  private readonly certPath = path.join(process.cwd(), 'certificate.p12');
  private readonly p12Password = 'bapp-esignature-secure';

  onModuleInit() {
    this.ensureCertificateExists();
  }

  private ensureCertificateExists() {
    if (fs.existsSync(this.certPath)) {
      this.p12Buffer = fs.readFileSync(this.certPath);
      this.logger.log('Loaded existing cryptographic certificate');
      return;
    }

    this.logger.log('Generating new Self-Signed PKI Certificate for digital signatures...');

    // Generate key pair
    const keys = forge.pki.rsa.generateKeyPair(2048);

    // Create certificate
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

    // Sign certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // Create P12
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
      keys.privateKey,
      [cert],
      this.p12Password,
      { generateLocalKeyId: true, friendlyName: 'BAPP Authority' }
    );

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const p12Buffer = Buffer.from(p12Der, 'binary');

    fs.writeFileSync(this.certPath, p12Buffer);
    this.p12Buffer = p12Buffer;

    this.logger.log('Successfully generated and saved self-signed certificate.p12');
  }

  async signPdf(pdfBuffer: Buffer): Promise<Buffer> {
    if (!this.p12Buffer) {
      throw new Error('Cryptographic certificate not loaded');
    }

    try {
      const { PDFDocument } = require('pdf-lib');
      const { pdflibAddPlaceholder } = require('@signpdf/placeholder-pdf-lib');

      const pdfDoc = await PDFDocument.load(pdfBuffer);

      pdflibAddPlaceholder({
        pdfDoc,
        reason: 'Digitally Verified by BAPP E-Signature',
        contactInfo: process.env.BAPP_AUTHORITY_EMAIL || '',
        name: 'BAPP Authority',
        location: 'Jakarta, ID'
      });

      const pdfBytes = await pdfDoc.save();
      const pdfWithPlaceholder = Buffer.from(pdfBytes);

      const signer = new P12Signer(this.p12Buffer, { passphrase: this.p12Password });

      // Sign the document
      const signedPdf = await signpdf.sign(pdfWithPlaceholder, signer);

      this.logger.log('PDF digitally signed successfully');
      return signedPdf;
    } catch (error) {
      this.logger.error(`Failed to digitally sign PDF: ${error.message}`);
      throw error;
    }
  }
}
