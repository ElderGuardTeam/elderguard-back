/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
  UseGuards,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { EvaluationAnswareService } from './evaluation-answare.service';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { AddFormAnswareDto } from './dto/add-form-answare.dto'; // Importar o novo DTO
import { Roles } from 'src/auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { PauseEvaluationAnswareDto } from './dto/pause-evaluation-answare.dto';
import { UserType } from '@prisma/client';

@Controller('evaluation-answare')
export class EvaluationAnswareController {
  constructor(
    private readonly evaluationAnswareService: EvaluationAnswareService,
    // private readonly userService: UserService, // UserService is not used in this controller
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  create(@Body() createEvaluationAnswareDto: CreateEvaluationAnswareDto) {
    return this.evaluationAnswareService.create(createEvaluationAnswareDto);
  }

  @Patch(':id/add-form') // Endpoint mais descritivo
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  addFormAnsware(
    @Param('id') id: string,
    @Body() addFormAnswareDto: AddFormAnswareDto,
  ) {
    // O método de patch agora tem um nome mais claro e usa o DTO específico
    return this.evaluationAnswareService.addFormAnsware(id, addFormAnswareDto);
  }

  @Patch(':id/pause')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  pause(@Param('id') id: string, @Body() pauseDto: PauseEvaluationAnswareDto) {
    return this.evaluationAnswareService.pause(id, pauseDto);
  }

  @Patch(':id/complete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  complete(
    @Param('id') id: string,
    @Body() completeDto: PauseEvaluationAnswareDto,
  ) {
    // Reutiliza PauseEvaluationAnswareDto, pois a estrutura é a mesma (formAnswares e professionalId)
    return this.evaluationAnswareService.complete(id, completeDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  findAll(@Query('search') search?: string) {
    return this.evaluationAnswareService.findAll(search);
  }

  @Get('my-evaluations/:elderlyId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.USER)
  findMyEvaluationsByElderlyId(
    @Param('elderlyId') elderlyId: string,
    @Request() req,
  ) {
    const user = req.user;
    if (!elderlyId) {
      throw new ForbiddenException(
        'Acesso negado. Você só pode ver suas próprias avaliações.',
      );
    }
    return this.evaluationAnswareService.findAllByElderlyId(elderlyId);
  }
  // findMyEvaluations(@Request() req) {
  //   const user = req.user;
  //   if (!user.elderly?.id) {
  //     throw new ForbiddenException(
  //       'Acesso negado. Somente idosos podem ver suas próprias avaliações.', // This message is already in the compiled JS
  //     );
  //   }
  //   return this.evaluationAnswareService.findAllByElderlyId(user.elderly.id);
  // }

  @Get('compare-form/:formId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.USER)
  compareFormScores(@Param('formId') formId: string, @Request() req) {
    const user = req.user;
    if (!user.elderly?.id) {
      throw new ForbiddenException(
        'Acesso negado. Somente idosos podem comparar resultados.',
      );
    }
    return this.evaluationAnswareService.compareFormScores(
      formId,
      user.elderly.id,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL, UserType.USER)
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    const evaluationAnsware = await this.evaluationAnswareService.findOne(id);

    if (
      user.userType === UserType.USER &&
      evaluationAnsware.elderlyId !== user.elderly.id
    ) {
      throw new ForbiddenException(
        'Acesso negado. Você só pode ver suas próprias avaliações.',
      );
    }
    return evaluationAnsware;
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  remove(@Param('id') id: string) {
    return this.evaluationAnswareService.remove(id);
  }
}
