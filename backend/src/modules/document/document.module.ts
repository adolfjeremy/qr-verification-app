import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { QrModule } from '../qr/qr.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { CryptoModule } from '../crypto/crypto.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [QrModule, PrismaModule, EmailModule, CryptoModule, AuditModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
