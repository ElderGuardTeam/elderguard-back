/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Transform, Type } from 'class-transformer';
import { IsString, IsEmail, ValidateNested, IsNotEmpty } from 'class-validator';
import { CreateAddressDto } from 'src/address/dto/create-address.dto';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do contato não pode estar vazio.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'O telefone do contato não pode estar vazio.' })
  @Transform(({ value }) => value.replace(/\D/g, ''))
  phone: string;

  @IsEmail()
  @IsNotEmpty({ message: 'O email do contato não pode estar vazio.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'O CPF do contato não pode estar vazio.' })
  @Transform(({ value }) => value.replace(/\D/g, ''))
  cpf: string;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsNotEmpty({ message: 'O endereço do contato é obrigatório.' })
  address: CreateAddressDto;
}
