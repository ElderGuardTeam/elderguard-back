import { PartialType } from '@nestjs/mapped-types';
import { CreateEvaluationAnswareDto } from './create-evaluation-answare.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EvaluationAnswareStatus } from '@prisma/client';

export class UpdateEvaluationAnswareDto extends PartialType(
  CreateEvaluationAnswareDto,
) {
  @IsEnum(EvaluationAnswareStatus)
  @IsOptional()
  status?: EvaluationAnswareStatus;
}
