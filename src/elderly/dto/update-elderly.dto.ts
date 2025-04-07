import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateContactDto } from '../../contact/dto/update-contact.dto';

export class UpdateElderlyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsDateString()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  socialeconomic?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
