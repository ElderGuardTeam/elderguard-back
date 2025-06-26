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
  answerText?: string | null;

  @IsNumber()
  @IsOptional()
  answerNumber?: number | null;

  @IsString()
  @IsOptional()
  answerImage?: string | null;

  @IsBoolean()
  @IsOptional()
  answerBoolean?: boolean | null;

  @IsUUID()
  @IsOptional()
  selectedOptionId?: string | null;

  @IsNumber()
  @IsOptional()
  score?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionAnswerNestedDto)
  @IsOptional()
  optionAnswers?: CreateOptionAnswerNestedDto[] | null;
}
