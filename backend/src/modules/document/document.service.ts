import { Injectable } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import { QrService } from '../qr/qr.service';
import { convertYCoordinate } from '../../common/utils/coordinate.util';

export interface SignItem {
  type: 'signature' | 'qrcode' | 'qrcode_doc' | 'qrcode_verify';
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  base64Image?: string;
  qrContent?: string;
}

@Injectable()
export class DocumentService {
  constructor(private readonly qrService: QrService) {}

  async processDocument(pdfBuffer: Buffer, items: SignItem[]): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    for (const item of items) {
      // pageNumber from frontend is usually 1-indexed
      const pageIndex = item.pageNumber - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        continue;
      }
      
      const page = pages[pageIndex];
      const { height: pageHeight } = page.getSize();
      
      // Calculate correct Y position for pdf-lib (bottom-left origin)
      const pdfY = convertYCoordinate(pageHeight, item.y, item.height);

      if ((item.type === 'qrcode' || item.type === 'qrcode_doc' || item.type === 'qrcode_verify') && item.qrContent) {
        // Generate QR code buffer
        const isVerify = item.type === 'qrcode_verify';
        const qrBuffer = await this.qrService.generateQrCode(item.qrContent, isVerify);
        
        // Embed the PNG into PDF
        const qrImage = await pdfDoc.embedPng(qrBuffer);
        
        page.drawImage(qrImage, {
          x: item.x,
          y: pdfY,
          width: item.width,
          height: item.height,
        });
      } 
      else if (item.type === 'signature' && item.base64Image) {
        // base64Image comes as "data:image/png;base64,..."
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
}
