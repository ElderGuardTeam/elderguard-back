import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { PrismaService } from 'src/database/prisma.service';
import { RuleModule } from 'src/rule/rule.module';

@Module({
  imports: [RuleModule],
  controllers: [QuestionController],
  providers: [QuestionService, PrismaService],
  exports: [QuestionService],
})
export class QuestionModule {}
