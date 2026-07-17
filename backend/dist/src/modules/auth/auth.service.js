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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
const email_service_1 = require("../email/email.service");
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    constructor(prisma, jwtService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async register(registerDto) {
        const userCount = await this.prisma.user.count();
        let invite = null;
        if (userCount > 0) {
            if (!registerDto.invite_token) {
                throw new common_1.BadRequestException('Registration is invite-only. Please provide an invite token.');
            }
            invite = await this.prisma.userInvite.findUnique({
                where: { token: registerDto.invite_token },
            });
            if (!invite) {
                throw new common_1.BadRequestException('Invalid invite token.');
            }
            if (invite.status === 'ACCEPTED') {
                throw new common_1.BadRequestException('This invite has already been used.');
            }
            if (new Date() > invite.expiresAt) {
                throw new common_1.BadRequestException('This invite has expired.');
            }
            if (invite.email !== registerDto.email) {
                throw new common_1.BadRequestException('Email does not match the invitation.');
            }
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        const salt = await bcrypt.genSalt();
        const password_hash = await bcrypt.hash(registerDto.password, salt);
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                password_hash,
                name: registerDto.name || registerDto.email.split('@')[0],
                role: userCount === 0 ? 'SUPER_ADMIN' : 'USER',
            },
        });
        if (invite) {
            await this.prisma.userInvite.update({
                where: { id: invite.id },
                data: { status: 'ACCEPTED' },
            });
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role
        };
    }
    async login(loginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, role: user.role },
        };
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            return { message: 'If an account with that email exists, we sent a password reset link.' };
        }
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.passwordResetToken.create({
            data: { email: dto.email, token, expiresAt },
        });
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
        await this.emailService.sendPasswordResetEmail(dto.email, resetLink);
        return { message: 'If an account with that email exists, we sent a password reset link.' };
    }
    async resetPassword(dto) {
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { token: dto.token },
        });
        if (!resetToken || new Date() > resetToken.expiresAt) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const salt = await bcrypt.genSalt();
        const password_hash = await bcrypt.hash(dto.newPassword, salt);
        await this.prisma.user.update({
            where: { email: resetToken.email },
            data: { password_hash },
        });
        await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
        return { message: 'Password has been successfully reset.' };
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const isValid = await bcrypt.compare(dto.currentPassword, user.password_hash);
        if (!isValid)
            throw new common_1.UnauthorizedException('Invalid current password');
        const salt = await bcrypt.genSalt();
        const password_hash = await bcrypt.hash(dto.newPassword, salt);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password_hash },
        });
        return { message: 'Password successfully changed.' };
    }
    async inviteUser(inviterId, dto) {
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingUser) {
            throw new common_1.BadRequestException('User is already registered.');
        }
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const existingInvite = await this.prisma.userInvite.findUnique({ where: { email: dto.email } });
        if (existingInvite) {
            await this.prisma.userInvite.delete({ where: { email: dto.email } });
        }
        await this.prisma.userInvite.create({
            data: {
                email: dto.email,
                token,
                expiresAt,
                invitedBy: inviterId,
            },
        });
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?invite=${token}`;
        await this.emailService.sendInviteEmail(dto.email, inviteLink);
        return { message: 'Invitation sent successfully.' };
    }
    async validateInviteToken(token) {
        const invite = await this.prisma.userInvite.findUnique({ where: { token } });
        if (!invite)
            throw new common_1.BadRequestException('Invalid invite token');
        if (invite.status === 'ACCEPTED')
            throw new common_1.BadRequestException('Invite already used');
        if (new Date() > invite.expiresAt)
            throw new common_1.BadRequestException('Invite expired');
        return { valid: true, email: invite.email };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map