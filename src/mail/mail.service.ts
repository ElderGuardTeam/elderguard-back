import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordReset(email: string, token: string) {
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to: email, // Destinatário
        subject: 'Recuperação de Senha',
        text: `Clique no link para redefinir sua senha: ${resetLink}`, // Corpo do e-mail em texto puro
      });

      console.log(`E-mail enviado para ${email}`);
    } catch (error) {
      console.error(`Erro ao enviar e-mail: ${error.message}`);
      throw new Error('Erro ao enviar e-mail');
    }
  }
}
