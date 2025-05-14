import { PartialType } from '@nestjs/mapped-types';
import { CreateFormDto } from './create-form.dto';
import { IsArray } from 'class-validator';

export class UpdateFormDto extends PartialType(CreateFormDto) {
  @IsArray()
  seccionsIds: string[];
}
