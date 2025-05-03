import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RuleType } from '@prisma/client';
export class CreateRuleDto {
  @IsEnum(RuleType)
  type: RuleType;

  @IsOptional()
  @IsString()
  alues?: string;

  @IsOptional()
  @IsString()
  operation?: string;
}
