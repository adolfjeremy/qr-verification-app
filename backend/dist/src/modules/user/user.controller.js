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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let UserController = class UserController {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async getSavedSignatures(req) {
        const user = req.user;
        return await this.prismaService.savedSignature.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
    }
    async saveSignature(req, signatureBase64) {
        if (!signatureBase64) {
            throw new common_1.BadRequestException('Signature data is required');
        }
        const user = req.user;
        return await this.prismaService.savedSignature.create({
            data: {
                userId: user.id,
                signatureBase64
            }
        });
    }
    async deleteSignature(req, id) {
        const user = req.user;
        const signature = await this.prismaService.savedSignature.findUnique({ where: { id } });
        if (!signature || signature.userId !== user.id) {
            throw new common_1.BadRequestException('Signature not found or unauthorized');
        }
        await this.prismaService.savedSignature.delete({ where: { id } });
        return { message: 'Signature deleted successfully' };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('signatures'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getSavedSignatures", null);
__decorate([
    (0, common_1.Post)('signatures'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('signatureBase64')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "saveSignature", null);
__decorate([
    (0, common_1.Delete)('signatures/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteSignature", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('api/users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserController);
//# sourceMappingURL=user.controller.js.map