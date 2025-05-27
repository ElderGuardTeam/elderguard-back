import { PartialType } from '@nestjs/mapped-types';
import { CreateEvaluationAnswareDto } from './create-evaluation-answare.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EvaluationAnswareStatus } from '@prisma/client'; // Importar o enum gerado pelo Prisma

export class UpdateEvaluationAnswareDto extends PartialType(
  CreateEvaluationAnswareDto,
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @IsEnum(EvaluationAnswareStatus)
  @IsOptional()
  status?: EvaluationAnswareStatus;
}
