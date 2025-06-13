import { Type } from 'class-transformer';
import { ValidateNested, IsDefined, IsNotEmpty, IsUUID } from 'class-validator';
import { CreateFormAnswareNestedDto } from './create-form-answare-nested.dto';

export class AddFormAnswareDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateFormAnswareNestedDto)
  formAnsware: CreateFormAnswareNestedDto;

  @IsUUID()
  @IsNotEmpty()
  professionalId: string;
}
