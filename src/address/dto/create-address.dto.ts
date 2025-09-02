import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Nome da rua/avenida',
    example: 'Rua das Flores',
  })
  @IsString()
  @IsNotEmpty({ message: 'A rua não pode estar vazia.' })
  street: string;

  @ApiProperty({
    description: 'Número da residência',
    example: '123',
  })
  @IsString()
  @IsNotEmpty({ message: 'O número não pode estar vazio.' })
  number: string;

  @ApiProperty({
    description: 'Complemento (opcional)',
    example: 'Apto 101',
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
  })
  @IsString()
  @IsNotEmpty({ message: 'O bairro não pode estar vazio.' })
  neighborhood: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
  })
  @IsString()
  @IsNotEmpty({ message: 'A cidade não pode estar vazia.' })
  city: string;

  @ApiProperty({
    description: 'Estado',
    example: 'SP',
  })
  @IsString()
  @IsNotEmpty({ message: 'O estado não pode estar vazio.' })
  state: string;

  @ApiProperty({
    description: 'CEP',
    example: '01234-567',
  })
  @IsString()
  @IsNotEmpty({ message: 'O CEP não pode estar vazio.' })
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  zipCode: string;
}
