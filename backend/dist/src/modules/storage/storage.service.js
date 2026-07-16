"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs/promises");
const path = require("path");
let StorageService = class StorageService {
    constructor() {
        this.uploadsDir = path.join(process.cwd(), 'uploads');
        this.ensureUploadsDirExists();
    }
    async ensureUploadsDirExists() {
        try {
            await fs.access(this.uploadsDir);
        }
        catch {
            await fs.mkdir(this.uploadsDir, { recursive: true });
        }
    }
    async uploadFile(fileName, fileBuffer) {
        try {
            const filePath = path.join(this.uploadsDir, fileName);
            await fs.writeFile(filePath, fileBuffer);
            return fileName;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to save file: ${error.message}`);
        }
    }
    async getFileBuffer(fileName) {
        try {
            const filePath = path.join(this.uploadsDir, fileName);
            return await fs.readFile(filePath);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`File not found: ${fileName}`);
        }
    }
    async deleteFile(fileName) {
        try {
            const filePath = path.join(this.uploadsDir, fileName);
            await fs.unlink(filePath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw new common_1.InternalServerErrorException(`Failed to delete file: ${fileName}`);
            }
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map