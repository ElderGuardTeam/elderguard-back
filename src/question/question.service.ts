/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { RuleService } from 'src/rule/rule.service';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

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

  async create(data: CreateQuestionDto) {
    this.logger.debug(
      `Attempting to create question with data: ${JSON.stringify(data)}`,
    );
    let ruleIdToLink: string | undefined = undefined;

    if (data.rule) {
      if (!this.areAllRuleFieldsNull(data.rule)) {
        const ruleToCreate: CreateRuleDto = data.rule;
        this.logger.debug(
          `Rule data provided and is not all nulls. Attempting to create rule: ${JSON.stringify(ruleToCreate)}`,
        );
        try {
          const createdRule = await this.ruleService.create(ruleToCreate);

          if (createdRule && createdRule.id) {
            ruleIdToLink = createdRule.id;
            this.logger.debug(
              `Rule created successfully with ID: ${ruleIdToLink}`,
            );
          } else if (createdRule) {
            this.logger.warn(
              `Rule service returned a rule object without an ID for rule data: ${JSON.stringify(ruleToCreate)}. Question: '${data.title}'. Proceeding without linking rule.`,
            );
          } else {
            this.logger.log(
              `Rule service returned null/undefined for rule data: ${JSON.stringify(ruleToCreate)}. Question: '${data.title}'. Proceeding without linking rule.`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error creating rule for question '${data.title}' with rule data ${JSON.stringify(ruleToCreate)}: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );

          throw error;
        }
      } else {
        this.logger.log(
          `Rule data provided for question '${data.title}' but all fields were null or object was empty. Skipping rule creation. Rule data: ${JSON.stringify(data.rule)}`,
        );
      }
    }

    const questionCreateInput: Prisma.QuestionCreateInput = {
      title: data.title,
      description: data.description,
      type: data.type,
    };

    if (ruleIdToLink) {
      questionCreateInput.rule = {
        connect: {
          id: ruleIdToLink,
        },
      };
      this.logger.debug(`Linking question to ruleId: ${ruleIdToLink}`);
    }

    if (data.options && data.options.length > 0) {
      questionCreateInput.options = {
        create: data.options.map((option) => ({
          description: option.description,
          score: option.score,
        })),
      };
      this.logger.debug(`Adding ${data.options.length} options to question.`);
    }

    this.logger.log(
      `Creating question with final input: ${JSON.stringify(questionCreateInput)}`,
    );

    const createdQuestion = await this.prisma.question.create({
      data: questionCreateInput,
      include: { options: true, rule: true },
    });
    this.logger.log(
      `Question created successfully with ID: ${createdQuestion.id}`,
    );
    return createdQuestion;
  }

  async findAll(search?: string) {
    return this.prisma.question.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : undefined,
      orderBy: {
        created: 'desc',
      },
      include: { options: true, rule: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: { options: true, rule: true },
    });
  }

  async update(id: string, data: UpdateQuestionDto) {
    const { options, rule: ruleInput, ...questionDataToUpdate } = data;

    return this.prisma.$transaction(async (tx) => {
      const updatePayload: Prisma.QuestionUpdateInput = {
        ...questionDataToUpdate,
      };
      let shouldManageRuleRelation = false;

      if (ruleInput === null) {
        updatePayload.rule = { disconnect: true };
        shouldManageRuleRelation = true;
        this.logger.debug(
          `Attempting to disconnect rule from question ID: ${id}`,
        );
      } else if (ruleInput && typeof ruleInput === 'object') {
        if (!this.areAllRuleFieldsNull(ruleInput)) {
          shouldManageRuleRelation = true;

          const ruleDtoWithOptionalId = ruleInput as Partial<CreateRuleDto> & {
            id?: string;
          };

          if (ruleDtoWithOptionalId.id) {
            this.logger.debug(
              `Attempting to update rule ID: ${ruleDtoWithOptionalId.id} for question ID: ${id}`,
            );
            const { id: ruleId, ...ruleDataToUpdate } = ruleDtoWithOptionalId;

            const updatedRule = await this.ruleService.update(
              ruleId,
              ruleDataToUpdate as any /*, tx */,
            );
            updatePayload.rule = { connect: { id: updatedRule.id } };
            this.logger.debug(
              `Rule ID: ${updatedRule.id} updated and connected to question ID: ${id}`,
            );
          } else {
            this.logger.debug(
              `Attempting to create and connect new rule for question ID: ${id}`,
            );

            const { id: _id, ...ruleDataToCreate } = ruleDtoWithOptionalId;
            const createdRule = await this.ruleService.create(
              ruleDataToCreate as CreateRuleDto /*, tx */,
            );
            updatePayload.rule = { connect: { id: createdRule.id } };
            this.logger.debug(
              `New rule ID: ${createdRule.id} created and connected to question ID: ${id}`,
            );
          }
        } else {
          this.logger.debug(
            `Rule data provided for question ID: ${id} but all fields were null. No rule operation performed.`,
          );
        }
      }

      await tx.question.update({
        where: { id },
        data: updatePayload,
      });

      if (options) {
        await tx.option.deleteMany({
          where: { questionId: id },
        });
        this.logger.debug(
          `Deleted existing options for question ID: ${id}. Creating ${options.length} new options.`,
        );

        await Promise.all(
          options.map((option) =>
            tx.option.create({
              data: {
                description: option.description,
                score: option.score,
                questionId: id,
              },
            }),
          ),
        );
      }

      const finalQuestion = await tx.question.findUnique({
        where: { id },
        include: { options: true, rule: true },
      });
      this.logger.log(`Question ID: ${id} updated successfully.`);
      return finalQuestion;
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      this.logger.debug(
        `Attempting to remove question ID: ${id} and its options.`,
      );
      await tx.option.deleteMany({
        where: { questionId: id },
      });
      await tx.question.delete({
        where: { id },
      });
      this.logger.log(
        `Question ID: ${id} and its options removed successfully.`,
      );
      return { message: 'Questão removida com sucesso!' };
    });
  }
}
