import { PartialType } from '@nestjs/mapped-types';
import { CreateFormDto } from './create-form.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateFormDto extends PartialType(CreateFormDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seccionsIds?: string[];
}
