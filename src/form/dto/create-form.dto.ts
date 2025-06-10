import { Type } from 'class-transformer';
import { IsString, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSeccionDto)
  seccions?: CreateSeccionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRuleDto)
  rule?: CreateRuleDto;

  @IsOptional()
  @IsArray()
  questionsIds?: string[];
}
