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
import { AddFormAnswareDto } from './dto/add-form-answare.dto';
import { Roles } from 'src/auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { PauseEvaluationAnswareDto } from './dto/pause-evaluation-answare.dto';
import { UserType } from '@prisma/client';
import type { FormScoreHistory } from './evaluation-answare.service';

@Controller('evaluation-answare')
export class EvaluationAnswareController {
  constructor(
    private readonly evaluationAnswareService: EvaluationAnswareService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  create(@Body() createEvaluationAnswareDto: CreateEvaluationAnswareDto) {
    return this.evaluationAnswareService.create(createEvaluationAnswareDto);
  }

  @Patch(':id/add-form')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  addFormAnsware(
    @Param('id') id: string,
    @Body() addFormAnswareDto: AddFormAnswareDto,
  ) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  compareFormScoreWithOthersAverage(
    @Param('formId') formId: string,
    @Request() req,
  ) {
    const user = req.user;
    if (!user.elderlyId) {
      throw new ForbiddenException(
        'Acesso negado. Somente idosos podem comparar resultados.',
      );
    }
    return this.evaluationAnswareService.compareFormScoreWithOthersAverage(
      formId,
      user.elderlyId,
    );
  }

  @Get('history-by-form-type/:elderlyId/:formId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.USER, UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  async getElderlyFormScoresByType(
    @Param('elderlyId') elderlyId: string,
    @Param('formId') formId: string,
    @Request() req,
  ): Promise<FormScoreHistory[]> {
    const user = req.user;

    if (user.userType === UserType.USER && user.elderlyId !== elderlyId) {
      throw new ForbiddenException(
        'Acesso negado. Você só pode ver suas próprias avaliações.',
      );
    }
    return this.evaluationAnswareService.getElderlyFormScoresByType(
      elderlyId,
      formId,
    );
  }

  @Get('history/:elderlyId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getElderlyFormsScoresHistory(
    @Param('elderlyId') elderlyId: string,
    @Request() req,
  ): Promise<FormScoreHistory[]> {
    {
      const user = req.user;
      if (user.userType === UserType.USER && user.elderlyId !== elderlyId) {
        throw new ForbiddenException(
          'Acesso negado. Você só pode ver suas próprias avaliações.',
        );
      }
      return this.evaluationAnswareService.getElderlyFormsScoresHistory(
        elderlyId,
      );
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL, UserType.USER)
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    const evaluationAnsware = await this.evaluationAnswareService.findOne(id);

    if (
      user.userType === UserType.USER &&
      evaluationAnsware.elderlyId !== user.elderlyId
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
