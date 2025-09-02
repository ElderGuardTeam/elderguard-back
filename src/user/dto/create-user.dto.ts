import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsEmail } from 'class-validator';
import { UserType } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({
    description: 'Senha para acesso do usuário. Mínimo de 6 caracteres.',
    example: 'senhaForte123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Maria Oliveira',
  })
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Endereço de email do usuário (deve ser único)',
    example: 'maria.oliveira@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Define o nível de acesso do usuário.',
    enum: UserType,
    example: UserType.ADMIN,
  })
  @IsEnum(UserType)
  userType: UserType;
}
