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
  @IsOptional() // Make score optional as it will be fetched from DB
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
