import {
  IsString,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  IsArray,
  IsDateString,
  IsEmail,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateAddressDto } from 'src/address/dto/create-address.dto';
import { CreateContactDto } from 'src/contact/dto/create-contact.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateElderlyDto {
  @ApiProperty({
    description: 'CPF do idoso (somente números)',
    example: '12345678900',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  cpf: string;

  @ApiProperty({
    description: 'Nome completo do idoso',
    example: 'João da Silva',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Grau de escolaridade',
    example: 'Ensino Médio Completo',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  education: string;

  @ApiProperty({
    description: 'Nível socioeconômico',
    example: 'Classe C',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  socialeconomic: string;

  @ApiProperty({
    description: 'Data de nascimento no formato YYYY-MM-DD',
    example: '1945-10-23',
  })
  @IsDateString()
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Telefone de contato (somente números)',
    example: '11987654321',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  phone: string;

  @ApiProperty({
    description: 'Endereço de email do idoso',
    example: 'exemplo@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Sexo do idoso',
    example: 'Masculino',
  })
  @IsString()
  @IsNotEmpty()
  sex: string;

  @ApiProperty({
    description: 'Peso do idoso em kg',
    example: 70,
  })
  @IsNumber()
  weight: number;

  @ApiProperty({
    description: 'Altura do idoso em cm',
    example: 170,
  })
  @IsNumber()
  height: number;

  @ApiProperty({
    description: 'Índice de Massa Corporal (IMC) do idoso',
    example: 24.2,
  })
  @IsNumber()
  imc: number;

  @ApiProperty({
    type: () => CreateAddressDto,
    description: 'Endereço do idoso',
  })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @ApiProperty({
    type: () => CreateContactDto,
    description: 'Contato do idoso',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts: CreateContactDto[];
}
