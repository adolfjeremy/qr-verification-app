import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, InviteUserDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        role: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            role: string;
        };
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    inviteUser(inviterId: string, dto: InviteUserDto): Promise<{
        message: string;
    }>;
    validateInviteToken(token: string): Promise<{
        valid: boolean;
        email: string;
    }>;
}
