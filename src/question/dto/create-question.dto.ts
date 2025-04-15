import { QuestionType, UserType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CreateOptionDto } from 'src/option/dto/create-option.dto';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(UserType)
  type: QuestionType;

  @ValidateNested()
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}
