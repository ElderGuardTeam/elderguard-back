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
  answerText?: string | null;

  @IsNumber()
  @IsOptional()
  answerNumber?: number | null;

  @IsBoolean()
  @IsOptional()
  answerBoolean?: boolean | null;
}
