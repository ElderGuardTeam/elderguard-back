import { Module } from '@nestjs/common';
import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { PrismaService } from 'src/database/prisma.service';
import { RuleBuilderModule } from 'src/common/rule-builder/rule-builder.module'; // Importe o módulo
import { RuleBuilderService } from 'src/common/rule-builder/rule-builder.service';

@Module({
  imports: [RuleBuilderModule], // Adicione aqui
  controllers: [RuleController],
  providers: [RuleService, PrismaService, RuleBuilderService],
  exports: [RuleService],
})
export class RuleModule {}
