import { QuestionType, UserType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(UserType)
  type: QuestionType;
}
