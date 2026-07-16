import { Controller, Post, Get, Delete, Param, UploadedFile, UseInterceptors, Body, BadRequestException, Res, ParseFilePipeBuilder, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response, Request } from 'express';
import * as crypto from 'crypto';

@Controller('api/documents')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly storageService: StorageService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserDocuments(@Req() req: Request) {
    const user = req.user as any;
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
      
      const signedPdfBuffer = await this.documentService.processDocument(fileBuffer, signData.items);
      
      // overwrite the file on disk with the signed version
      await this.storageService.uploadFile(document.fileUrl, signedPdfBuffer);
      
      await this.prismaService.document.update({
          where: { id: documentId },
          data: { status: 'SIGNED', items: signData.items || [] }
      });

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
    
    if (!document) throw new BadRequestException('Document not found');
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
  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    
    const document = await this.prismaService.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    if (document.uploaderId !== user.id) {
      throw new BadRequestException('You do not have permission to delete this document');
    }

    try {
      // Clean up related records to prevent foreign key constraint failures
      await this.prismaService.signature.deleteMany({ where: { documentId: id } });
      await this.prismaService.verification.deleteMany({ where: { documentId: id } });
      
      // Delete the database record
      await this.prismaService.document.delete({
        where: { id },
      });

      // Delete the actual file
      await this.storageService.deleteFile(document.fileUrl);

      return { message: 'Document deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Failed to delete document: ${error.message}`);
    }
  }
}
