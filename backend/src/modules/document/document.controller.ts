import { Controller, Post, Get, Delete, Param, UploadedFile, UseInterceptors, Body, BadRequestException, Res, ParseFilePipeBuilder, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import * as crypto from 'crypto';

@Controller('api/documents')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly storageService: StorageService,
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly cryptoService: CryptoService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserDocuments(@Req() req: Request) {
    const user = req.user as any;
    return this.prismaService.document.findMany({
      where: { uploaderId: user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('publish')
  async publishDocument(
    @Body('signData') signDataStr: string,
    @Body('documentId') documentId: string,
    @Req() req: Request,
  ) {
    if (!documentId) throw new BadRequestException('documentId is required.');
    if (!signDataStr) throw new BadRequestException('signData payload is required.');

    let signData;
    try {
      signData = JSON.parse(signDataStr);
    } catch (e) {
      throw new BadRequestException('Invalid JSON in signData.');
    }

    try {
      const user = req.user as any;
      const document = await this.prismaService.document.findUnique({ where: { id: documentId }});
      if (!document || document.uploaderId !== user.id) throw new BadRequestException('Unauthorized');
      
      const fileBuffer = await this.storageService.getFileBuffer(document.fileUrl);
      
      const pdfBuffer = await this.documentService.processDocument(fileBuffer, signData.items);
      
      // Apply PKI Cryptographic Digital Signature
      const signedPdfBuffer = await this.cryptoService.signPdf(pdfBuffer);
      
      // overwrite the file on disk with the crypto-signed version
      await this.storageService.uploadFile(document.fileUrl, signedPdfBuffer);
      
      await this.prismaService.document.update({
          where: { id: documentId },
          data: { status: 'PUBLISHED', items: signData.items || [] } // Ensure status becomes PUBLISHED
      });

      await this.auditService.logAction(
        document.id,
        'PUBLISHED',
        user.id,
        req.ip,
        req.headers['user-agent'],
        'Document was digitally signed (PKI) and published.'
      );

      return { message: 'Document published successfully' };
    } catch (error) {
      throw new BadRequestException(`Failed to publish document: ${error.message}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/export')
  async exportDocument(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const document = await this.prismaService.document.findUnique({ where: { id } });
    
    if (!document) throw new BadRequestException('Document not found');
    if (document.uploaderId !== user.id) throw new BadRequestException('Unauthorized access to document');
    
    const fileBuffer = await this.storageService.getFileBuffer(document.fileUrl);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="signed-document-${id.substring(0, 8)}.pdf"`,
      'Content-Length': fileBuffer.length,
    });
    
    res.end(fileBuffer);
  }

  @UseGuards(JwtAuthGuard)
  @Post('draft')
  @UseInterceptors(FileInterceptor('document'))
  async createDraft(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'pdf' })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    ) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Document file is required.');

    try {
      const id = crypto.randomUUID();
      const fileName = `${id}.pdf`;
      
      // Upload original file
      await this.storageService.uploadFile(fileName, file.buffer);

      const user = req.user as any;
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
      
      await this.auditService.logAction(
        id,
        'UPLOADED',
        user.id,
        req.ip,
        req.headers['user-agent'],
        'Document was uploaded.'
      );

      return { id: document.id };
    } catch (error) {
      throw new BadRequestException(`Failed to create draft: ${error.message}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getDocumentDetails(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    const document = await this.prismaService.document.findUnique({ where: { id } });
    
    if (!document || document.deletedAt) throw new BadRequestException('Document not found');
    if (document.uploaderId !== user.id) throw new BadRequestException('Unauthorized access to document');
    
    const API_URL = process.env.API_URL || 'http://localhost:3000';
    return {
      ...document,
      fileViewUrl: `${API_URL}/api/documents/${id}/view`,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('save')
  async saveDocumentDraft(
    @Body('signData') signDataStr: string,
    @Body('documentId') documentId: string,
    @Req() req: Request,
  ) {
    if (!signDataStr || !documentId) throw new BadRequestException('Payload is required.');

    let signData;
    try {
      signData = JSON.parse(signDataStr);
    } catch (e) {
      throw new BadRequestException('Invalid JSON in signData.');
    }

    const user = req.user as any;
    const document = await this.prismaService.document.findUnique({ where: { id: documentId } });
    if (!document || document.uploaderId !== user.id) throw new BadRequestException('Unauthorized');

    try {
      await this.prismaService.document.update({
        where: { id: documentId },
        data: { items: signData.items || [] }
      });
      
      return { message: 'Document saved successfully' };
    } catch (error) {
      throw new BadRequestException(`Failed to save document: ${error.message}`);
    }
  }

  // Public endpoint for viewing the document
  @Get(':id/view')
  async viewDocument(
    @Res() res: Response,
    @Param('id') id: string
  ) {
    try {
      const fileName = `${id}.pdf`;
      const fileBuffer = await this.storageService.getFileBuffer(fileName);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': fileBuffer.length,
      });
      
      res.end(fileBuffer);
    } catch (error) {
      throw new BadRequestException(`Document not found`);
    }
  }

  // Public endpoint for verification details
  @Get(':id/verify')
  async verifyDocument(@Param('id') id: string) {
    const document = await this.prismaService.document.findUnique({
      where: { id },
      include: {
        uploader: { select: { email: true, name: true } },
      }
    });

    if (!document) {
      throw new BadRequestException(`Document not found`);
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

  @UseGuards(JwtAuthGuard)
  @Post(':id/request-signature')
  async requestSignature(
    @Param('id') id: string,
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('coordinateData') coordinateDataStr: string,
    @Req() req: Request
  ) {
    if (!email || !name || !coordinateDataStr) {
      throw new BadRequestException('email, name, and coordinateData are required.');
    }

    let coordinateData;
    try {
      coordinateData = JSON.parse(coordinateDataStr);
    } catch (e) {
      throw new BadRequestException('Invalid JSON in coordinateData.');
    }

    const user = req.user as any;
    const document = await this.prismaService.document.findUnique({ where: { id } });

    if (!document) throw new BadRequestException('Document not found');
    if (document.uploaderId !== user.id) throw new BadRequestException('Unauthorized');

    const token = crypto.randomUUID();

    await this.prismaService.signatureRequest.create({
      data: {
        documentId: id,
        email,
        name,
        token,
        coordinateData,
      }
    });
    
    // Update document status
    await this.prismaService.document.update({
      where: { id },
      data: { status: 'PENDING_SIGNATURE' }
    });

    const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
    const signLink = `${APP_URL}/sign-request/${token}`;

    await this.emailService.sendSignatureRequest(email, name, document.title, signLink);

    await this.auditService.logAction(
      id,
      'SIGNATURE_REQUESTED',
      user.id,
      req.ip,
      req.headers['user-agent'],
      `Requested signature from ${email} (${name})`
    );

    return { message: 'Signature request sent successfully' };
  }

  // Public endpoint for getting document data using a signature request token
  @Get('request/:token')
  async getSignatureRequest(@Param('token') token: string) {
    const request = await this.prismaService.signatureRequest.findUnique({
      where: { token },
      include: { document: true }
    });

    if (!request) throw new BadRequestException('Invalid or expired request link');
    if (request.status === 'COMPLETED') throw new BadRequestException('This document has already been signed');

    const API_URL = process.env.API_URL || 'http://localhost:3000';
    return {
      id: request.id,
      documentId: request.documentId,
      documentTitle: request.document.title,
      signerEmail: request.email,
      signerName: request.name,
      coordinateData: request.coordinateData,
      fileViewUrl: `${API_URL}/api/documents/${request.documentId}/view`,
    };
  }

  // Public endpoint for submitting a remote signature
  @Post('request/:token/sign')
  async submitRemoteSignature(
    @Param('token') token: string,
    @Body('signatureBase64') signatureBase64: string,
    @Req() req: Request
  ) {
    if (!signatureBase64) throw new BadRequestException('signatureBase64 is required');

    const request = await this.prismaService.signatureRequest.findUnique({
      where: { token },
      include: { document: true }
    });

    if (!request) throw new BadRequestException('Invalid or expired request link');
    if (request.status === 'COMPLETED') throw new BadRequestException('This document has already been signed');

    const documentId = request.documentId;
    
    // Convert the single signature placeholder into an item format that processDocument expects
    const coords: any = request.coordinateData;
    const itemsToSign = [
      {
        type: 'signature',
        pageNumber: coords.pageNumber,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        base64Image: signatureBase64,
      }
    ];

    // Combine with any existing items (like QR codes already placed by the owner)
    // IMPORTANT: Remove the specific signature_request placeholder that is being fulfilled
    let existingItems = [];
    if (request.document.items) {
      if (typeof request.document.items === 'string') {
        try { existingItems = JSON.parse(request.document.items); } catch(e) {}
      } else if (Array.isArray(request.document.items)) {
        existingItems = request.document.items;
      }
    }
    
    const filteredExistingItems = existingItems.filter(item => {
      // If we have an exact ID match, filter it out
      if (coords.id && item.id === coords.id) return false;
      // Fallback: filter out any signature_request at the exact same position
      if (item.type === 'signature_request' && item.pageNumber === coords.pageNumber && item.x === coords.x && item.y === coords.y) return false;
      return true;
    });

    const combinedItems = [...filteredExistingItems, ...itemsToSign];

    // Mark request as completed
    await this.prismaService.signatureRequest.update({
      where: { id: request.id },
      data: { status: 'COMPLETED', completedAt: new Date() }
    });

    // Update document
    await this.prismaService.document.update({
      where: { id: documentId },
      data: { status: 'SIGNED', items: combinedItems }
    });

    await this.auditService.logAction(
      documentId,
      'SIGNED',
      null, // Remote signers might not have a user ID
      req.ip,
      req.headers['user-agent'],
      `Document signed by ${request.name} (${request.email}) via remote request.`
    );

    return { message: 'Document signed successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    
    const document = await this.prismaService.document.findUnique({
      where: { id },
    });

    if (!document || document.deletedAt) {
      throw new BadRequestException('Document not found');
    }

    if (document.uploaderId !== user.id) {
      throw new BadRequestException('You do not have permission to delete this document');
    }

    try {
      // Soft Delete the database record
      await this.prismaService.document.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Audit Log for the DELETED action
      await this.auditService.logAction(
        id,
        'DELETED',
        user.id,
        req.ip,
        req.headers['user-agent'],
        'Document was permanently deleted by user.'
      );

      // Delete the actual file to save local storage space
      await this.storageService.deleteFile(document.fileUrl);

      return { message: 'Document deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Failed to delete document: ${error.message}`);
    }
  }
}
