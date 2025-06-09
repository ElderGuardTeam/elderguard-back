import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { UpdateEvaluationAnswareDto } from './dto/update-evaluation-answare.dto';
import { PrismaService } from 'src/database/prisma.service';
import { QuestionType, EvaluationAnswareStatus, Prisma } from '@prisma/client';

// Define a more precise type for the objects processed and returned by processFormAnswaresDto
interface ProcessedFormAnswareData {
  formId: string; // Ensures formId is always a string
  elderlyId: string;
  techProfessionalId: string;
  totalScore: number | null;
  questionsAnswares: Prisma.QuestionAnswerCreateNestedManyWithoutFormAnswareInput; // For the 'create' part of FormAnsware
  updateData: Prisma.FormAnswareUpdateWithoutEvaluationAnswareInput; // For the 'update' part of FormAnsware
}
@Injectable()
export class EvaluationAnswareService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEvaluationAnswareDto) {
    const { evaluationId, formAnswares = [] } = dto; // Default para array vazio se não fornecido

    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });
    if (!evaluation) {
      throw new NotFoundException(
        `Evaluation with ID ${evaluationId} not found.`,
      );
    }

    let calculatedEvaluationTotalScore = 0;

    // A lógica de processamento de formAnswares será encapsulada para reutilização
    const processedFormAnswares = await this.processFormAnswaresDto(
      formAnswares,
      (score) => (calculatedEvaluationTotalScore += score),
    );

    return this.prisma.evaluationAnsware.create({
      data: {
        evaluationId,
        scoreTotal: calculatedEvaluationTotalScore,
        status: EvaluationAnswareStatus.IN_PROGRESS, // Explicitamente definido, embora seja o default do schema
        formAnswares: {
          create: processedFormAnswares.map((pfa) => ({
            form: { connect: { id: pfa.formId } },
            idoso: { connect: { id: pfa.elderlyId } },
            professional: { connect: { id: pfa.techProfessionalId } },
            totalScore: pfa.totalScore,
            questionsAnswares: pfa.questionsAnswares, // Já está no formato de create
          })),
        },
      },
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

  // Função auxiliar para processar DTOs de FormAnsware (para create e update)
  private async processFormAnswaresDto(
    formAnswareDtos: CreateEvaluationAnswareDto['formAnswares'] | undefined,
    updateEvaluationScoreCallback: (formScore: number) => void,
  ): Promise<Array<ProcessedFormAnswareData>> {
    if (!formAnswareDtos || formAnswareDtos.length === 0) {
      return [];
    }

    // Coletar todos os IDs para buscas em lote
    const formIds = formAnswareDtos.map((dto) => dto.formId);
    const elderlyIds = formAnswareDtos.map((dto) => dto.elderlyId);
    const techProfessionalIds = formAnswareDtos.map(
      (dto) => dto.techProfessionalId,
    );
    const questionIds = formAnswareDtos.flatMap(
      (dto) => dto.questionsAnswares?.map((qa) => qa.questionId) || [],
    );

    // Buscar entidades em lote
    const [forms, elderlies, professionals, questionsWithOptions] =
      await Promise.all([
        this.prisma.form.findMany({ where: { id: { in: formIds } } }),
        this.prisma.elderly.findMany({ where: { id: { in: elderlyIds } } }),
        this.prisma.professional.findMany({
          where: { id: { in: techProfessionalIds } },
        }),
        this.prisma.question.findMany({
          where: { id: { in: questionIds } },
          include: { options: true },
        }),
      ]);

    // Mapear para fácil acesso por ID
    const formsMap = new Map(forms.map((f) => [f.id, f]));
    const elderliesMap = new Map(elderlies.map((e) => [e.id, e]));
    const professionalsMap = new Map(professionals.map((p) => [p.id, p]));
    const questionsMap = new Map(questionsWithOptions.map((q) => [q.id, q]));

    return Promise.all(
      formAnswareDtos.map(async (formAnswareDto) => {
        const form = formsMap.get(formAnswareDto.formId);
        if (!form)
          throw new NotFoundException(
            `Form with ID ${formAnswareDto.formId} not found.`,
          );

        const elderly = elderliesMap.get(formAnswareDto.elderlyId);
        if (!elderly)
          throw new NotFoundException(
            `Elderly with ID ${formAnswareDto.elderlyId} not found.`,
          );

        const professional = professionalsMap.get(
          formAnswareDto.techProfessionalId,
        );
        if (!professional)
          throw new NotFoundException(
            `Professional with ID ${formAnswareDto.techProfessionalId} not found.`,
          );

        let calculatedFormTotalScore = 0;
        const questionsAnswaresData = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/require-await
          (formAnswareDto.questionsAnswares || []).map(async (qaDto) => {
            const question = questionsMap.get(qaDto.questionId);
            if (!question)
              throw new NotFoundException(
                `Question with ID ${qaDto.questionId} not found.`,
              );

            let questionScore = qaDto.score ?? 0;

            // Validação e cálculo de score baseado no tipo da questão
            if (
              qaDto.selectedOptionId &&
              (question.type === QuestionType.SELECT ||
                question.type === QuestionType.BOOLEAN)
            ) {
              const selectedOption = question.options.find(
                (opt) => opt.id === qaDto.selectedOptionId,
              );
              if (!selectedOption) {
                throw new BadRequestException(
                  `Selected option ID ${qaDto.selectedOptionId} not found for question ${qaDto.questionId}.`,
                );
              }
              questionScore = selectedOption.score;
            } else if (
              qaDto.optionAnswers?.length &&
              question.type === QuestionType.MULTISELECT
            ) {
              questionScore = 0;
              for (const oa of qaDto.optionAnswers) {
                const optionExists = question.options.some(
                  (optDb) => optDb.id === oa.optionId,
                );
                if (!optionExists) {
                  throw new BadRequestException(
                    `Option with ID ${oa.optionId} not found for question ${qaDto.questionId}.`,
                  );
                }
                // Se o score da opção múltipla vem do DTO (oa.score)
                // ou se deve ser buscado da `question.options` como no SELECT.
                // Aqui, assume-se que oa.score é o score da sub-resposta da opção.
                questionScore += oa.score;
              }
            }
            calculatedFormTotalScore += questionScore;

            return {
              // Formato para 'create' aninhado
              questionId: qaDto.questionId,
              answerText: qaDto.answerText,
              answerNumber: qaDto.answerNumber,
              answerImage: qaDto.answerImage,
              answerBoolean: qaDto.answerBoolean,
              selectedOptionId: qaDto.selectedOptionId,
              score: questionScore,
              optionAnswers: qaDto.optionAnswers
                ? { create: qaDto.optionAnswers.map((oa) => ({ ...oa })) } // Espalha as propriedades de oa
                : undefined,
            };
          }),
        );

        updateEvaluationScoreCallback(calculatedFormTotalScore);

        return {
          // Campos para identificar/criar o FormAnsware
          formId: formAnswareDto.formId,
          elderlyId: formAnswareDto.elderlyId,
          techProfessionalId: formAnswareDto.techProfessionalId,
          totalScore: calculatedFormTotalScore,
          questionsAnswares: { create: questionsAnswaresData }, // Para a parte 'create' do upsert
          // Dados para a parte 'update' do upsert
          updateData: {
            idoso: { connect: { id: formAnswareDto.elderlyId } },
            professional: {
              connect: { id: formAnswareDto.techProfessionalId },
            },
            totalScore: calculatedFormTotalScore,
            questionsAnswares: {
              // Para atualizar, deletamos as antigas e criamos as novas
              deleteMany: {},
              create: questionsAnswaresData,
            },
          },
        };
      }),
    );
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
    const {
      status,
      formAnswares: formAnswareDtos,
      evaluationId: dtoEvaluationId,
      scoreTotal: dtoScoreTotal,
    } = dto;

    const existingEvaluationAnsware =
      await this.prisma.evaluationAnsware.findUnique({
        where: { id },
      });

    if (!existingEvaluationAnsware) {
      throw new NotFoundException(`EvaluationAnsware with ID ${id} not found.`);
    }

    // Não permitir mudar a evaluationId de uma EvaluationAnsware existente
    if (
      dtoEvaluationId &&
      dtoEvaluationId !== existingEvaluationAnsware.evaluationId
    ) {
      throw new BadRequestException(
        "Cannot change the 'evaluationId' of an existing EvaluationAnsware.",
      );
    }

    let calculatedEvaluationTotalScore = 0;
    const updatePayload: Prisma.EvaluationAnswareUpdateInput = {};

    if (status) {
      updatePayload.status = status;
      if (status === EvaluationAnswareStatus.COMPLETED) {
        updatePayload.completedAt = new Date();
      } else {
        // Se o status está mudando para algo que não seja COMPLETED,
        // e já estava COMPLETED, devemos limpar completedAt.
        if (existingEvaluationAnsware.status === 'COMPLETED') {
          updatePayload.completedAt = null;
        }
      }
    }

    if (formAnswareDtos) {
      const processedFormAnswaresForUpsert = await this.processFormAnswaresDto(
        formAnswareDtos,
        (formScore) => (calculatedEvaluationTotalScore += formScore),
      );

      updatePayload.scoreTotal = calculatedEvaluationTotalScore;
      updatePayload.formAnswares = updatePayload.formAnswares ?? {}; // Initialize if undefined
      updatePayload.formAnswares = {
        upsert: processedFormAnswaresForUpsert.map((pfa) => ({
          where: {
            evaluationAnswareId_formId: {
              evaluationAnswareId: id,
              formId: pfa.formId,
            },
          },
          create: {
            // Dados para criar se FormAnsware não existir
            form: { connect: { id: pfa.formId } },
            idoso: { connect: { id: pfa.elderlyId } },
            professional: { connect: { id: pfa.techProfessionalId } },
            totalScore: pfa.totalScore,
            questionsAnswares: pfa.questionsAnswares, // Já está no formato { create: [...] }
          },
          update: pfa.updateData, // Dados para atualizar FormAnsware existente
        })),
      };
      // Lógica para remover FormAnswares que não estão mais no DTO (se necessário)
      const formIdsInDto = formAnswareDtos.map((fa) => fa.formId);
      updatePayload.formAnswares.deleteMany = {
        evaluationAnswareId: id,
        formId: { notIn: formIdsInDto },
      };
    } else if (dtoScoreTotal !== undefined) {
      // Se formAnswares não for enviado, mas scoreTotal for, atualize-o.
      updatePayload.scoreTotal = dtoScoreTotal;
    }
    return this.prisma.evaluationAnsware.update({
      where: { id },
      data: updatePayload,
      include: {
        // Retornar a entidade completa atualizada
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
