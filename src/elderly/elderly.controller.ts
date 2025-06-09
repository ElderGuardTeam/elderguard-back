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
} from '@nestjs/common';
import { ElderlyService } from './elderly.service';
import { CreateElderlyDto } from './dto/create-elderly.dto';
import { UpdateElderlyDto } from './dto/update-elderly.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserType } from '@prisma/client';
import { ValidateElderlyDto } from './dto/validate-elderly.dto';
@Controller('elderly')
@UseGuards(AuthGuard('jwt'), RolesGuard)
// @UseGuards(JwtAuthGuard, RolesGuard)
export class ElderlyController {
  constructor(private readonly elderlyService: ElderlyService) {}

  @Post()
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  create(@Body() createElderlyDto: CreateElderlyDto) {
    return this.elderlyService.create(createElderlyDto);
  }

  @Get()
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  // @Roles('ADMIN')
  async findAll(@Query('search') search?: string) {
    return this.elderlyService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    if (user.userType === UserType.USER && user.elderly.id !== id) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.elderlyService.findOne(id);
  }

  @Patch(':id')
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
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  remove(@Param('id') id: string) {
    return this.elderlyService.delete(id);
  }

  @Post('validate-identity')
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  validateIdentity(@Body() data: ValidateElderlyDto) {
    return this.elderlyService.validateIdentity(data);
  }
}
