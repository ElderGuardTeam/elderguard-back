import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOptionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsInt()
  @IsNotEmpty()
  score: number;
}
