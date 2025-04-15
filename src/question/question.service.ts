import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateQuestionDto) {
    if (data.options && data.options.length > 0) {
      return await this.prisma.question.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type,
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
    });
  }

  async findOne(id: string) {
    return await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
  }

  async update(id: string, data: UpdateQuestionDto) {
    // Separa os campos de atualização da questão dos dados de opções, se existirem
    const { options, ...questionData } = data;

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
    return await this.prisma.question.delete({
      where: { id },
    });
  }
}
