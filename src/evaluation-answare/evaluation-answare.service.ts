import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { UpdateEvaluationAnswareDto } from './dto/update-evaluation-answare.dto';
import { PrismaService } from 'src/database/prisma.service';
import { QuestionType } from '@prisma/client';

@Injectable()
export class EvaluationAnswareService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEvaluationAnswareDto) {
    const { evaluationId, formAnswares } = dto;

    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });
    if (!evaluation) {
      throw new NotFoundException(
        `Evaluation with ID ${evaluationId} not found.`,
      );
    }

    let calculatedEvaluationTotalScore = 0;

    const formAnswaresData = await Promise.all(
      formAnswares.map(async (formAnswareDto) => {
        const form = await this.prisma.form.findUnique({
          where: { id: formAnswareDto.formId },
        });
        if (!form)
          throw new NotFoundException(
            `Form with ID ${formAnswareDto.formId} not found.`,
          );
        const elderly = await this.prisma.elderly.findUnique({
          where: { id: formAnswareDto.elderlyId },
        });
        if (!elderly)
          throw new NotFoundException(
            `Elderly with ID ${formAnswareDto.elderlyId} not found.`,
          );
        const professional = await this.prisma.professional.findUnique({
          where: { id: formAnswareDto.techProfessionalId },
        });
        if (!professional)
          throw new NotFoundException(
            `Professional with ID ${formAnswareDto.techProfessionalId} not found.`,
          );

        let calculatedFormTotalScore = 0;

        const questionsAnswaresData = await Promise.all(
          formAnswareDto.questionsAnswares.map(async (qaDto) => {
            const question = await this.prisma.question.findUnique({
              where: { id: qaDto.questionId },
              include: { options: true },
            });

            if (!question) {
              throw new NotFoundException(
                `Question with ID ${qaDto.questionId} not found.`,
              );
            }

            let questionScore = qaDto.score ?? 0; // Usa score do DTO se fornecido, senão 0

            if (
              qaDto.selectedOptionId &&
              (question.type === QuestionType.SELECT ||
                question.type === QuestionType.BOOLEAN)
            ) {
              const selectedOption = question.options.find(
                (opt) => opt.id === qaDto.selectedOptionId,
              );
              if (selectedOption) {
                questionScore = selectedOption.score;
              } else {
                console.warn(
                  `Selected option ${qaDto.selectedOptionId} not found for question ${qaDto.questionId}`,
                );
              }
            } else if (
              qaDto.optionAnswers?.length &&
              question.type === QuestionType.MULTISELECT
            ) {
              questionScore = 0; // Resetar para somar os scores das opções selecionadas
              for (const oa of qaDto.optionAnswers) {
                const optionExists = question.options.some(
                  (opt) => opt.id === oa.optionId,
                );
                if (!optionExists) {
                  throw new NotFoundException(
                    `Option with ID ${oa.optionId} not found or does not belong to question ${qaDto.questionId}.`,
                  );
                }
                // O score da OptionAnswer pode vir do DTO (oa.score) ou ser buscado da Option original.
                // Aqui, estamos usando o oa.score enviado no DTO.
                questionScore += oa.score;
              }
            }

            calculatedFormTotalScore += questionScore;

            return {
              questionId: qaDto.questionId,
              answerText: qaDto.answerText,
              answerNumber: qaDto.answerNumber,
              answerImage: qaDto.answerImage,
              answerBoolean: qaDto.answerBoolean,
              selectedOptionId: qaDto.selectedOptionId,
              score: questionScore,
              optionAnswers: qaDto.optionAnswers
                ? {
                    create: qaDto.optionAnswers.map((oa) => ({
                      optionId: oa.optionId,
                      score: oa.score,
                      answerText: oa.answerText,
                      answerNumber: oa.answerNumber,
                      answerBoolean: oa.answerBoolean,
                    })),
                  }
                : undefined,
            };
          }),
        );

        calculatedEvaluationTotalScore += calculatedFormTotalScore;

        return {
          formId: formAnswareDto.formId,
          elderlyId: formAnswareDto.elderlyId,
          techProfessionalId: formAnswareDto.techProfessionalId,
          totalScore: calculatedFormTotalScore,
          questionsAnswares: {
            create: questionsAnswaresData,
          },
        };
      }),
    );

    return this.prisma.evaluationAnsware.create({
      data: {
        evaluationId,
        scoreTotal: calculatedEvaluationTotalScore,
        formAnswares: {
          create: formAnswaresData,
        },
      },
      include: {
        formAnswares: {
          include: {
            questionsAnswares: {
              include: {
                selectedOption: true,
                optionAnswers: {
                  include: {
                    option: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.evaluationAnsware.findMany({
      include: {
        evaluation: true,
        formAnswares: {
          include: {
            form: true,
            idoso: true,
            professional: true,
            questionsAnswares: {
              include: {
                question: true,
                selectedOption: true,
                optionAnswers: { include: { option: true } },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const evaluationAnsware = await this.prisma.evaluationAnsware.findUnique({
      where: { id },
      include: {
        evaluation: true,
        formAnswares: {
          include: {
            form: true,
            idoso: true,
            professional: true,
            questionsAnswares: {
              include: {
                question: true,
                selectedOption: true,
                optionAnswers: { include: { option: true } },
              },
            },
          },
        },
      },
    });
    if (!evaluationAnsware) {
      throw new NotFoundException(`EvaluationAnsware with ID ${id} not found.`);
    }
    return evaluationAnsware;
  }

  async update(id: string, dto: UpdateEvaluationAnswareDto) {
    // ATENÇÃO: Este método de atualização é simplificado.
    // Atualizar respostas aninhadas e recalcular scores exigiria uma lógica mais complexa.
    // Por ora, ele apenas atualiza campos diretos da EvaluationAnsware.
    // Se o dto contiver `formAnswares`, eles não serão processados para update aninhado com recálculo aqui.
    const { formAnswares, ...restOfDto } = dto;
    if (formAnswares) {
      console.warn(
        'Updating nested formAnswares via this generic update method is not fully supported with score recalculation. Consider a dedicated method or ensure scores are pre-calculated if you intend to update them.',
      );
    }
    return this.prisma.evaluationAnsware.update({
      where: { id },
      data: restOfDto,
    });
  }

  async remove(id: string) {
    // Para deleção em cascata segura, é ideal ter `onDelete: Cascade` no schema.prisma.
    // Se não, deletamos manualmente em uma transação.
    // Exemplo:
    // model FormAnsware {
    //   evaluationAnsware   EvaluationAnsware @relation(fields: [evaluationAnswareId], references: [id], onDelete: Cascade)
    // }
    // Assumindo que `onDelete: Cascade` NÃO está configurado para todas as dependências:
    return this.prisma.$transaction(async (tx) => {
      const formAnswares = await tx.formAnsware.findMany({
        where: { evaluationAnswareId: id },
        select: { id: true },
      });
      const formAnswareIds = formAnswares.map((fa) => fa.id);

      if (formAnswareIds.length > 0) {
        const questionAnswares = await tx.questionAnswer.findMany({
          where: { formAnswareId: { in: formAnswareIds } },
          select: { id: true },
        });
        const questionAnswerIds = questionAnswares.map((qa) => qa.id);

        if (questionAnswerIds.length > 0) {
          await tx.optionAnswer.deleteMany({
            where: { questionAnswerId: { in: questionAnswerIds } },
          });
        }
        await tx.questionAnswer.deleteMany({
          where: { formAnswareId: { in: formAnswareIds } },
        });
      }
      await tx.formAnsware.deleteMany({
        where: { evaluationAnswareId: id },
      });
      return tx.evaluationAnsware.delete({ where: { id } });
    });
  }
}
