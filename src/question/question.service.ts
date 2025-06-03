/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { RuleService } from 'src/rule/rule.service';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(
    private prisma: PrismaService,
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

  async create(data: CreateQuestionDto) {
    this.logger.debug(
      `Attempting to create question with data: ${JSON.stringify(data)}`,
    );
    let ruleIdToLink: string | undefined = undefined;

    // Verifica se data.rule existe e se não tem todos os seus valores como null
    if (data.rule) {
      if (!this.areAllRuleFieldsNull(data.rule)) {
        this.logger.debug(
          `Rule data provided and is not all nulls. Attempting to create rule: ${JSON.stringify(data.rule)}`,
        );
        try {
          const createdRule = await this.ruleService.create(data.rule);
          // Verifica se a regra foi criada com sucesso e possui um ID.
          if (createdRule && createdRule.id) {
            ruleIdToLink = createdRule.id;
            this.logger.debug(
              `Rule created successfully with ID: ${ruleIdToLink}`,
            );
          } else if (createdRule) {
            // Caso a ruleService retorne um objeto de regra, mas sem ID (cenário inesperado).
            this.logger.warn(
              `Rule service returned a rule object without an ID for rule data: ${JSON.stringify(data.rule)}. Question: '${data.title}'. Proceeding without linking rule.`,
            );
          } else {
            // ruleService.create retornou null/undefined, o que significa que a regra não pôde ser criada
            this.logger.log(
              `Rule service returned null/undefined for rule data: ${JSON.stringify(data.rule)}. Question: '${data.title}'. Proceeding without linking rule.`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error creating rule for question '${data.title}' with rule data ${JSON.stringify(data.rule)}: ${error.message}`,
            error.stack,
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
    return await this.prisma.question.findMany({
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
      include: { options: true, rule: true }, // <-- Adicione esta linha
    });
  }

  async findOne(id: string) {
    return await this.prisma.question.findUnique({
      where: { id },
      include: { options: true, rule: true },
    });
  }

  async update(id: string, data: UpdateQuestionDto) {
    // Separa os campos de atualização da questão dos dados de opções, se existirem
    const { options, rule, ...questionData } = data;

    return await this.prisma.$transaction(async (tx) => {
      // Atualiza os campos básicos da questão

      const updatedQuestion = await tx.question.update({
        where: { id },
        data: questionData,
        include: { options: true },
      });

      // Se houver opções no DTO, atualizamos a relação
      if (options) {
        // Exclui todas as opções atuais
        await tx.option.deleteMany({
          where: { questionId: id },
        });
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
        // Retorna a questão com as opções atualizadas
        return await tx.question.findUnique({
          where: { id },
          include: { options: true },
        });
      }

      return updatedQuestion;
    });
  }

  async remove(id: string) {
    await this.prisma.option.deleteMany({
      where: { questionId: id },
    });
    await this.prisma.question.delete({
      where: { id },
    });

    return { message: 'Questão removida com sucesso!' };
  }
}
