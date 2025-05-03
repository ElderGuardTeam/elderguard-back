import { PartialType } from '@nestjs/mapped-types';
import { CreateEvaluationAnswareDto } from './create-evaluation-answare.dto';

export class UpdateEvaluationAnswareDto extends PartialType(CreateEvaluationAnswareDto) {}
