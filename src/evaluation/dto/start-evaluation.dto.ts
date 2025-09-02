import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { ValidateElderlyDto } from 'src/elderly/dto/validate-elderly.dto';
import { ApiProperty } from '@nestjs/swagger';
export class StartEvaluationDto {
  @ApiProperty({
    description: 'ID do modelo de avaliação a ser iniciado',
    example: 1,
  })
  @IsString()
  evaluationId: string;

  @ApiProperty({
    description: 'Dados do idoso para quem a avaliação está sendo iniciada',
  })
  @ValidateNested()
  @Type(() => ValidateElderlyDto)
  elderlyData: ValidateElderlyDto;
}
