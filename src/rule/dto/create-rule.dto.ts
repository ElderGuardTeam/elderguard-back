import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { RuleType } from '@prisma/client';
export class CreateRuleDto {
  @IsEnum(RuleType)
  type: RuleType;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsString()
  operation?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  value1Type?: string;

  @IsOptional()
  @IsString()
  value2Type?: string;

  @IsOptional()
  @IsNumber()
  value1?: number;

  @IsOptional()
  @IsNumber()
  value2?: number;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsNumber()
  totalItems?: number; // Novo campo para a regra de prorrateio
}
