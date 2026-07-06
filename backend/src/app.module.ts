import { Module } from '@nestjs/common';
import { DocumentModule } from './modules/document/document.module';
import { QrModule } from './modules/qr/qr.module';

@Module({
  imports: [DocumentModule, QrModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
