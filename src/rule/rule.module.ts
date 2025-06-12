import { Module } from '@nestjs/common';
import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { PrismaService } from 'src/database/prisma.service';
import { RuleBuilderModule } from 'src/common/rule-builder/rule-builder.module'; // Importe o módulo

@Module({
  imports: [RuleBuilderModule], // Adicione aqui
  controllers: [RuleController],
  providers: [RuleService, PrismaService],
  exports: [RuleService],
})
export class RuleModule {}
