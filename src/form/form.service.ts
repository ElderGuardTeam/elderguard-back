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
import { NotFoundException } from '@nestjs/common';
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
      // 1. Fetch current state of the form, including its currently associated seccions
      const formBeforeUpdate = await tx.form.findUnique({
        where: { id },
        include: { seccions: { select: { id: true } } },
      });

      if (!formBeforeUpdate) {
        throw new NotFoundException(`Formulário com ID ${id} não encontrado.`);
      }
      const currentSeccionIdsOnForm = new Set(
        formBeforeUpdate.seccions.map((s) => s.id),
      );

      let ruleIdToConnect: string | undefined = undefined;
      let shouldDisconnectRule = false;

      if (dto.rule !== undefined) {
        // Verifica se a propriedade 'rule' está presente no DTO (pode ser null)
        if (dto.rule === null) {
          // Se 'rule' for explicitamente null, significa desconectar
          shouldDisconnectRule = true;
        } else if (!this.areAllRuleFieldsNull(dto.rule)) {
          // Se 'rule' for um objeto e nem todos os campos forem null
          if (dto.rule.id) {
            const updatedRule = await this.ruleService.update(
              dto.rule.id,
              dto.rule,
              tx,
            );
            ruleIdToConnect = updatedRule.id;
          } else {
            const { id: _ruleIdIgnored, ...ruleDataToCreate } = dto.rule;
            const createdRule = await this.ruleService.create(
              ruleDataToCreate as CreateRuleDto,
              tx,
            );
            ruleIdToConnect = createdRule.id;
          }
        }
      }

      const finalSeccionIdsForForm = new Set<string>();

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
          const dataWithFormId = { ...seccionDataForService, formId: id };

          if (seccionPayload.rule) {
            if (!this.areAllRuleFieldsNull(seccionPayload.rule)) {
              if (seccionPayload.rule.id) {
                await this.ruleService.update(
                  seccionPayload.rule.id,
                  seccionPayload.rule,
                  tx,
                );
                (dataWithFormId as any).ruleId = seccionPayload.rule.id;
              } else {
                const { id: _ruleId, ...ruleDataToCreate } =
                  seccionPayload.rule;
                const createdRule = await this.ruleService.create(
                  ruleDataToCreate as CreateRuleDto,
                  tx,
                );
                (dataWithFormId as any).ruleId = createdRule.id;
              }
              delete (dataWithFormId as any).rule;
            } else {
              delete (dataWithFormId as any).rule;
            }
          } else if (seccionPayload.rule === null) {
            (dataWithFormId as any).ruleId = null; // Sinaliza para SeccionService desconectar
            delete (dataWithFormId as any).rule;
          }

          let savedSeccion;
          if (seccionIdToUpdate) {
            this.logger.debug(`Updating seccion ID: ${seccionIdToUpdate}`);
            savedSeccion = await this.seccionService.update(
              seccionIdToUpdate,
              dataWithFormId as CreateSeccionDto,
              tx,
            );
          } else {
            this.logger.debug(
              `Creating new seccion with title: ${seccionDataForService.title}`,
            );
            savedSeccion = await this.seccionService.create(
              dataWithFormId as CreateSeccionDto,
              tx,
            );
          }
          if (savedSeccion && savedSeccion.id) {
            finalSeccionIdsForForm.add(savedSeccion.id);
          }
        }
      } else if (dto.seccionsIds && Array.isArray(dto.seccionsIds)) {
        dto.seccionsIds.forEach((sid) => finalSeccionIdsForForm.add(sid));
        this.logger.debug(
          `Using seccionsIds from DTO for final set: [${Array.from(finalSeccionIdsForForm).join(', ')}]`,
        );
      }

      // 3. Determine seccions to remove and delete them
      const seccionIdsToDelete = Array.from(currentSeccionIdsOnForm).filter(
        (existingId) => !finalSeccionIdsForForm.has(existingId),
      );

      if (seccionIdsToDelete.length > 0) {
        this.logger.debug(
          `Deleting seccions no longer associated: [${seccionIdsToDelete.join(', ')}]`,
        );
        for (const seccionId of seccionIdsToDelete) {
          await this.seccionService.remove(seccionId, tx);
        }
      }

      // 4. Prepare form data for update (own fields and direct rule link)
      const {
        rule: _rule,
        seccions: _seccions,
        seccionsIds: _dtoSeccionsIds, // Para evitar conflito com a variável questionsIds
        questionsIds,
        ...restOfDto
      } = dto;

      const formUpdateData: Prisma.FormUpdateInput = {
        ...restOfDto,
      };

      if (shouldDisconnectRule) {
        formUpdateData.rule = { disconnect: true };
      } else if (ruleIdToConnect !== undefined) {
        formUpdateData.rule = { connect: { id: ruleIdToConnect } };
      }

      // 5. Set the final state of seccions relation using the processed IDs
      // This is now safe because seccions that would be disconnected have been deleted.
      if (dto.seccions !== undefined || dto.seccionsIds !== undefined) {
        formUpdateData.seccions = {
          set: Array.from(finalSeccionIdsForForm).map((sid) => ({ id: sid })),
        };
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
