import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UpdateContactDto } from '../../contact/dto/update-contact.dto';

export class UpdateElderlyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.replace(/\D/g, ''))
  phone?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  weight?: number;

  @IsOptional()
  height?: number;

  @IsOptional()
  imc?: number;

  @IsOptional()
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContactDto)
  contacts?: UpdateContactDto[];
}
