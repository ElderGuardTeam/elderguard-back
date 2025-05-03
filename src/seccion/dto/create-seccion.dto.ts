import { IsString, IsOptional } from 'class-validator';
export class CreateSeccionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  regraId?: string;

  @IsString()
  formId: string;
}
