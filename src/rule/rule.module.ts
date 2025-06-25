import { Module, Logger } from '@nestjs/common';
import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { PrismaService } from 'src/database/prisma.service';
import { RuleBuilderModule } from 'src/common/rule-builder/rule-builder.module';
import { RuleBuilderService } from 'src/common/rule-builder/rule-builder.service';

@Module({
  imports: [RuleBuilderModule],
  controllers: [RuleController],
  providers: [RuleService, PrismaService, RuleBuilderService, Logger],
  exports: [RuleService],
})
export class RuleModule {}
