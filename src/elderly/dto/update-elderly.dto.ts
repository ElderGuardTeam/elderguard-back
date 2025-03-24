import { PartialType } from '@nestjs/mapped-types';
import { CreateElderlyDto } from './create-elderly.dto';

export class UpdateElderlyDto extends PartialType(CreateElderlyDto) {}
