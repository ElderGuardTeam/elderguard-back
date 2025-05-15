/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from 'src/database/prisma.service';
import { SeccionService } from 'src/seccion/seccion.service';
import { RuleService } from 'src/rule/rule.service';

@Injectable()
export class FormService {
  constructor(
    private prisma: PrismaService,
    private seccionService: SeccionService,
    private ruleService: RuleService,
  ) {}

  async create(dto: CreateFormDto) {
    let ruleId: string | undefined = undefined;
    if (dto.rule) {
      const rule = await this.ruleService.create(dto.rule);
      ruleId = rule.id;
    }

    const { rule, seccions, questionsIds, ...rest } = dto;

    // 1. Crie o formulário primeiro
    const form = await this.prisma.form.create({
      data: {
        ...rest,
        ...(ruleId && { ruleId }),
      },
      include: { seccions: true, rule: true },
    });

    // 2. Crie as seções associando o formId e associe perguntas às seções
    const seccionIds: string[] = [];
    if (seccions && Array.isArray(seccions)) {
      for (const seccionDto of seccions) {
        // Cria a seção
        const seccion = await this.seccionService.create({
          ...seccionDto,
          formId: form.id,
        });
        seccionIds.push(seccion.id);

        // Associa perguntas à seção
      }
      // Atualize o formulário para conectar as seções criadas
      await this.prisma.form.update({
        where: { id: form.id },
        data: {
          seccions: {
            connect: seccionIds.map((id) => ({ id })),
          },
        },
      });
    }

    // 3. Associe as perguntas ao formulário (Form_has_Question)
    if (questionsIds && Array.isArray(questionsIds)) {
      let index = 0;
      for (const questionId of questionsIds) {
        await this.prisma.form_has_Question.create({
          data: { formId: form.id, questionId, index },
        });
        index++;
      }
    }

    return this.prisma.form.findUnique({
      where: { id: form.id },
      include: { seccions: true, rule: true },
    });
  }

  async findAll() {
    return this.prisma.form.findMany({
      include: {
        seccions: {
          include: {
            questionsRel: true,
            rule: true,
          },
        },
        rule: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.form.findUnique({
      where: { id },
      include: {
        seccions: {
          include: {
            questionsRel: true,
            rule: true,
          },
        },
        rule: true,
      },
    });
  }

  async update(id: string, dto: UpdateFormDto) {
    let ruleId: string | undefined = undefined;
    if (dto.rule) {
      const rule = await this.ruleService.create(dto.rule);
      ruleId = rule.id;
    }

    if (dto.seccions && Array.isArray(dto.seccions)) {
      let index = 0;
      for (const seccionDto of dto.seccions) {
        let seccion;
        if (dto.seccionsIds) {
          seccion = await this.seccionService.update(
            dto.seccionsIds[index],
            seccionDto,
          );
          index++;
        } else {
          seccion = await this.seccionService.create(seccionDto);
        }
      }
    }

    const { rule, seccions, questionsIds, ...rest } = dto;

    const form = await this.prisma.form.update({
      where: { id },
      data: {
        ...rest,
        ...(ruleId && { ruleId }),
        ...(dto.seccionsIds.length && {
          seccions: {
            set: dto.seccionsIds.map((id) => ({ id })),
          },
        }),
      },
      include: { seccions: true, rule: true },
    });

    // Atualiza as perguntas associadas ao formulário
    if (questionsIds && Array.isArray(questionsIds)) {
      // Remove associações antigas
      await this.prisma.form_has_Question.deleteMany({ where: { formId: id } });

      // Cria novas associações
      let index = 0;
      for (const questionId of questionsIds) {
        await this.prisma.form_has_Question.create({
          data: { formId: id, questionId, index },
        });
        index++;
      }
    }

    return form;
  }

  async remove(id: string) {
    // Remove associações com perguntas antes de deletar o formulário
    await this.prisma.form_has_Question.deleteMany({ where: { formId: id } });
    return this.prisma.form.delete({ where: { id } });
  }
}
