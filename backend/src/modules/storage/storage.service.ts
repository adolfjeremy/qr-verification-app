import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadsDirExists();
  }

  private async ensureUploadsDirExists() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async uploadFile(fileName: string, fileBuffer: Buffer): Promise<string> {
    try {
      const filePath = path.join(this.uploadsDir, fileName);
      await fs.writeFile(filePath, fileBuffer);
      return fileName;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to save file: ${error.message}`);
    }
  }

  async getFileBuffer(fileName: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.uploadsDir, fileName);
      return await fs.readFile(filePath);
    } catch (error) {
      throw new InternalServerErrorException(`File not found: ${fileName}`);
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, fileName);
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw new InternalServerErrorException(`Failed to delete file: ${fileName}`);
      }
    }
  }
}
