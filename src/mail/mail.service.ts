import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'seuemail@gmail.com',
        pass: 'suasenha',
      },
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    const mailOptions = {
      from: 'seuemail@gmail.com',
      to: email,
      subject: 'Recuperação de Senha',
      text: `Clique no link para redefinir sua senha: ${resetLink}`,
    };

    return this.transporter.sendMail(mailOptions);
  }
}
