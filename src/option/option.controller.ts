import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OptionService } from './option.service';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Opções')
@ApiBearerAuth('JWT-auth')
@Controller('option')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova opção de resposta para uma questão' })
  @ApiResponse({ status: 201, description: 'Opção criada com sucesso.' })
  create(@Body() createOptionDto: CreateOptionDto) {
    return this.optionService.create(createOptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as opções de resposta' })
  @ApiResponse({ status: 200, description: 'Lista de opções retornada.' })
  findAll() {
    return this.optionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma opção pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da opção' })
  @ApiResponse({ status: 200, description: 'Opção encontrada.' })
  @ApiResponse({ status: 404, description: 'Opção não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.optionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma opção pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da opção' })
  @ApiResponse({ status: 200, description: 'Opção atualizada.' })
  @ApiResponse({ status: 404, description: 'Opção não encontrada.' })
  update(@Param('id') id: string, @Body() updateOptionDto: UpdateOptionDto) {
    return this.optionService.update(id, updateOptionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma opção pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da opção' })
  @ApiResponse({ status: 200, description: 'Opção removida.' })
  @ApiResponse({ status: 404, description: 'Opção não encontrada.' })
  remove(@Param('id') id: string) {
    return this.optionService.remove(id);
  }
}
