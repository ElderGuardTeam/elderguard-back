import { Module } from '@nestjs/common';
import { ElderlyService } from './elderly.service';
import { ElderlyController } from './elderly.controller';
import { PrismaService } from 'src/database/prisma.service';
import { AddressModule } from 'src/address/address.module';
import { ContactModule } from 'src/contact/contact.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [AddressModule, ContactModule, UserModule], // Adicionamos o UserModule
  controllers: [ElderlyController],
  providers: [ElderlyService, PrismaService],
})
export class ElderlyModule {}
