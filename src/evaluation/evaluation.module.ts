import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { PrismaService } from 'src/database/prisma.service';
import { ElderlyModule } from 'src/elderly/elderly.module';

@Module({
  imports: [ElderlyModule],
  controllers: [EvaluationController],
  providers: [EvaluationService, PrismaService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
