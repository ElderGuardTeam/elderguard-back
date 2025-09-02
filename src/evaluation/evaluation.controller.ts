import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { StartEvaluationDto } from './dto/start-evaluation.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Avaliações')
@ApiBearerAuth('JWT-auth')
@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo modelo de avaliação' })
  @ApiResponse({
    status: 201,
    description: 'Modelo de avaliação criado com sucesso.',
  })
  create(@Body() createEvaluationDto: CreateEvaluationDto) {
    return this.evaluationService.create(createEvaluationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os modelos de avaliação' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  findAll(@Query('search') search?: string) {
    return this.evaluationService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um modelo de avaliação pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do modelo de avaliação' })
  @ApiResponse({ status: 200, description: 'Modelo de avaliação encontrado.' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.evaluationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um modelo de avaliação' })
  @ApiParam({ name: 'id', description: 'ID do modelo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Modelo atualizado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateEvaluationDto: UpdateEvaluationDto,
  ) {
    return this.evaluationService.update(id, updateEvaluationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um modelo de avaliação' })
  @ApiParam({ name: 'id', description: 'ID do modelo de avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Modelo removido com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado.' })
  remove(@Param('id') id: string) {
    return this.evaluationService.remove(id);
  }

  @Post('start')
  @ApiOperation({ summary: 'Inicia uma nova avaliação para um idoso' })
  @ApiResponse({
    status: 201,
    description: 'Avaliação iniciada com sucesso.',
  })
  startEvaluation(@Body() data: StartEvaluationDto) {
    return this.evaluationService.startEvaluation(data);
  }
}
