import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ProfessionalService } from './professional.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserType } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Profissionais')
@ApiBearerAuth('JWT-auth')
@Controller('professional')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProfessionalController {
  constructor(private readonly professionalService: ProfessionalService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo profissional' })
  @ApiResponse({ status: 201, description: 'Profissional criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @Roles(UserType.ADMIN)
  create(@Body() createProfessionalDto: CreateProfessionalDto) {
    return this.professionalService.create(createProfessionalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os profissionais' })
  @ApiResponse({
    status: 200,
    description: 'Lista de profissionais retornada com sucesso.',
  })
  @Roles(UserType.ADMIN)
  findAll(@Query('search') search?: string) {
    return this.professionalService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um profissional pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do profissional', example: 1 })
  @ApiResponse({ status: 200, description: 'Profissional encontrado.' })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado.' })
  @Roles(UserType.ADMIN)
  findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    if (user.userType !== UserType.ADMIN && user.professional.id !== id) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.professionalService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um profissional pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do profissional', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Profissional atualizado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado.' })
  @Roles(UserType.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateProfessionalDto: UpdateProfessionalDto,
    @Request() req,
  ) {
    const user = req.user;
    if (user.userType !== UserType.ADMIN && user.professional.id !== id) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.professionalService.update(id, updateProfessionalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um profissional pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do profissional', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Profissional removido com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado.' })
  @Roles(UserType.ADMIN)
  remove(@Param('id') id: string) {
    return this.professionalService.remove(id);
  }
}
