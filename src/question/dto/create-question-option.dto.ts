import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateQuestionOptionDto {
  @IsString()
  @IsNotEmpty({ message: 'A descrição da opção não pode estar vazia.' })
  description: string;

  @IsInt({ message: 'A pontuação da opção deve ser um número inteiro.' })
  score: number;
}
