import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'A nova senha para o usuário. Mínimo de 6 caracteres.',
    example: 'novaSenhaForte456',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
