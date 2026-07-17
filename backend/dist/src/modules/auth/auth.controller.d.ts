import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, InviteUserDto } from './dto/auth.dto';
import { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        role: string;
    }>;
    login(loginDto: LoginDto, res: Response): Promise<{
        user: {
            id: string;
            email: string;
            role: string;
        };
    }>;
    logout(res: Response): Promise<{
        message: string;
    }>;
    getProfile(req: any): {
        user: any;
    };
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(req: any, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    inviteUser(req: any, dto: InviteUserDto): Promise<{
        message: string;
    }>;
    verifyInvite(token: string): Promise<{
        valid: boolean;
        email: string;
    }>;
}
