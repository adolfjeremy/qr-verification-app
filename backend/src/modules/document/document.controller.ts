import { Controller, Post, UploadedFile, UseInterceptors, Body, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { Response } from 'express';

@Controller('api/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('sign')
  @UseInterceptors(FileInterceptor('document'))
  async signDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('signData') signDataStr: string,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('Document file is required.');
    }
    if (!signDataStr) {
      throw new BadRequestException('signData payload is required.');
    }

    let signData;
    try {
      signData = JSON.parse(signDataStr);
    } catch (e) {
      throw new BadRequestException('Invalid JSON in signData.');
    }

    try {
      const signedPdfBuffer = await this.documentService.processDocument(file.buffer, signData.items);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="signed-document.pdf"',
        'Content-Length': signedPdfBuffer.length,
      });
      
      res.end(signedPdfBuffer);
    } catch (error) {
      throw new BadRequestException(`Failed to process document: ${error.message}`);
    }
  }

  @Post('save')
  @UseInterceptors(FileInterceptor('document'))
  async saveDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('signData') signDataStr: string,
    @Body('documentId') documentId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Document file is required.');
    }
    if (!signDataStr) {
      throw new BadRequestException('signData payload is required.');
    }

    let signData;
    try {
      signData = JSON.parse(signDataStr);
    } catch (e) {
      throw new BadRequestException('Invalid JSON in signData.');
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
    } catch (error) {
      throw new BadRequestException(`Failed to save document: ${error.message}`);
    }
  }
}
