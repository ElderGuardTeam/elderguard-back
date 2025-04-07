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

export class CreateElderlyDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  cpf: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  education: string;

  @IsString()
  @IsNotEmpty()
  socialeconomic: string;

  @IsDateString()
  dateOfBirth: Date;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  sex: string;

  @IsNumber()
  weight: number;

  @IsNumber()
  height: number;

  @IsNumber()
  imc: number;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts: CreateContactDto[];
}
