import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateOptionAnswerNestedDto {
  @IsUUID()
  @IsNotEmpty()
  optionId: string;

  @IsNumber()
  @IsOptional()
  score: number;

  @IsString()
  @IsOptional()
  answerText?: string;

  @IsNumber()
  @IsOptional()
  answerNumber?: number;

  @IsBoolean()
  @IsOptional()
  answerBoolean?: boolean;
}
