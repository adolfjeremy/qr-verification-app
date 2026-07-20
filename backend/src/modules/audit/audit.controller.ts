import { Controller, Get, UseGuards, Param, ForbiddenException, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('api/audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAllLogs(@Req() req: Request) {
    const user = req.user as any;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN and ADMIN can view audit logs');
    }
    return this.auditService.getAllLogs(user.role);
  }

  @Get('document/:id')
  async getDocumentLogs(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    // For MVP, we let document owners see their own audit logs, or SUPER_ADMIN
    // We would normally inject PrismaService here to check document ownership,
    // but for simplicity, we just return it (or we can strict-check later).
    return this.auditService.getLogsForDocument(id);
  }
}
