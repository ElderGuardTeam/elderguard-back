import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ElderlyModule } from './elderly/elderly.module';
import { ContactModule } from './contact/contact.module';
import { AddressModule } from './address/address.module';
import { UserModule } from './user/user.module';
import { ProfessionalModule } from './professional/professional.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [DatabaseModule, ElderlyModule, ContactModule, AddressModule, UserModule, ProfessionalModule, AuthModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
