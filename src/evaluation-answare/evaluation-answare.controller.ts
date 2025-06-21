import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EvaluationAnswareService } from './evaluation-answare.service';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { AddFormAnswareDto } from './dto/add-form-answare.dto'; // Importar o novo DTO
import { Roles } from 'src/auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { PauseEvaluationAnswareDto } from './dto/pause-evaluation-answare.dto';

@Controller('evaluation-answare')
export class EvaluationAnswareController {
  constructor(
    private readonly evaluationAnswareService: EvaluationAnswareService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'TECH_PROFESSIONAL')
  create(@Body() createEvaluationAnswareDto: CreateEvaluationAnswareDto) {
    return this.evaluationAnswareService.create(createEvaluationAnswareDto);
  }

  @Patch(':id/add-form') // Endpoint mais descritivo
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'TECH_PROFESSIONAL')
  addFormAnsware(
    @Param('id') id: string,
    @Body() addFormAnswareDto: AddFormAnswareDto,
  ) {
    // O método de patch agora tem um nome mais claro e usa o DTO específico
    return this.evaluationAnswareService.addFormAnsware(id, addFormAnswareDto);
  }

  @Patch(':id/pause')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'TECH_PROFESSIONAL')
  pause(@Param('id') id: string, @Body() pauseDto: PauseEvaluationAnswareDto) {
    return this.evaluationAnswareService.pause(id, pauseDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'TECH_PROFESSIONAL')
  findAll(@Query('search') search?: string) {
    return this.evaluationAnswareService.findAll(search);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'TECH_PROFESSIONAL')
  findOne(@Param('id') id: string) {
    return this.evaluationAnswareService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.evaluationAnswareService.remove(id);
  }
}
