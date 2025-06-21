import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CreateFormAnswareNestedDto } from './create-form-answare-nested.dto';

export class PauseEvaluationAnswareDto {
  @IsString()
  @IsNotEmpty()
  professionalId: string;

  @ValidateNested()
  @Type(() => CreateFormAnswareNestedDto)
  formAnswares: CreateFormAnswareNestedDto;
}
