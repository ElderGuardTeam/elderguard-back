import { IsInt, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
class FormAnswInput {
  @IsInt()
  formId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  questionAnswares: any[];
}
export class CreateEvaluationAnswareDto {
  @IsInt()
  evaluationId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormAnswInput)
  forms: FormAnswInput[];
}
