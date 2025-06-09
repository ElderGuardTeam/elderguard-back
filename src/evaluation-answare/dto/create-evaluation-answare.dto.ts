import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateFormAnswareNestedDto } from './create-form-answare-nested.dto';

export class CreateEvaluationAnswareDto {
  @IsUUID()
  @IsNotEmpty()
  evaluationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormAnswareNestedDto)
  formAnswares: CreateFormAnswareNestedDto[];

  @IsNumber()
  @IsOptional()
  scoreTotal?: number;
}
