import { Module } from '@nestjs/common';
import { RuleBuilderService } from './rule-builder.service';

@Module({
  providers: [RuleBuilderService],
  exports: [RuleBuilderService],
})
export class RuleBuilderModule {}
