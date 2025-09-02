import { Type } from 'class-transformer';
import { IsString, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';
import { CreateSeccionDto } from 'src/seccion/dto/create-seccion.dto';
import { ApiProperty } from '@nestjs/swagger';
export class CreateFormDto {
  @ApiProperty({
    description: 'Título do formulário',
    example: 'Formulário de Avaliação Cognitiva',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Descrição do formulário',
    example: 'Formulário utilizado para avaliação cognitiva inicial.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tipo do formulário',
    example: 'Avaliação Cognitiva',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Seções do formulário',
    type: [CreateSeccionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSeccionDto)
  seccions?: CreateSeccionDto[];

  @ApiProperty({
    description: 'Regras do formulário',
    type: CreateRuleDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRuleDto)
  rule?: CreateRuleDto;

  @ApiProperty({
    description: 'Perguntas do formulário',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  questionsIds?: string[];
}
