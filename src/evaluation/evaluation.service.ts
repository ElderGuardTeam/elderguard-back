import { Injectable } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { PrismaService } from 'src/database/prisma.service';
import { ElderlyService } from 'src/elderly/elderly.service';
import { StartEvaluationDto } from './dto/start-evaluation.dto';

@Injectable()
export class EvaluationService {
  constructor(
    private prisma: PrismaService,
    private elderlyService: ElderlyService,
  ) {}

  async create(dto: CreateEvaluationDto) {
    const { formsIds, ...evaluationData } = dto;
    const evaluation = await this.prisma.evaluation.create({
      data: evaluationData,
    });

    let index: number = 0;
    for (const form of formsIds) {
      await this.prisma.evaluation_has_Form.create({
        data: { evaluationId: evaluation.id, formId: form, order: index },
      });
      index++;
    }
    return evaluation;
  }
  async findAll(search?: string) {
    return this.prisma.evaluation.findMany({
      where: search
        ? {
            OR: [{ title: { contains: search } }],
          }
        : undefined,
      include: { formsRel: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.evaluation.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateEvaluationDto) {
    // Atualiza a avaliação
    const evaluation = await this.prisma.evaluation.update({
      where: { id },
      data: dto,
    });

    // Remove relações antigas
    await this.prisma.evaluation_has_Form.deleteMany({
      where: { evaluationId: id },
    });

    // Cria novas relações, se houver formsIds no DTO
    if (dto.formsIds && Array.isArray(dto.formsIds)) {
      let index = 0;
      for (const formId of dto.formsIds) {
        await this.prisma.evaluation_has_Form.create({
          data: { evaluationId: id, formId, order: index },
        });
        index++;
      }
    }

    return evaluation;
  }

  async remove(id: string) {
    // Remove relações antes de deletar a avaliação
    await this.prisma.evaluation_has_Form.deleteMany({
      where: { evaluationId: id },
    });
    return this.prisma.evaluation.delete({ where: { id } });
  }

  async startEvaluation(data: StartEvaluationDto) {
    const elderly = await this.elderlyService.validateIdentity(
      data.elderlyData,
    );
    if (!elderly) {
      throw new Error('Elderly not found');
    }
    const evaluation = await this.findOne(data.evaluationId);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }
    return { evaluation, elderly };
  }
}
