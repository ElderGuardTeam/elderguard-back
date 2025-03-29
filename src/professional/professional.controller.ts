/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ProfessionalService } from './professional.service';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { RolesGuard } from 'src/auth/roles.guard';
import { Request } from 'express';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Controller('professional')
export class ProfessionalController {
  constructor(private professionalService: ProfessionalService) {}

  // 🔒 Apenas ADMIN pode criar profissionais
  // @UseGuards(JwtAuthGuard, new RolesGuard(['ADMIN']))
  @Post()
  create(@Body() createProfessionalDto: CreateProfessionalDto) {
    return this.professionalService.create(createProfessionalDto);
  }

  // 🔒 Apenas ADMIN pode listar todos os profissionais
  // @UseGuards(JwtAuthGuard, new RolesGuard(['ADMIN']))
  @Get()
  findAll() {
    return this.professionalService.findAll();
  }

  // 🔒 ADMIN pode buscar qualquer profissional / Profissional só pode acessar seu próprio perfil
  // @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string /*@Req() request: Request*/) {
    // const user = request.user;

    // if (user.userType === 'TECH_PROFESSIONAL' && user.professional?.id !== id) {
    //   throw new ForbiddenException('Acesso negado');
    // }

    return this.professionalService.findOne(id);
  }

  // 🔒 Apenas ADMIN pode atualizar qualquer profissional
  // @UseGuards(JwtAuthGuard, new RolesGuard(['ADMIN']))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProfessionalDto: UpdateProfessionalDto,
  ) {
    return this.professionalService.update(id, updateProfessionalDto);
  }

  // 🔒 Apenas ADMIN pode deletar profissionais
  // @UseGuards(JwtAuthGuard, new RolesGuard(['ADMIN']))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.professionalService.remove(id);
  }
}
