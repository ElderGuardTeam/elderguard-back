import { IsString, IsOptional, IsArray } from 'class-validator';
export class CreateEvaluationDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  formsIds: string[];
}
