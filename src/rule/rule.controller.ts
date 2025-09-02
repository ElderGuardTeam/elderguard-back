import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RuleService } from './rule.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Regras')
@ApiBearerAuth('JWT-auth')
@Controller('rule')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova regra de pontuação/resultado' })
  @ApiResponse({ status: 201, description: 'Regra criada com sucesso.' })
  create(@Body() createRuleDto: CreateRuleDto) {
    return this.ruleService.create(createRuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as regras' })
  @ApiResponse({ status: 200, description: 'Lista de regras retornada.' })
  findAll() {
    return this.ruleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma regra pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({ status: 200, description: 'Regra encontrada.' })
  @ApiResponse({ status: 404, description: 'Regra não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.ruleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma regra pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({ status: 200, description: 'Regra atualizada.' })
  @ApiResponse({ status: 404, description: 'Regra não encontrada.' })
  update(@Param('id') id: string, @Body() updateRuleDto: UpdateRuleDto) {
    return this.ruleService.update(id, updateRuleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma regra pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({ status: 200, description: 'Regra removida.' })
  @ApiResponse({ status: 404, description: 'Regra não encontrada.' })
  remove(@Param('id') id: string) {
    return this.ruleService.remove(id);
  }
}
