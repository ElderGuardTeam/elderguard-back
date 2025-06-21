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

  async login(user: User) {
    const payload = {
      sub: user.id,
      login: user.login,
      userType: user.userType,
      name: user.name,
    };
    if (user.mustChangePassword) {
      return {
        message: 'ALTER_PASSWORD_REQUIRED',
        userId: user.id, // Retorna o ID para alterar a senha depois
      };
    }
    const access_token = this.jwtService.sign(payload);

    if (user.userType === 'USER') {
      const elderly = await this.prisma.elderly.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      return {
        access_token,
        cpf: user.login,
        elderlyId: elderly?.id,
      };
    }

    if (user.userType === 'TECH_PROFESSIONAL' || user.userType === 'ADMIN') {
      const professional = await this.prisma.professional.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      return {
        access_token,
        professionalId: professional?.id,
      };
    }

    return { access_token };
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
    if (!user.email) {
      throw new BadRequestException('Usuário não possui um e-mail válido');
    }

    await this.mailService.sendPasswordReset(user.email, resetToken);

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
