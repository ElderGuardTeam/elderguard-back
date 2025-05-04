import { Type } from 'class-transformer';
import { IsString, IsOptional, IsInt, ValidateNested } from 'class-validator';
import { CreateSeccionDto } from 'src/seccion/dto/create-seccion.dto';
export class CreateFormDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  index?: number;

  @ValidateNested()
  @Type(() => CreateSeccionDto)
  seccion?: CreateSeccionDto;
}
