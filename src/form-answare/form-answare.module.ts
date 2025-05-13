import { Module } from '@nestjs/common';
import { FormAnswareService } from './form-answare.service';
import { FormAnswareController } from './form-answare.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [FormAnswareController],
  providers: [FormAnswareService, PrismaService],
  exports: [FormAnswareService],
})
export class FormAnswareModule {}
