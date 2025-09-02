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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Respostas de Avaliações')
@ApiBearerAuth('JWT-auth')
@Controller('evaluation-answare')
export class EvaluationAnswareController {
  constructor(
    private readonly evaluationAnswareService: EvaluationAnswareService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cria/Inicia uma nova resposta de avaliação (Admin/Profissional)',
  })
  @ApiResponse({
    status: 201,
    description: 'Resposta de avaliação iniciada com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (permissão de Admin/Profissional necessária).',
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  create(@Body() createEvaluationAnswareDto: CreateEvaluationAnswareDto) {
    return this.evaluationAnswareService.create(createEvaluationAnswareDto);
  }

  @Patch(':id/add-form')
  @ApiOperation({
    summary:
      'Adiciona respostas de um formulário a uma avaliação em andamento (Admin/Profissional)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da resposta da avaliação (EvaluationAnsware)',
  })
  @ApiResponse({
    status: 200,
    description: 'Respostas do formulário adicionadas com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  addFormAnsware(
    @Param('id') id: string,
    @Body() addFormAnswareDto: AddFormAnswareDto,
  ) {
    return this.evaluationAnswareService.addFormAnsware(id, addFormAnswareDto);
  }

  @Patch(':id/pause')
  @ApiOperation({
    summary: 'Pausa uma avaliação em andamento (Admin/Profissional)',
  })
  @ApiParam({ name: 'id', description: 'ID da avaliação a ser pausada' })
  @ApiResponse({ status: 200, description: 'Avaliação pausada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  pause(@Param('id') id: string, @Body() pauseDto: PauseEvaluationAnswareDto) {
    return this.evaluationAnswareService.pause(id, pauseDto);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Finaliza uma avaliação em andamento (Admin/Profissional)',
  })
  @ApiParam({ name: 'id', description: 'ID da avaliação a ser completada' })
  @ApiResponse({
    status: 200,
    description: 'Avaliação completada com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  complete(
    @Param('id') id: string,
    @Body() completeDto: PauseEvaluationAnswareDto,
  ) {
    return this.evaluationAnswareService.complete(id, completeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todas as respostas de avaliações (Admin/Profissional)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Filtra as avaliações pelo nome ou CPF do idoso',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de respostas de avaliações retornada.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN, UserType.TECH_PROFESSIONAL)
  findAll(@Query('search') search?: string) {
    return this.evaluationAnswareService.findAll(search);
  }

  @Get('my-evaluations/:elderlyId')
  @ApiOperation({
    summary: 'Busca as avaliações de um idoso (Apenas para o próprio idoso)',
  })
  @ApiParam({ name: 'elderlyId', description: 'ID do idoso' })
  @ApiResponse({
    status: 200,
    description: 'Lista de avaliações do idoso retornada.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Você só pode ver suas próprias avaliações.',
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.USER)
  findMyEvaluationsByElderlyId(
    @Param('elderlyId') elderlyId: string,
    @Request() req,
  ) {
    const user = req.user;
    if (user.elderlyId !== elderlyId) {
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
  @ApiOperation({
    summary:
      'Compara a pontuação com a média geral para um formulário (Apenas Idoso)',
  })
  @ApiParam({ name: 'formId', description: 'ID do formulário a ser comparado' })
  @ApiResponse({
    status: 200,
    description: 'Comparativo retornado com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Somente idosos podem comparar resultados.',
  })
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
  @ApiOperation({
    summary:
      'Busca o histórico de pontuação de um idoso para um tipo de formulário',
  })
  @ApiParam({ name: 'elderlyId', description: 'ID do idoso' })
  @ApiParam({ name: 'formId', description: 'ID do formulário (tipo)' })
  @ApiResponse({
    status: 200,
    description: 'Histórico de pontuações retornado.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
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
  @ApiOperation({
    summary:
      'Busca o histórico de pontuações de todos os formulários para um idoso',
  })
  @ApiParam({ name: 'elderlyId', description: 'ID do idoso' })
  @ApiResponse({ status: 200, description: 'Histórico completo retornado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
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
  @ApiOperation({
    summary: 'Busca uma resposta de avaliação específica pelo ID',
  })
  @ApiParam({ name: 'id', description: 'ID da resposta da avaliação' })
  @ApiResponse({
    status: 200,
    description: 'Dados da resposta da avaliação encontrados.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({
    status: 404,
    description: 'Resposta de avaliação não encontrada.',
  })
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
  @ApiOperation({ summary: 'Remove uma resposta de avaliação (Apenas Admin)' })
  @ApiParam({
    name: 'id',
    description: 'ID da resposta da avaliação a ser removida',
  })
  @ApiResponse({
    status: 200,
    description: 'Resposta de avaliação removida com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado (permissão de Admin necessária).',
  })
  @ApiResponse({
    status: 404,
    description: 'Resposta de avaliação não encontrada.',
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  remove(@Param('id') id: string) {
    return this.evaluationAnswareService.remove(id);
  }
}
