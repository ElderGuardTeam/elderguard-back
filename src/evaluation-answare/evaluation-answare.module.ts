import { Module } from '@nestjs/common';
import { EvaluationAnswareService } from './evaluation-answare.service';
import { EvaluationAnswareController } from './evaluation-answare.controller';

@Module({
  controllers: [EvaluationAnswareController],
  providers: [EvaluationAnswareService],
})
export class EvaluationAnswareModule {}
