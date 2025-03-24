/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsNumber, IsDate, IsUUID } from 'class-validator';

export class CreateElderlyDto {
  @IsString()
  cpf: string;

  @IsString()
  name: string;

  @IsDate()
  dateOfBirth: Date;

  @IsString()
  phone: string;

  @IsUUID()
  addressId: string;

  @IsString()
  sex: string;

  @IsNumber()
  weight: number;

  @IsNumber()
  height: number;

  @IsNumber()
  imc: number;
}
