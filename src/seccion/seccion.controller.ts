import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SeccionService } from './seccion.service';
import { CreateSeccionDto } from './dto/create-seccion.dto';
import { UpdateSeccionDto } from './dto/update-seccion.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Seções')
@ApiBearerAuth('JWT-auth')
@Controller('seccion')
export class SeccionController {
  constructor(private readonly seccionService: SeccionService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova seção de formulário' })
  @ApiResponse({ status: 201, description: 'Seção criada com sucesso.' })
  create(@Body() createSeccionDto: CreateSeccionDto) {
    return this.seccionService.create(createSeccionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as seções' })
  @ApiResponse({ status: 200, description: 'Lista de seções retornada.' })
  findAll() {
    return this.seccionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma seção pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da seção' })
  @ApiResponse({ status: 200, description: 'Seção encontrada.' })
  @ApiResponse({ status: 404, description: 'Seção não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.seccionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma seção pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da seção' })
  @ApiResponse({ status: 200, description: 'Seção atualizada.' })
  @ApiResponse({ status: 404, description: 'Seção não encontrada.' })
  update(@Param('id') id: string, @Body() updateSeccionDto: UpdateSeccionDto) {
    return this.seccionService.update(id, updateSeccionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma seção pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da seção' })
  @ApiResponse({ status: 200, description: 'Seção removida.' })
  @ApiResponse({ status: 404, description: 'Seção não encontrada.' })
  remove(@Param('id') id: string) {
    return this.seccionService.remove(id);
  }
}
