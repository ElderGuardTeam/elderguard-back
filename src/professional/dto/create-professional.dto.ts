import { UserType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateProfessionalDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  cpf: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\D/g, ''))
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsEnum(UserType)
  userType: UserType;
}
