/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { RuleService } from 'src/rule/rule.service';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto'; // Assumindo que este DTO existe

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
      return true; // Considera não objeto ou nulo como "todos os campos nulos"
    }
    const values = Object.values(ruleDto);
    if (values.length === 0) {
      return true; // Considera objeto vazio como "todos os campos nulos"
    }
    return values.every((value) => value === null);
  }

  async create(data: CreateQuestionDto) {
    this.logger.debug(
      `Attempting to create question with data: ${JSON.stringify(data)}`,
    );
    let ruleIdToLink: string | undefined = undefined;

    // Verifica se data.rule existe e se não tem todos os seus valores como null
    if (data.rule) {
      if (!this.areAllRuleFieldsNull(data.rule)) {
        // Garantir que data.rule seja tratado como CreateRuleDto aqui
        const ruleToCreate: CreateRuleDto = data.rule;
        this.logger.debug(
          `Rule data provided and is not all nulls. Attempting to create rule: ${JSON.stringify(ruleToCreate)}`,
        );
        try {
          const createdRule = await this.ruleService.create(ruleToCreate);
          // Verifica se a regra foi criada com sucesso e possui um ID.
          if (createdRule && createdRule.id) {
            ruleIdToLink = createdRule.id;
            this.logger.debug(
              `Rule created successfully with ID: ${ruleIdToLink}`,
            );
          } else if (createdRule) {
            // Caso a ruleService retorne um objeto de regra, mas sem ID (cenário inesperado).
            this.logger.warn(
              `Rule service returned a rule object without an ID for rule data: ${JSON.stringify(ruleToCreate)}. Question: '${data.title}'. Proceeding without linking rule.`,
            );
          } else {
            // ruleService.create retornou null/undefined, o que significa que a regra não pôde ser criada
            this.logger.log(
              `Rule service returned null/undefined for rule data: ${JSON.stringify(ruleToCreate)}. Question: '${data.title}'. Proceeding without linking rule.`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error creating rule for question '${data.title}' with rule data ${JSON.stringify(ruleToCreate)}: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
          // Re-lança o erro, pois um erro durante a criação da regra (que não seja ela retornar null)
          // provavelmente é algo que o chamador deve saber (ex: erro de banco de dados, validação mais séria).
          throw error;
        }
      } else {
        this.logger.log(
          `Rule data provided for question '${data.title}' but all fields were null or object was empty. Skipping rule creation. Rule data: ${JSON.stringify(data.rule)}`,
        );
      }
    }
    // Se data.rule não foi fornecido, ruleIdToLink já é undefined.

    // Constrói o payload para a criação da questão
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
    // Cria a questão no banco de dados
    const createdQuestion = await this.prisma.question.create({
      data: questionCreateInput,
      include: { options: true, rule: true }, // Inclui rule para consistência
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
    // Separa os campos de atualização da questão, opções e regra
    const { options, rule: ruleInput, ...questionDataToUpdate } = data;

    return this.prisma.$transaction(async (tx) => {
      const updatePayload: Prisma.QuestionUpdateInput = {
        ...questionDataToUpdate,
      };
      let shouldManageRuleRelation = false;

      if (ruleInput === null) {
        // Intenção explícita de desconectar a regra
        updatePayload.rule = { disconnect: true };
        shouldManageRuleRelation = true;
        this.logger.debug(
          `Attempting to disconnect rule from question ID: ${id}`,
        );
      } else if (ruleInput && typeof ruleInput === 'object') {
        // Intenção de criar ou atualizar regra
        if (!this.areAllRuleFieldsNull(ruleInput)) {
          shouldManageRuleRelation = true;
          // Assumindo que ruleInput pode ter um 'id' para atualização, ou não para criação.
          // E que CreateRuleDto é a estrutura base.
          const ruleDtoWithOptionalId = ruleInput as Partial<CreateRuleDto> & {
            id?: string;
          };

          if (ruleDtoWithOptionalId.id) {
            this.logger.debug(
              `Attempting to update rule ID: ${ruleDtoWithOptionalId.id} for question ID: ${id}`,
            );
            const { id: ruleId, ...ruleDataToUpdate } = ruleDtoWithOptionalId;
            // Prisma update DTOs geralmente não querem o 'id' no payload de 'data'
            const updatedRule = await this.ruleService.update(
              ruleId,
              ruleDataToUpdate as any /*, tx */,
            ); // Passar tx se ruleService suportar
            updatePayload.rule = { connect: { id: updatedRule.id } };
            this.logger.debug(
              `Rule ID: ${updatedRule.id} updated and connected to question ID: ${id}`,
            );
          } else {
            this.logger.debug(
              `Attempting to create and connect new rule for question ID: ${id}`,
            );
            // Certificar que não há 'id' no payload de criação
            const { id: _id, ...ruleDataToCreate } = ruleDtoWithOptionalId;
            const createdRule = await this.ruleService.create(
              ruleDataToCreate as CreateRuleDto /*, tx */,
            ); // Passar tx se ruleService suportar
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

      // Atualiza os campos básicos da questão e a relação da regra, se aplicável
      // O include aqui já trará a rule atualizada se a relação foi modificada.
      await tx.question.update({
        where: { id },
        data: updatePayload,
        // include: { options: true, rule: true }, // Incluído no findUnique final para garantir estado completo
      });

      // Se houver opções no DTO, atualizamos a relação
      if (options) {
        // Exclui todas as opções atuais
        await tx.option.deleteMany({
          where: { questionId: id },
        });
        this.logger.debug(
          `Deleted existing options for question ID: ${id}. Creating ${options.length} new options.`,
        );
        // Cria as novas opções
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

      // Retorna a questão com todas as relações (options e rule) atualizadas
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
