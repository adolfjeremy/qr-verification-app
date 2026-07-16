import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentModule } from './modules/document/document.module';
import { QrModule } from './modules/qr/qr.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { EmailModule } from './modules/email/email.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DocumentModule, 
    QrModule, 
    PrismaModule, 
    StorageModule, 
    AuthModule,
    UserModule,
    EmailModule,
    CryptoModule,
    AuditModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
