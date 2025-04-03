import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: 'gigiomagnani93@gmail.com', // SEU E-MAIL
          pass: 'pzmp tqhp rleq vdnk', // USE A SENHA GERADA NO PASSO 1
        },
      },
      defaults: {
        from: '"ElderGuard" <gigiomagnani93@gmail.com>',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
