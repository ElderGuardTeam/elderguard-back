import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FormService } from './form.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Avaliações') // Agrupado com Avaliações para contexto
@ApiBearerAuth('JWT-auth')
@Controller('form')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo formulário dentro de uma avaliação' })
  @ApiResponse({ status: 201, description: 'Formulário criado com sucesso.' })
  create(@Body() createFormDto: CreateFormDto) {
    return this.formService.create(createFormDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os formulários' })
  @ApiResponse({ status: 200, description: 'Lista de formulários retornada.' })
  findAll() {
    return this.formService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um formulário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do formulário' })
  @ApiResponse({ status: 200, description: 'Formulário encontrado.' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.formService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um formulário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do formulário' })
  @ApiResponse({ status: 200, description: 'Formulário atualizado.' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado.' })
  update(@Param('id') id: string, @Body() updateFormDto: UpdateFormDto) {
    return this.formService.update(id, updateFormDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um formulário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do formulário' })
  @ApiResponse({ status: 200, description: 'Formulário removido.' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado.' })
  remove(@Param('id') id: string) {
    return this.formService.remove(id);
  }
}
