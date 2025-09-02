/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ElderlyService } from './elderly.service';
import { CreateElderlyDto } from './dto/create-elderly.dto';
import { UpdateElderlyDto } from './dto/update-elderly.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserType } from '@prisma/client';
import { ValidateElderlyDto } from './dto/validate-elderly.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Idosos')
@ApiBearerAuth('JWT-auth')
@Controller('elderly')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ElderlyController {
  constructor(private readonly elderlyService: ElderlyService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro de idoso' })
  @ApiResponse({
    status: 201,
    description: 'Idoso criado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  create(@Body() createElderlyDto: CreateElderlyDto) {
    return this.elderlyService.create(createElderlyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os idosos' })
  @ApiResponse({ status: 200, description: 'Lista de idosos retornada.' })
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  async findAll(@Query('search') search?: string) {
    return this.elderlyService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um idoso pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do idoso', example: 1 })
  @ApiResponse({ status: 200, description: 'Idoso encontrado.' })
  @ApiResponse({ status: 404, description: 'Idoso não encontrado.' })
  findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    if (user.userType === UserType.USER && user.elderly.id !== id) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.elderlyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um idoso pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do idoso', example: 1 })
  @ApiResponse({ status: 200, description: 'Idoso atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Idoso não encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateElderlyDto: UpdateElderlyDto,
    @Request() req,
  ) {
    const user = req.user;
    if (user.userType === UserType.USER && user.elderly.id !== id) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.elderlyService.update(id, updateElderlyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um idoso pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do idoso', example: 1 })
  @ApiResponse({ status: 200, description: 'Idoso removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Idoso não encontrado.' })
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  remove(@Param('id') id: string) {
    return this.elderlyService.delete(id);
  }

  @Post('validate-identity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valida se um idoso já existe pelo CPF',
    description:
      'Verifica a existência de um idoso na base de dados usando o CPF. Retorna os dados do idoso se encontrado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Idoso encontrado e retornado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Idoso não encontrado.',
  })
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  validateIdentity(@Body() data: ValidateElderlyDto) {
    return this.elderlyService.validateIdentity(data);
  }
}
