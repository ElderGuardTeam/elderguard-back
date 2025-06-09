import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.$transaction(async (tx) => {
      const { formsIds, ...evaluationData } = dto;
      const evaluation = await tx.evaluation.create({
        data: evaluationData,
      });

      if (formsIds && formsIds.length > 0) {
        const evaluationFormsData = formsIds.map((formId, index) => ({
          evaluationId: evaluation.id,
          formId: formId,
          order: index,
        }));
        await tx.evaluation_has_Form.createMany({
          data: evaluationFormsData,
        });
      }
      return evaluation;
    });
  }
  async findAll(search?: string) {
    return this.prisma.evaluation.findMany({
      where: search
        ? {
            OR: [{ title: { contains: search } }],
          }
        : undefined,
      orderBy: {
        created: 'desc',
      },
      include: { formsRel: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.evaluation.findUnique({
      where: { id },
      include: {
        formsRel: {
          orderBy: {
            order: 'asc',
          },
          select: {
            order: true,
            form: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateEvaluationDto) {
    const { formsIds, ...evaluationUpdateData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const evaluation = await tx.evaluation.update({
        where: { id },
        data: evaluationUpdateData,
      });

      await tx.evaluation_has_Form.deleteMany({
        where: { evaluationId: id },
      });

      if (formsIds && Array.isArray(formsIds) && formsIds.length > 0) {
        const newEvaluationFormsData = formsIds.map((formId, index) => ({
          evaluationId: evaluation.id,
          formId,
          order: index,
        }));
        await tx.evaluation_has_Form.createMany({
          data: newEvaluationFormsData,
        });
      }

      return evaluation;
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.evaluation_has_Form.deleteMany({
        where: { evaluationId: id },
      });
      return tx.evaluation.delete({ where: { id } });
    });
  }

  async startEvaluation(data: StartEvaluationDto) {
    const elderly = await this.elderlyService.validateIdentity(
      data.elderlyData,
    );
    if (!elderly) {
      throw new NotFoundException('Elderly not found');
    }
    const evaluation = await this.findOne(data.evaluationId);
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }
    return { evaluation, elderly };
  }
}
