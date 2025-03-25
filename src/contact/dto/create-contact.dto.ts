import { Type } from 'class-transformer';
import { IsString, IsEmail, ValidateNested } from 'class-validator';
import { CreateAddressDto } from 'src/address/dto/create-address.dto';

export class CreateContactDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  cpf: string;

  @IsString()
  addressId: string;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @IsString()
  elderlyId: string;
}
