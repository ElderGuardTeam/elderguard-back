import { QuestionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';
import { CreateQuestionOptionDto } from './create-question-option.dto';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'O título não pode estar vazio.' })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(QuestionType, { message: 'Tipo de questão inválido.' })
  @IsNotEmpty({ message: 'O tipo da questão não pode estar vazio.' })
  type!: QuestionType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  @IsOptional()
  options?: CreateQuestionOptionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRuleDto)
  rule?: CreateRuleDto;
}
