import { Controller } from '@nestjs/common';
import { FormAnswareService } from './form-answare.service';

@Controller('form-answare')
export class FormAnswareController {
  constructor(private readonly formAnswareService: FormAnswareService) {}
}
