import { UserType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfessionalDto {
  @ApiProperty({
    description: 'CPF do profissional',
    example: '12345678900',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  cpf: string;

  @ApiProperty({
    description: 'Nome completo do profissional',
    example: 'Ana Souza',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Telefone de contato do profissional (somente números)',
    example: '11987654321',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  phone: string;

  @ApiProperty({
    description: 'Endereço de e-mail do profissional',
    example: 'ana@mail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Senha do profissional',
    example: 'senha123',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Define o nível de acesso do profissional.',
    enum: UserType,
    example: UserType.TECH_PROFESSIONAL,
  })
  @IsEnum(UserType)
  userType: UserType;
}
