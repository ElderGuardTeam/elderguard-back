/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSeccionDto } from './dto/create-seccion.dto';
import { UpdateSeccionDto } from './dto/update-seccion.dto';
import { PrismaService } from 'src/database/prisma.service';
import { RuleService } from 'src/rule/rule.service';

@Injectable()
export class SeccionService {
  constructor(
    private prisma: PrismaService,
    private ruleService: RuleService,
  ) {}

  async create(dto: CreateSeccionDto) {
    if (dto.rule) {
      const ruledto = await this.ruleService.create(dto.rule);
      const { questionsIds, rule, ...rest } = dto;
      const seccion = await this.prisma.seccion.create({
        data: { ...rest, ruleId: ruledto.id },
      });
    }
    const { rule, questionsIds, ...rest } = dto;
    const seccion = await this.prisma.seccion.create({ data: rest });

    for (const question of dto.questionsIds) {
      await this.prisma.seccion_has_Question.create({
        data: { seccionId: seccion.id, questionId: question },
      });
    }
    return seccion;
  }

  async findAll() {
    return this.prisma.seccion.findMany({
      include: {
        rule: true,
        questionsRel: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.seccion.findUnique({
      where: { id },
      include: {
        rule: true,
        questionsRel: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateSeccionDto) {
    const existingSeccion = await this.prisma.seccion.findUnique({
      where: { id },
    });
    if (!existingSeccion) {
      throw new NotFoundException(`Seção com ID ${id} não encontrada.`);
    }

    let ruleId = existingSeccion.ruleId;
    if (dto.rule) {
      const rule = await this.ruleService.create(dto.rule);
      ruleId = rule.id;
    }

    const { rule, questionsIds, ...rest } = dto;

    const updatedSeccion = await this.prisma.seccion.update({
      where: { id },
      data: {
        ...rest,
        ruleId,
      },
    });

    if (questionsIds && Array.isArray(questionsIds)) {
      // Remove existing relations
      await this.prisma.seccion_has_Question.deleteMany({
        where: { seccionId: id },
      });
      // Add new relations
      for (const questionId of questionsIds) {
        await this.prisma.seccion_has_Question.create({
          data: { seccionId: id, questionId },
        });
      }
    }

    return updatedSeccion;
  }

  async remove(id: string) {
    // Remove relações com perguntas primeiro
    await this.prisma.seccion_has_Question.deleteMany({
      where: { seccionId: id },
    });
    // Agora remove a seção
    return this.prisma.seccion.delete({ where: { id } });
  }
}
