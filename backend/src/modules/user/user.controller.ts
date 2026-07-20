import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
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
      select: { id: true, email: true, name: true, role: true },
      orderBy: { name: 'asc' }
    });
  }

  @Get('all')
  async getAllUsersForAdmin(@Req() req: Request) {
    const user = req.user as any;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new BadRequestException('Unauthorized access');
    }

    const whereClause: any = {};
    if (user.role === 'ADMIN') {
      whereClause.role = { not: 'SUPER_ADMIN' };
    }

    return await this.prismaService.user.findMany({
      where: whereClause,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Put(':id/role')
  async updateUserRole(@Req() req: Request, @Param('id') id: string, @Body('role') newRole: string) {
    const user = req.user as any;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new BadRequestException('Unauthorized access');
    }

    const targetUser = await this.prismaService.user.findUnique({ where: { id } });
    if (!targetUser) throw new BadRequestException('User not found');
    if (targetUser.id === user.id) throw new BadRequestException('Cannot change your own role');

    // ADMIN restrictions
    if (user.role === 'ADMIN') {
      if (targetUser.role === 'SUPER_ADMIN') throw new BadRequestException('Cannot modify a SUPER_ADMIN');
      if (newRole === 'SUPER_ADMIN') throw new BadRequestException('Cannot promote to SUPER_ADMIN');
    }

    await this.prismaService.user.update({
      where: { id },
      data: { role: newRole }
    });

    return { message: 'User role updated successfully' };
  }

  @Delete(':id')
  async deleteUser(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new BadRequestException('Unauthorized access');
    }

    const targetUser = await this.prismaService.user.findUnique({ where: { id } });
    if (!targetUser) throw new BadRequestException('User not found');
    if (targetUser.id === user.id) throw new BadRequestException('Cannot delete your own account');

    // ADMIN restrictions
    if (user.role === 'ADMIN' && targetUser.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot delete a SUPER_ADMIN');
    }

    await this.prismaService.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
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
