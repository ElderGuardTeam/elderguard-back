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
import { ApiProperty } from '@nestjs/swagger';
export class CreateQuestionDto {
  @ApiProperty({
    description: 'O enunciado da questão a ser exibido para o profissional',
    example: 'Em que ano estamos?',
  })
  @IsString()
  @IsNotEmpty({ message: 'O título não pode estar vazio.' })
  title!: string;

  @ApiProperty({
    description: 'Descrição adicional da questão (opcional)',
    example: 'Essa questão é importante para avaliar a orientação temporal.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tipo de questão, que define o formato da resposta',
    enum: QuestionType,
    example: QuestionType.SCORE,
  })
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
