import { Module } from '@nestjs/common';
import { FormAnswareService } from './form-answare.service';
import { FormAnswareController } from './form-answare.controller';

@Module({
  controllers: [FormAnswareController],
  providers: [FormAnswareService],
})
export class FormAnswareModule {}
