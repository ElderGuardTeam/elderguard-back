import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOptionDto {
  @ApiProperty({
    description: 'Texto da opção de resposta',
    example: 'Sim',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'ID da questão à qual esta opção pertence',
    example: '64b8f0c2e1b2c3a4d5e6f7g8',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    description: 'Pontuação que esta opção atribui à resposta',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  score: number;
}
