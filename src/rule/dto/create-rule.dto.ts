import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RuleType } from '@prisma/client';
export class CreateRuleDto {
  @IsEnum(RuleType)
  type: RuleType;

  @IsOptional()
  @IsString()
  values?: string;

  @IsOptional()
  @IsString()
  operation?: string;
}
