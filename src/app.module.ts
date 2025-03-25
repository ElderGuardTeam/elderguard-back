import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ElderlyModule } from './elderly/elderly.module';
import { ContactModule } from './contact/contact.module';
import { AddressModule } from './address/address.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [DatabaseModule, ElderlyModule, ContactModule, AddressModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
