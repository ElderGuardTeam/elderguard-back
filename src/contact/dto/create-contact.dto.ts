/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Transform, Type } from 'class-transformer';
import { IsString, IsEmail, ValidateNested, IsNotEmpty } from 'class-validator';
import { CreateAddressDto } from 'src/address/dto/create-address.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({
    description: 'Nome do contato',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome do contato não pode estar vazio.' })
  name: string;

  @ApiProperty({
    description: 'Número de telefone/celular',
    example: '41999998888',
  })
  @IsString()
  @IsNotEmpty({ message: 'O telefone do contato não pode estar vazio.' })
  @Transform(({ value }) => value.replace(/\D/g, ''))
  phone: string;

  @ApiProperty({
    description: 'Endereço de email do contato',
    example: 'joao@mail.com',
  })
  @IsEmail()
  @IsNotEmpty({ message: 'O email do contato não pode estar vazio.' })
  email: string;

  @ApiProperty({
    description: 'CPF do contato (somente números)',
    example: '12345678900',
  })
  @IsString()
  @IsNotEmpty({ message: 'O CPF do contato não pode estar vazio.' })
  @Transform(({ value }) => value.replace(/\D/g, ''))
  cpf: string;

  @ApiProperty({
    description: 'Endereço do contato',
    type: CreateAddressDto,
  })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsNotEmpty({ message: 'O endereço do contato é obrigatório.' })
  address: CreateAddressDto;
}
