export class RegisterDto {
  email!: string;
  password!: string;
  name?: string;
  invite_token?: string;
}

export class LoginDto {
  email!: string;
  password!: string;
  rememberMe?: boolean;
}

export class ForgotPasswordDto {
  email!: string;
}

export class ResetPasswordDto {
  token!: string;
  newPassword!: string;
}

export class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
}

export class InviteUserDto {
  email!: string;
}
