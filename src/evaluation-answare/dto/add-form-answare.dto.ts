import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty, IsUUID, IsArray } from 'class-validator';
import { CreateFormAnswareNestedDto } from './create-form-answare-nested.dto';

export class AddFormAnswareDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormAnswareNestedDto)
  formAnswares: CreateFormAnswareNestedDto[];

  @IsUUID()
  @IsNotEmpty()
  professionalId: string;
}
