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

@Controller('professional')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProfessionalController {
  constructor(private readonly professionalService: ProfessionalService) {}

  @Post()
  @Roles(UserType.ADMIN)
  create(@Body() createProfessionalDto: CreateProfessionalDto) {
    return this.professionalService.create(createProfessionalDto);
  }

  @Get()
  @Roles(UserType.ADMIN)
  findAll(@Query('search') search?: string) {
    return this.professionalService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    if (user.userType !== UserType.ADMIN && user.professional.id !== id) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.professionalService.findOne(id);
  }

  @Patch(':id')
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
  @Roles(UserType.ADMIN)
  remove(@Param('id') id: string) {
    return this.professionalService.remove(id);
  }
}
