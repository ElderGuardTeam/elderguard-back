import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  street: string;

  @IsString()
  number: string;

  @IsString()
  complement?: string;

  @IsString()
  neighborhood: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  zipCode: string;
}
