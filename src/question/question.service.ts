/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { RuleService } from 'src/rule/rule.service';

@Injectable()
export class QuestionService {
  constructor(
    private prisma: PrismaService,
    private ruleService: RuleService,
  ) {}

  async create(data: CreateQuestionDto) {
    if (data.rule) {
      const rule = await this.ruleService.create(data.rule);
      if (data.options && data.options.length > 0) {
        return await this.prisma.question.create({
          data: {
            title: data.title,
            description: data.description,
            type: data.type,
            ruleId: rule.id,
            options: {
              create: data.options.map((option) => ({
                description: option.description,
                score: option.score,
              })),
            },
          },
          include: {
            options: true,
          },
        });
      } else {
        return await this.prisma.question.create({
          data: {
            title: data.title,
            description: data.description,
            type: data.type,
            ruleId: rule.id,
          },
        });
      }
    }

    return await this.prisma.question.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
      },
    });
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
