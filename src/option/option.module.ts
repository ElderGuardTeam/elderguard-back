import { Module } from '@nestjs/common';
import { OptionService } from './option.service';
import { OptionController } from './option.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [OptionController],
  providers: [OptionService, PrismaService],
})
export class OptionModule {}
