import { Module } from '@nestjs/common';
import { EvaluationAnswareService } from './evaluation-answare.service';
import { EvaluationAnswareController } from './evaluation-answare.controller';
import { PrismaService } from 'src/database/prisma.service';
import { RuleEngineService } from 'src/common/rule-engine/rule-engine.service';

@Module({
  controllers: [EvaluationAnswareController],
  providers: [EvaluationAnswareService, PrismaService, RuleEngineService],
  exports: [EvaluationAnswareService],
})
export class EvaluationAnswareModule {}
