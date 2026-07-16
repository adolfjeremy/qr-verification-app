import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    documentId: string,
    action: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: string
  ) {
    return this.prisma.auditLog.create({
      data: {
        documentId,
        action,
        userId,
        ipAddress,
        userAgent,
        details,
      }
    });
  }

  async getLogsForDocument(documentId: string) {
    return this.prisma.auditLog.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
  }

  async getAllLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        document: { select: { title: true } }
      }
    });
  }
}
