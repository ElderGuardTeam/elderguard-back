import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateElderlyDto {
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sex: string;
}
