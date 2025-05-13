import { Module } from '@nestjs/common';
import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [RuleController],
  providers: [RuleService, PrismaService],
  exports: [RuleService],
})
export class RuleModule {}
