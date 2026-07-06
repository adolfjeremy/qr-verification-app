import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as sharp from 'sharp';

@Injectable()
export class QrService {
  /**
   * Generate QR Code as Buffer (PNG)
   * With 'H' Error Correction Level for high resilience.
   * A logo can be appended in the center later using Sharp.
   */
  async generateQrCode(content: string, isVerify: boolean = false): Promise<Buffer> {
    try {
      const color = isVerify ? { dark: '#2563ebff', light: '#ffffffff' } : { dark: '#000000ff', light: '#ffffffff' };
      const qrBuffer = await QRCode.toBuffer(content, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color,
      });

      if (!isVerify) {
        return qrBuffer;
      }

      const path = require('path');
      const fs = require('fs');
      const logoPath = path.join(process.cwd(), '..', 'frontend', 'src', 'assets', 'logo_bapp.png');
      
      let compositeBuffer;
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        
        // Resize logo and add white background for better visibility
        // Make it larger (e.g. 120x120) since the QR code is 300x300
        const resizedLogo = await sharp(logoBuffer)
          .resize(150, 150, { 
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png()
          .toBuffer();

        compositeBuffer = await sharp(qrBuffer)
          .composite([{ input: resizedLogo, gravity: 'center' }])
          .png()
          .toBuffer();
      } else {
        // Fallback to text if logo not found
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
    } catch (error) {
      throw new Error(`Failed to generate QR Code: ${error.message}`);
    }
  }
}
