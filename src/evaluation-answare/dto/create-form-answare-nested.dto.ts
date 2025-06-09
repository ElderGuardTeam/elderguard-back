import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateQuestionAnswerNestedDto } from './create-question-answer-nested.dto';

export class CreateFormAnswareNestedDto {
  @IsUUID()
  @IsNotEmpty()
  formId: string;

  @IsUUID()
  @IsNotEmpty()
  elderlyId: string;

  @IsUUID()
  @IsNotEmpty()
  techProfessionalId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionAnswerNestedDto)
  questionsAnswares: CreateQuestionAnswerNestedDto[];

  @IsNumber()
  @IsOptional()
  totalScore?: number;
}
