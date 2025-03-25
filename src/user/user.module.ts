import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  providers: [UserService, PrismaService],
  exports: [UserService], // Para ser usado em ElderlyModule
})
export class UserModule {}
