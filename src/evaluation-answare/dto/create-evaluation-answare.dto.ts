import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateFormAnswareNestedDto } from './create-form-answare-nested.dto';
import { EvaluationAnswareStatus } from '@prisma/client';

export class CreateEvaluationAnswareDto {
  @IsUUID()
  @IsNotEmpty()
  evaluationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormAnswareNestedDto)
  formAnswares: CreateFormAnswareNestedDto[];

  @IsEnum(EvaluationAnswareStatus)
  @IsOptional()
  @IsOptional()
  status?: EvaluationAnswareStatus;

  @IsUUID()
  @IsNotEmpty()
  elderlyId: string;
}
