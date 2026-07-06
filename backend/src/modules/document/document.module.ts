import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [QrModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
