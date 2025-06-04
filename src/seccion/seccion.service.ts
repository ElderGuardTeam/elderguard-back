/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateSeccionDto } from './dto/create-seccion.dto';
import { UpdateSeccionDto } from './dto/update-seccion.dto';
import { PrismaService } from 'src/database/prisma.service';
import { RuleService } from 'src/rule/rule.service';

@Injectable()
export class SeccionService {
  private readonly logger = new Logger(SeccionService.name);

  constructor(
    private prisma: PrismaService,
    private ruleService: RuleService,
  ) {}

  private areAllRuleFieldsNull(ruleDto: any): boolean {
    if (!ruleDto || typeof ruleDto !== 'object') {
      return true;
    }
    const values = Object.values(ruleDto);
    if (values.length === 0) {
      return true;
    }
    return values.every((value) => value === null);
  }

  async create(dto: CreateSeccionDto) {
    this.logger.debug(
      `Attempting to create seccion with data: ${JSON.stringify(dto)}`,
    );
    let ruleIdToLink: string | undefined = undefined;

    if (dto.rule) {
      if (!this.areAllRuleFieldsNull(dto.rule)) {
        this.logger.debug(
          `Rule data provided for seccion and is not all nulls. Attempting to create rule: ${JSON.stringify(dto.rule)}`,
        );
        try {
          const createdRule = await this.ruleService.create(dto.rule);
          if (createdRule && createdRule.id) {
            ruleIdToLink = createdRule.id;
            this.logger.debug(
              `Rule created successfully with ID: ${ruleIdToLink}`,
            );
          } else if (createdRule) {
            this.logger.warn(
              `Rule service returned a rule object without an ID for rule data: ${JSON.stringify(dto.rule)}. Seccion title: '${dto.title}'. Proceeding without linking rule.`,
            );
          } else {
            this.logger.log(
              `Rule service returned null/undefined for rule data: ${JSON.stringify(dto.rule)}. Seccion title: '${dto.title}'. Proceeding without linking rule.`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error creating rule for seccion '${dto.title}' with rule data ${JSON.stringify(dto.rule)}: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      } else {
        this.logger.log(
          `Rule data provided for seccion '${dto.title}' but all fields were null or object was empty. Skipping rule creation. Rule data: ${JSON.stringify(dto.rule)}`,
        );
      }
    }

    const { rule, questionsIds, formId, ...rest } = dto;
    const seccionData: any = { ...rest };
    if (ruleIdToLink) {
      seccionData.rule = { connect: { id: ruleIdToLink } };
    }
    if (formId) {
      seccionData.form = { connect: { id: formId } };
    } else {
      throw new Error('formId is required to create a seccion');
    }

    // Remover ruleId se existir
    delete seccionData.ruleId;

    const seccion = await this.prisma.seccion.create({ data: seccionData });

    this.logger.log(`Seccion created with ID: ${seccion.id}`);

    if (questionsIds && Array.isArray(questionsIds)) {
      this.logger.debug(
        `Associating ${questionsIds.length} questions to seccion ID: ${seccion.id}`,
      );
      for (const questionId of questionsIds) {
        await this.prisma.seccion_has_Question.create({
          data: { seccionId: seccion.id, questionId: questionId },
        });
      }
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
