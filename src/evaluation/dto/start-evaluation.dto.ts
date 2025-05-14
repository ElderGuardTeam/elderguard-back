import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { ValidateElderlyDto } from 'src/elderly/dto/validate-elderly.dto';
export class StartEvaluationDto {
  @IsString()
  evaluationId: string;

  @ValidateNested()
  @Type(() => ValidateElderlyDto)
  elderlyData: ValidateElderlyDto;
}
