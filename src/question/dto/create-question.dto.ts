import { QuestionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateOptionDto } from 'src/option/dto/create-option.dto';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @ValidateNested()
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];

  @ValidateNested()
  @Type(() => CreateRuleDto)
  rule?: CreateRuleDto;
}
