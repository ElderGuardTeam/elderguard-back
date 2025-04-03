import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/database/prisma.service';
import * as crypto from 'crypto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(login: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { login } });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new UnauthorizedException('Credenciais inválidas');
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async login(user: User) {
    const payload = {
      sub: user.id,
      login: user.login,
      userType: user.userType,
      name: user.name,
    };
    console.log('Gerando token para:', payload);

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(login: string) {
    const user = await this.prisma.user.findUnique({ where: { login } });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    // 🔹 Gerando token seguro para redefinição
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // Expira em 1 hora

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: expiry },
    });

    // 🔹 Enviar e-mail (ou logar no console se ainda não tiver email configurado)
    await this.mailService.sendPasswordReset(user.login, resetToken);

    return { message: 'E-mail de recuperação enviado' };
  }
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
    });

    if (!user) throw new BadRequestException('Token inválido ou expirado');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Senha redefinida com sucesso' };
  }
}
