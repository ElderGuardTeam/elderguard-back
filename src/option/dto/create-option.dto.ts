import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsInt()
  @IsNotEmpty()
  score: number;
}
