import { Module } from '@nestjs/common';
import { EvaluationAnswareService } from './evaluation-answare.service';
import { EvaluationAnswareController } from './evaluation-answare.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [EvaluationAnswareController],
  providers: [EvaluationAnswareService, PrismaService],
  exports: [EvaluationAnswareService],
})
export class EvaluationAnswareModule {}
