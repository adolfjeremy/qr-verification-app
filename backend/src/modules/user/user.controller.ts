import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  async getAllUsers(@Req() req: Request) {
    const user = req.user as any;
    return await this.prismaService.user.findMany({
      where: { id: { not: user.id } },
      select: { id: true, email: true, name: true },
      orderBy: { name: 'asc' }
    });
  }

  @Get('signatures')
  async getSavedSignatures(@Req() req: Request) {
    const user = req.user as any;
    return await this.prismaService.savedSignature.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('signatures')
  async saveSignature(@Req() req: Request, @Body('signatureBase64') signatureBase64: string) {
    if (!signatureBase64) {
      throw new BadRequestException('Signature data is required');
    }
    const user = req.user as any;
    return await this.prismaService.savedSignature.create({
      data: {
        userId: user.id,
        signatureBase64
      }
    });
  }

  @Delete('signatures/:id')
  async deleteSignature(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    const signature = await this.prismaService.savedSignature.findUnique({ where: { id } });
    if (!signature || signature.userId !== user.id) {
      throw new BadRequestException('Signature not found or unauthorized');
    }
    
    await this.prismaService.savedSignature.delete({ where: { id } });
    return { message: 'Signature deleted successfully' };
  }
}
