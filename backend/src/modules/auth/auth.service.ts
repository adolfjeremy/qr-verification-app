import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, InviteUserDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  async register(registerDto: RegisterDto) {
    const userCount = await this.prisma.user.count();
    let invite = null;

    if (userCount > 0) {
      if (!registerDto.invite_token) {
        throw new BadRequestException('Registration is invite-only. Please provide an invite token.');
      }

      invite = await this.prisma.userInvite.findUnique({
        where: { token: registerDto.invite_token },
      });

      if (!invite) {
        throw new BadRequestException('Invalid invite token.');
      }
      if (invite.status === 'ACCEPTED') {
        throw new BadRequestException('This invite has already been used.');
      }
      if (new Date() > invite.expiresAt) {
        throw new BadRequestException('This invite has expired.');
      }
      if (invite.email !== registerDto.email) {
        throw new BadRequestException('Email does not match the invitation.');
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
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

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      return { message: 'If an account with that email exists, we sent a password reset link.' };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: { email: dto.email, token, expiresAt },
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetEmail(dto.email, resetLink);

    return { message: 'If an account with that email exists, we sent a password reset link.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetToken || new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
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

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isValid) throw new UnauthorizedException('Invalid current password');

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });

    return { message: 'Password successfully changed.' };
  }

  async inviteUser(inviterId: string, dto: InviteUserDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('User is already registered.');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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

    const inviteLink = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/register?invite=${token}`;
    await this.emailService.sendInviteEmail(dto.email, inviteLink);

    return { message: 'Invitation sent successfully.' };
  }

  async validateInviteToken(token: string) {
    const invite = await this.prisma.userInvite.findUnique({ where: { token } });
    if (!invite) throw new BadRequestException('Invalid invite token');
    if (invite.status === 'ACCEPTED') throw new BadRequestException('Invite already used');
    if (new Date() > invite.expiresAt) throw new BadRequestException('Invite expired');
    return { valid: true, email: invite.email };
  }
}
