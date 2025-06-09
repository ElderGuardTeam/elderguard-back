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
  answerImage?: string;

  @IsBoolean()
  @IsOptional()
  answerBoolean?: boolean;

  @IsUUID()
  @IsOptional()
  selectedOptionId?: string;

  @IsNumber()
  @IsOptional()
  score?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionAnswerNestedDto)
  @IsOptional()
  optionAnswers?: CreateOptionAnswerNestedDto[];
}
