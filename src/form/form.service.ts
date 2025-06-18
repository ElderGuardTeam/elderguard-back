/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from 'src/database/prisma.service';
import { SeccionService } from 'src/seccion/seccion.service';
import { RuleService } from 'src/rule/rule.service';
import { Prisma } from '@prisma/client';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';
import { CreateSeccionDto } from 'src/seccion/dto/create-seccion.dto';

@Injectable()
export class FormService {
  private readonly logger = new Logger(FormService.name);

  constructor(
    private prisma: PrismaService,
    private seccionService: SeccionService,
    private ruleService: RuleService,
  ) {}

  private areAllRuleFieldsNull(
    ruleDto: Partial<CreateRuleDto> | null | undefined,
  ): boolean {
    if (!ruleDto || typeof ruleDto !== 'object' || ruleDto === null) {
      return true;
    }
    const values = Object.values(ruleDto);
    if (values.length === 0) {
      return true;
    }
    return values.every((value) => value === null);
  }

  async create(dto: CreateFormDto) {
    return this.prisma.$transaction(async (tx) => {
      this.logger.debug(
        `Attempting to create form with data: ${JSON.stringify(dto)}`,
      );
      let ruleIdToLink: string | undefined = undefined;

      if (dto.rule) {
        if (!this.areAllRuleFieldsNull(dto.rule)) {
          this.logger.debug(
            `Rule data provided. Attempting to create rule: ${JSON.stringify(dto.rule)}`,
          );
          try {
            const createdRule = await this.ruleService.create(dto.rule, tx);
            if (createdRule && createdRule.id) {
              ruleIdToLink = createdRule.id;
              this.logger.debug(
                `Rule created successfully with ID: ${ruleIdToLink}`,
              );
            } else {
              this.logger.warn(
                `Rule service did not return an ID for rule data: ${JSON.stringify(dto.rule)}. Form title: '${dto.title}'.`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Error creating rule for form '${dto.title}': ${error.message}`,
              error.stack,
            );
            throw error;
          }
        } else {
          this.logger.log(
            `Rule data for form '${dto.title}' has all fields null. Skipping rule creation.`,
          );
        }
      }

      const { rule: _rule, seccions, questionsIds, ...formData } = dto;

      const formCreateData: Prisma.FormCreateInput = {
        ...formData,
        ...(ruleIdToLink && { rule: { connect: { id: ruleIdToLink } } }),
        questionsRel:
          questionsIds && questionsIds.length > 0
            ? {
                create: questionsIds.map((questionId, index) => ({
                  question: { connect: { id: questionId } },
                  index,
                })),
              }
            : undefined,
      };

      const createdForm = await tx.form.create({
        data: formCreateData,
        include: {
          seccions: true,
          rule: true,
          questionsRel: { include: { question: true } },
        },
      });

      if (seccions && Array.isArray(seccions)) {
        this.logger.debug(
          `Processing ${seccions.length} sections for form ID: ${createdForm.id}`,
        );
        const createdSeccions: string[] = [];
        for (const seccionDto of seccions) {
          const seccion = await this.seccionService.create(
            {
              ...seccionDto,
              formId: createdForm.id,
            },
            tx,
          );
          if (seccion && seccion.id) {
            createdSeccions.push(seccion.id);
          }
        }

        if (createdSeccions.length > 0) {
          await tx.form.update({
            where: { id: createdForm.id },
            data: {
              seccions: {
                connect: createdSeccions.map((id) => ({ id })),
              },
            },
          });
        }
      }

      const finalForm = await tx.form.findUnique({
        where: { id: createdForm.id },
        include: {
          seccions: {
            include: {
              questionsRel: { include: { question: true } },
              rule: true,
            },
          },
          rule: true,
          questionsRel: { include: { question: true } },
        },
      });

      this.logger.log(`Form created successfully with ID: ${createdForm.id}`);
      return finalForm;
    });
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
                question: true,
              },
            },
            rule: true,
          },
        },
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
    return this.prisma.form.findUnique({
      where: { id },
      include: {
        seccions: {
          include: {
            questionsRel: {
              include: {
                question: { include: { options: true } },
              },
            },
            rule: true,
          },
        },
        rule: true,
        questionsRel: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateFormDto) {
    return this.prisma.$transaction(async (tx) => {
      let ruleId: string | undefined = undefined;
      if (dto.rule) {
        if (dto.rule.id) {
          const rule = await this.ruleService.update(
            dto.rule.id,
            dto.rule, // Passa o DTO completo da regra
            tx,
          );
          ruleId = rule.id;
        } else {
          const { id: _ruleId, ...ruleData } = dto.rule;
          const rule = await this.ruleService.create(
            ruleData as CreateRuleDto,
            tx,
          );
          ruleId = rule.id;
        }
      }

      const processedSeccionIds: string[] = [];

      if (dto.seccions && Array.isArray(dto.seccions)) {
        this.logger.debug(
          `Processing ${dto.seccions.length} seccions for update.`,
        );
        for (const seccionPayload of dto.seccions) {
          const seccionIdToUpdate = seccionPayload.id;

          const {
            id: _sId,
            formId: _fId,
            ...seccionDataForService
          } = seccionPayload;

          if (seccionPayload.rule) {
            if (!this.areAllRuleFieldsNull(seccionPayload.rule)) {
              if (seccionPayload.rule.id) {
                await this.ruleService.update(
                  seccionPayload.rule.id,
                  seccionPayload.rule,
                  tx,
                );
                seccionDataForService.ruleId = seccionPayload.rule.id;
              } else {
                const { id: _ruleId, ...ruleDataToCreate } =
                  seccionPayload.rule;
                const createdRule = await this.ruleService.create(
                  ruleDataToCreate as CreateRuleDto,
                  tx,
                );
                seccionDataForService.ruleId = createdRule.id;
              }
              delete seccionDataForService.rule; // Evitar passar o objeto rule se ruleId foi definido
            } else {
              delete seccionDataForService.rule;
            }
          } else if (seccionPayload.rule === null) {
            seccionDataForService.ruleId = ''; // Sinaliza para SeccionService desconectar
            delete seccionDataForService.rule;
          }

          let savedSeccion;
          if (seccionIdToUpdate) {
            this.logger.debug(`Updating seccion ID: ${seccionIdToUpdate}`);
            savedSeccion = await this.seccionService.update(
              seccionIdToUpdate,
              { ...seccionDataForService, formId: id },
              tx,
            );
          } else {
            this.logger.debug(
              `Creating new seccion with title: ${seccionDataForService.title}`,
            );
            savedSeccion = await this.seccionService.create(
              {
                // Garanta que CreateSeccionDto seja usado aqui
                ...(seccionDataForService as unknown as CreateSeccionDto),
                formId: id,
              },
              tx,
            );
          }
          processedSeccionIds.push(savedSeccion.id);
        }
      }

      const {
        rule: _rule,
        seccions: _seccions,
        seccionsIds: _dtoSeccionsIds, // Para evitar conflito com a variável questionsIds
        questionsIds,
        ...restOfDto
      } = dto;

      const formUpdateData: Prisma.FormUpdateInput = {
        ...restOfDto,
        ...(ruleId && { rule: { connect: { id: ruleId } } }),
      };

      if (dto.seccions !== undefined) {
        formUpdateData.seccions = {
          set: processedSeccionIds.map((sid) => ({ id: sid })),
        };
        this.logger.debug(
          `Setting form seccions to: [${processedSeccionIds.join(', ')}] based on processed seccions payload.`,
        );
      } else if (dto.seccionsIds !== undefined) {
        formUpdateData.seccions = {
          set: dto.seccionsIds.map((sid) => ({ id: sid })),
        };
        this.logger.debug(
          `Setting form seccions to: [${dto.seccionsIds.join(', ')}] based on seccionsIds DTO field.`,
        );
      } else {
        this.logger.debug(
          'Neither seccions payload nor seccionsIds provided. Form seccion associations will not be changed by "set" operation.',
        );
      }

      const updatedForm = await tx.form.update({
        where: { id },
        data: formUpdateData,
        include: {
          seccions: true,
          rule: true,
          questionsRel: { include: { question: true } },
        },
      });

      if (questionsIds && Array.isArray(questionsIds)) {
        await tx.form_has_Question.deleteMany({ where: { formId: id } });
        if (questionsIds.length > 0) {
          const questionRelations = questionsIds.map((questionId, index) => ({
            formId: id,
            questionId,
            index,
          }));
          await tx.form_has_Question.createMany({ data: questionRelations });
        }
      }

      return tx.form.findUnique({
        where: { id: updatedForm.id },
        include: {
          seccions: {
            include: {
              questionsRel: { include: { question: true } },
              rule: true,
            },
          },
          rule: true,
          questionsRel: { include: { question: true } },
        },
      });
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.form_has_Question.deleteMany({ where: { formId: id } });

      return tx.form.delete({ where: { id } });
    });
  }
}
