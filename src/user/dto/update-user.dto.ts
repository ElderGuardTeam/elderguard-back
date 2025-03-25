import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserType } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;
}
