import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
