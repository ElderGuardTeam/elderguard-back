import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UserType } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  name?: string;

  @IsEnum(UserType)
  userType: UserType;
}
