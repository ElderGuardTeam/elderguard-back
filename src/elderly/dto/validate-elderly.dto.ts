import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateElderlyDto {
  @ApiProperty({
    description: 'CPF do idoso para validação',
    example: '12345678900',
  })
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({
    description: 'Nome do idoso',
    example: 'João da Silva',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Sexo do idoso',
    example: 'Masculino',
  })
  @IsString()
  @IsNotEmpty()
  sex: string;
}
