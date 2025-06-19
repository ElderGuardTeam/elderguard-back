import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'A rua não pode estar vazia.' })
  street: string;

  @IsString()
  @IsNotEmpty({ message: 'O número não pode estar vazio.' })
  number: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString()
  @IsNotEmpty({ message: 'O bairro não pode estar vazio.' })
  neighborhood: string;

  @IsString()
  @IsNotEmpty({ message: 'A cidade não pode estar vazia.' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'O estado não pode estar vazio.' })
  state: string;

  @IsString()
  @IsNotEmpty({ message: 'O CEP não pode estar vazio.' })
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  zipCode: string;
}
