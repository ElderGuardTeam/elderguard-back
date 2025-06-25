import { PartialType } from '@nestjs/mapped-types';
import { CreateRuleDto } from './create-rule.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { RuleType } from '@prisma/client';

export class UpdateRuleDto extends PartialType(CreateRuleDto) {
  @IsOptional()
  @IsEnum(RuleType)
  type?: RuleType;
}
