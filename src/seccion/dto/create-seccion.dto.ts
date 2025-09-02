import { Type } from 'class-transformer';
import { IsString, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';
import { ApiProperty } from '@nestjs/swagger';
export class CreateSeccionDto {
  @ApiProperty({
    description: 'Título da seção',
    example: 'Seção de Informações Pessoais',
  })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  ruleId?: string;

  @ApiProperty({
    description: 'ID do formulário ao qual a seção pertence',
    example: 1,
    required: false,
  })
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
