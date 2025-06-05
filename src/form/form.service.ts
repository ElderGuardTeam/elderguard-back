/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from 'src/database/prisma.service';
import { SeccionService } from 'src/seccion/seccion.service';
import { RuleService } from 'src/rule/rule.service';

@Injectable()
export class FormService {
  private readonly logger = new Logger(FormService.name);

  constructor(
    private prisma: PrismaService,
    private seccionService: SeccionService,
    private ruleService: RuleService,
  ) {}

  private areAllRuleFieldsNull(ruleDto: any): boolean {
    if (!ruleDto || typeof ruleDto !== 'object') {
      return true; // Considera não objeto ou nulo como "todos os campos nulos"
    }
    const values = Object.values(ruleDto);
    if (values.length === 0) {
      return true; // Considera objeto vazio como "todos os campos nulos"
    }
    return values.every((value) => value === null);
  }

  async create(dto: CreateFormDto) {
    this.logger.debug(
      `Attempting to create form with data: ${JSON.stringify(dto)}`,
    );
    let ruleIdToLink: string | undefined = undefined;

    // Verifica se dto.rule existe e se não tem todos os seus valores como null
    if (dto.rule) {
      if (!this.areAllRuleFieldsNull(dto.rule)) {
        this.logger.debug(
          `Rule data provided for form and is not all nulls. Attempting to create rule: ${JSON.stringify(dto.rule)}`,
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
              `Rule service returned a rule object without an ID for rule data: ${JSON.stringify(dto.rule)}. Form title: '${dto.title}'. Proceeding without linking rule.`,
            );
          } else {
            this.logger.log(
              `Rule service returned null/undefined for rule data: ${JSON.stringify(dto.rule)}. Form title: '${dto.title}'. Proceeding without linking rule.`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error creating rule for form '${dto.title}' with rule data ${JSON.stringify(dto.rule)}: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      } else {
        this.logger.log(
          `Rule data provided for form '${dto.title}' but all fields were null or object was empty. Skipping rule creation. Rule data: ${JSON.stringify(dto.rule)}`,
        );
      }
    }

    const { rule, seccions, questionsIds, ...rest } = dto;

    // 1. Crie o formulário primeiro
    const form = await this.prisma.form.create({
      data: {
        ...rest,
        ...(ruleIdToLink && { ruleId: ruleIdToLink }),
      },
      include: { seccions: true, rule: true },
    });

    // 2. Crie as seções associando o formId e associe perguntas às seções
    const seccionIds: string[] = [];
    if (seccions && Array.isArray(seccions)) {
      this.logger.debug(
        `Processing ${seccions.length} sections for form ID: ${form.id}`,
      );
      for (const seccionDto of seccions) {
        // Cria a seção
        const seccion = await this.seccionService.create({
          ...seccionDto,
          formId: form.id,
        });
        seccionIds.push(seccion.id);
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
      this.logger.debug(
        `Associating ${questionsIds.length} questions to form ID: ${form.id}`,
      );
      let index = 0;
      for (const questionId of questionsIds) {
        await this.prisma.form_has_Question.create({
          data: { formId: form.id, questionId, index },
        });
        index++;
      }
    }

    const createdForm = await this.prisma.form.findUnique({
      where: { id: form.id },
      include: { seccions: true, rule: true },
    });
    this.logger.log(`Form created successfully with ID: ${form.id}`);
    return createdForm;
  }

  async findAll() {
    return this.prisma.form.findMany({
      orderBy: {
        created: 'desc',
      },
      include: {
        seccions: {
          include: {
            questionsRel: {
              include: {
                question: true, // Inclui os dados completos da questão
              },
            },
            rule: true,
          },
        },
        rule: true,
        questionsRel: {
          include: {
            question: true, // Inclui os dados completos da questão
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.form.findUnique({
      where: { id },
      include: {
        seccions: {
          include: {
            questionsRel: {
              include: {
                question: { include: { options: true } }, // Inclui os dados completos da questão e suas opções
              },
            },
            rule: true,
          },
        },
        rule: true,
        questionsRel: {
          include: {
            question: true, // Inclui os dados completos da questão
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateFormDto) {
    let ruleId: string | undefined = undefined;
    if (dto.rule) {
      if (dto.rule.id) {
        // Atualiza a regra existente
        const rule = await this.ruleService.update(dto.rule.id, dto.rule);
        ruleId = rule.id;
      } else {
        // Cria uma nova regra
        const { id, ...ruleData } = dto.rule; // <-- Remover id antes de criar
        const rule = await this.ruleService.create(ruleData);
        ruleId = rule.id;
      }
    }

    if (dto.seccions && Array.isArray(dto.seccions)) {
      let index = 0;
      for (const seccionDto of dto.seccions) {
        // Verifica se existe uma regra na seção
        if (seccionDto.rule) {
          // Só cria/atualiza se houver campos obrigatórios preenchidos
          if (seccionDto.rule.type) {
            if (seccionDto.rule.id) {
              await this.ruleService.update(
                seccionDto.rule.id,
                seccionDto.rule,
              );
            } else {
              const createdRule = await this.ruleService.create(
                seccionDto.rule,
              );
              seccionDto.ruleId = createdRule.id;
            }
          }
          // Se não houver 'type', não cria nem atualiza a regra
        }
        let seccion;
        if (dto.seccionsIds) {
          seccion = await this.seccionService.update(
            dto.seccionsIds[index],
            { ...seccionDto, formId: id }, // <-- adiciona formId aqui
          );
          index++;
        } else {
          seccion = await this.seccionService.create({
            ...seccionDto,
            formId: id, // <-- adiciona formId aqui
          });
        }
      }
    }

    const { rule, seccions, questionsIds, ...rest } = dto;

    const form = await this.prisma.form.update({
      where: { id },
      data: {
        ...rest,
        ...(ruleId && { ruleId }),
        ...(dto.seccionsIds && dto.seccionsIds.length
          ? {
              seccions: {
                set: dto.seccionsIds.map((id) => ({ id })),
              },
            }
          : {}),
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
