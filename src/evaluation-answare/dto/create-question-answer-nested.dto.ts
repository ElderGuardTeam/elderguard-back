import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateOptionAnswerNestedDto } from './create-option-answer-nested.dto';

export class CreateQuestionAnswerNestedDto {
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsOptional()
  answerText?: string;

  @IsNumber()
  @IsOptional()
  answerNumber?: number;

  @IsString()
  @IsOptional()
  answerImage?: string; // Geralmente uma URL ou path

  @IsBoolean()
  @IsOptional()
  answerBoolean?: boolean;

  @IsUUID()
  @IsOptional()
  selectedOptionId?: string; // Para questões do tipo SELECT ou BOOLEAN (modeladas como SELECT)

  @IsNumber()
  @IsOptional()
  score?: number; // Opcional: pode ser calculado no backend ou enviado se já calculado

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionAnswerNestedDto)
  @IsOptional()
  optionAnswers?: CreateOptionAnswerNestedDto[]; // Para MULTISELECT com dados por opção
}
