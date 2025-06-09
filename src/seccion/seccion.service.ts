/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSeccionDto } from './dto/create-seccion.dto';
import { UpdateSeccionDto } from './dto/update-seccion.dto';
import { PrismaService } from 'src/database/prisma.service';
import { RuleService } from 'src/rule/rule.service';
import { Prisma } from '@prisma/client';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';
import { UpdateRuleDto } from 'src/rule/dto/update-rule.dto';

@Injectable()
export class SeccionService {
  private readonly logger = new Logger(SeccionService.name);

  constructor(
    private prisma: PrismaService,
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

  async create(dto: CreateSeccionDto) {
    return this.prisma.$transaction(async (tx) => {
      this.logger.debug(
        `Attempting to create seccion with data: ${JSON.stringify(dto)}`,
      );
      let ruleIdToLink: string | undefined = undefined;

      if (dto.rule) {
        const ruleInputId = dto.rule.id;
        if (ruleInputId) {
          this.logger.debug(
            `Rule object provided with existing ID: ${ruleInputId}. Using this ID for linking.`,
          );

          ruleIdToLink = ruleInputId;
        } else if (!this.areAllRuleFieldsNull(dto.rule)) {
          this.logger.debug(
            `Rule data provided (without ID) and is not all nulls. Attempting to create new rule: ${JSON.stringify(dto.rule)}`,
          );
          try {
            const { id, ...ruleDataToCreate } = dto.rule;
            const createdRule = await this.ruleService.create(
              ruleDataToCreate as CreateRuleDto /*, tx */,
            ); // Passar tx se ruleService suportar
            if (createdRule && createdRule.id) {
              ruleIdToLink = createdRule.id;
              this.logger.debug(
                `New rule created successfully with ID: ${ruleIdToLink}`,
              );
            } else {
              this.logger.warn(
                `Rule service did not return an ID for rule data: ${JSON.stringify(ruleDataToCreate)}. Seccion title: '${dto.title}'.`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Error creating new rule for seccion '${dto.title}' with rule data ${JSON.stringify(dto.rule)}: ${error.message}`,
              error.stack,
            );
            throw error;
          }
        } else {
          this.logger.log(
            `Rule object provided for seccion '${dto.title}' but it was empty or all fields were null, and no ID was present. Skipping rule processing. Rule data: ${JSON.stringify(dto.rule)}`,
          );
        }
      } else if (dto.ruleId) {
        this.logger.debug(
          `Using explicit ruleId from DTO: ${dto.ruleId} as no rule object was provided.`,
        );
        ruleIdToLink = dto.ruleId;
      }

      if (!dto.formId) {
        this.logger.error(
          'formId is required to create a seccion but was not provided.',
        );
        throw new BadRequestException('formId is required to create a seccion');
      }

      const {
        rule,
        ruleId: _dtoRuleId,
        questionsIds,
        formId,
        ...restOfDto
      } = dto;

      const seccionCreateData: Prisma.SeccionCreateInput = {
        ...restOfDto,
        form: { connect: { id: formId } },
        ...(ruleIdToLink && { rule: { connect: { id: ruleIdToLink } } }),
      };

      const createdSeccion = await tx.seccion.create({
        data: seccionCreateData,
        include: { rule: true },
      });

      this.logger.log(`Seccion created with ID: ${createdSeccion.id}`);

      if (
        questionsIds &&
        Array.isArray(questionsIds) &&
        questionsIds.length > 0
      ) {
        this.logger.debug(
          `Associating ${questionsIds.length} questions to seccion ID: ${createdSeccion.id}`,
        );
        const questionRelations = questionsIds.map((questionId, index) => ({
          seccionId: createdSeccion.id,
          questionId: questionId,
          index: index, // Assuming you might want an order
        }));
        await tx.seccion_has_Question.createMany({
          data: questionRelations,
        });
      }

      return tx.seccion.findUnique({
        where: { id: createdSeccion.id },
        include: {
          rule: true,
          questionsRel: {
            include: { question: true },
          },
        },
      });
    });
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
    return this.prisma.$transaction(async (tx) => {
      const existingSeccion = await tx.seccion.findUnique({
        where: { id },
      });
      if (!existingSeccion) {
        throw new NotFoundException(`Seção com ID ${id} não encontrada.`);
      }

      const {
        rule: ruleInput,
        ruleId: _dtoRuleId,
        questionsIds,
        formId: _formId,
        ...seccionDataToUpdate
      } = dto;
      const updatePayload: Prisma.SeccionUpdateInput = {
        ...seccionDataToUpdate,
      };

      if (ruleInput === null) {
        // Explicitly disconnect rule
        updatePayload.rule = { disconnect: true };
        this.logger.debug(
          `Attempting to disconnect rule from seccion ID: ${id}`,
        );
      } else if (ruleInput && typeof ruleInput === 'object') {
        if (!this.areAllRuleFieldsNull(ruleInput)) {
          const ruleInputId = ruleInput.id;
          if (ruleInputId) {
            this.logger.debug(
              `Attempting to update rule ID: ${ruleInputId} for seccion ID: ${id}`,
            );

            const { id: _, ...ruleDataToUpdate } = ruleInput;
            const updatedRule = await this.ruleService.update(
              ruleInputId,
              ruleDataToUpdate as UpdateRuleDto /*, tx */, // Passar tx se ruleService suportar
            );
            updatePayload.rule = { connect: { id: updatedRule.id } };
          } else {
            this.logger.debug(
              `Attempting to create and connect new rule for seccion ID: ${id}`,
            );

            const { id: _, ...ruleDataToCreate } = ruleInput;
            const createdRule = await this.ruleService.create(
              ruleDataToCreate as CreateRuleDto /*, tx */, // Passar tx se ruleService suportar
            );
            updatePayload.rule = { connect: { id: createdRule.id } };
          }
        } else {
          this.logger.debug(
            `Rule data provided for seccion ID: ${id} but all fields were null. No rule operation performed.`,
          );
        }
      } else if (dto.ruleId) {
        // Handle explicit ruleId if rule object is not provided
        updatePayload.rule = { connect: { id: dto.ruleId } };
        this.logger.debug(
          `Attempting to connect rule ID: ${dto.ruleId} to seccion ID: ${id}`,
        );
      } else if (dto.ruleId === null) {
        // Explicitly disconnect rule by ruleId: null
        updatePayload.rule = { disconnect: true };
        this.logger.debug(
          `Attempting to disconnect rule from seccion ID: ${id} using ruleId: null`,
        );
      }

      await tx.seccion.update({
        where: { id },
        data: updatePayload,
      });

      if (questionsIds && Array.isArray(questionsIds)) {
        this.logger.debug(
          `Updating question associations for seccion ID: ${id}`,
        );
        await tx.seccion_has_Question.deleteMany({
          where: { seccionId: id },
        });
        if (questionsIds.length > 0) {
          const questionRelations = questionsIds.map((questionId, index) => ({
            seccionId: id,
            questionId: questionId,
            index: index,
          }));
          await tx.seccion_has_Question.createMany({ data: questionRelations });
        }
      }

      return tx.seccion.findUnique({
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
    });
  }

  async remove(id: string) {
    // Remove relações com perguntas primeiro
    await this.prisma.seccion_has_Question.deleteMany({
      where: { seccionId: id },
    });
    // Considerar se a regra associada deve ser removida se não estiver mais em uso.
    // Por enquanto, apenas remove a seção.
    const deletedSeccion = await this.prisma.seccion.delete({ where: { id } });
    this.logger.log(
      `Seccion ID: ${id} and its question relations removed successfully.`,
    );
    return deletedSeccion;
  }
}
