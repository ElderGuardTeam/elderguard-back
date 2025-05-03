import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EvaluationAnswareService } from './evaluation-answare.service';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { UpdateEvaluationAnswareDto } from './dto/update-evaluation-answare.dto';

@Controller('evaluation-answare')
export class EvaluationAnswareController {
  constructor(
    private readonly evaluationAnswareService: EvaluationAnswareService,
  ) {}

  @Post()
  create(@Body() createEvaluationAnswareDto: CreateEvaluationAnswareDto) {
    return this.evaluationAnswareService.create(createEvaluationAnswareDto);
  }

  @Get()
  findAll() {
    return this.evaluationAnswareService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evaluationAnswareService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEvaluationAnswareDto: UpdateEvaluationAnswareDto,
  ) {
    return this.evaluationAnswareService.update(id, updateEvaluationAnswareDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evaluationAnswareService.remove(id);
  }
}
