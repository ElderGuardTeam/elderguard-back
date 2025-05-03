import { IsString, IsOptional } from 'class-validator';
export class CreateEvaluationDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
