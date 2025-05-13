import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { PrismaService } from 'src/database/prisma.service';
import { SeccionModule } from 'src/seccion/seccion.module';
import { QuestionModule } from 'src/question/question.module';
import { RuleModule } from 'src/rule/rule.module';

@Module({
  imports: [SeccionModule, QuestionModule, RuleModule],
  controllers: [FormController],
  providers: [FormService, PrismaService],
  exports: [FormService],
})
export class FormModule {}
