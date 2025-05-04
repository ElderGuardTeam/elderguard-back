import { Type } from 'class-transformer';
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';
export class CreateSeccionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  ruleId?: string;

  @IsString()
  formId: string;

  @ValidateNested()
  @Type(() => CreateRuleDto)
  rule?: CreateRuleDto;
}
