import { Controller, Post, Body, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/database/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('login')
  async login(
    @Body() { login, password }: { login: string; password: string },
  ) {
    const user = await this.authService.validateUser(login, password);
    return this.authService.login(user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('login') login: string) {
    return this.authService.forgotPassword(login);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Patch('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    const { userId, newPassword } = changePasswordDto;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false, // Define que o usuário não precisa mais alterar a senha
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}
