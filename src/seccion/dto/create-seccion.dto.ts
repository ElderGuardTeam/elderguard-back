import { Type } from 'class-transformer';
import { IsString, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';
export class CreateSeccionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  ruleId?: string;

  @IsOptional()
  @IsString()
  formId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRuleDto)
  rule?: CreateRuleDto;

  @IsArray()
  questionsIds: string[];
  id: any;
}
