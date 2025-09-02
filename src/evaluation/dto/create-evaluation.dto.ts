import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateFormDto } from 'src/form/dto/create-form.dto';
export class CreateEvaluationDto {
  @ApiProperty({
    description: 'Título do modelo de avaliação',
    example: 'Avaliação Cognitiva',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do propósito do modelo de avaliação',
    example: 'Avaliação para rastreio de déficit cognitivo.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [CreateFormDto],
    description: 'Lista de formulários que compõem este modelo de avaliação',
  })
  @IsArray()
  formsIds: string[];
}
