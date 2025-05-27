import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EvaluationAnswareService } from './evaluation-answare.service';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { UpdateEvaluationAnswareDto } from './dto/update-evaluation-answare.dto';

@Controller('evaluation-answares') // Pluralizado para seguir convenções REST
export class EvaluationAnswareController {
  constructor(
    private readonly evaluationAnswareService: EvaluationAnswareService,
  ) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
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
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
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
