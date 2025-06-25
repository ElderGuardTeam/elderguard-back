import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { CreateFormAnswareNestedDto } from './dto/create-form-answare-nested.dto';
import { PrismaService } from 'src/database/prisma.service';
import {
  RuleEngineService,
  EvaluationContext,
} from '../common/rule-engine/rule-engine.service';
import { AddFormAnswareDto } from './dto/add-form-answare.dto';
import { Prisma, Elderly, EvaluationAnswareStatus } from '@prisma/client';
import { PauseEvaluationAnswareDto } from './dto/pause-evaluation-answare.dto';

import { ImageStorageService } from 'src/image-storage/image-storage.service';
export interface FormScoreHistory {
  formId: string;
  formTitle: string;
  formType: string;
  scores: {
    evaluationAnswareId: string;
    date: Date;
    totalScore: number;
    status: string;
  }[];
}

@Injectable()
export class EvaluationAnswareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: RuleEngineService,
    private readonly imageStorageService: ImageStorageService,
  ) {}

  async create(createDto: CreateEvaluationAnswareDto) {
    if (!createDto.formAnswares || createDto.formAnswares.length !== 1) {
      throw new BadRequestException(
        'A criação de uma avaliação deve conter exatamente uma resposta de formulário.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const elderly = await tx.elderly.findUnique({
        where: { id: createDto.elderlyId },
      });
      if (!elderly) {
        throw new NotFoundException(
          `Idoso com ID ${createDto.elderlyId} não encontrado.`,
        );
      }

      const professional = await tx.professional.findUnique({
        where: { id: createDto.professionalId },
      });
      if (!professional) {
        throw new NotFoundException(
          `Profissional com ID ${createDto.professionalId} não encontrado.`,
        );
      }

      const evaluationAnsware = await tx.evaluationAnsware.create({
        data: {
          elderlyId: createDto.elderlyId,
          evaluationId: createDto.evaluationId,
          status: 'IN_PROGRESS',
        },
      });

      await this.processAndScoreForm(
        tx,
        evaluationAnsware.id,
        createDto.formAnswares[0],
        elderly,
        createDto.professionalId,
      );

      return this._findEvaluationAnswareById(tx, evaluationAnsware.id);
    });
  }

  async addFormAnsware(id: string, addDto: AddFormAnswareDto) {
    return this.prisma.$transaction(async (tx) => {
      const evaluationAnsware = await tx.evaluationAnsware.findUnique({
        where: { id },
        include: { elderly: true },
      });

      if (!evaluationAnsware) {
        throw new NotFoundException(
          `Resposta da Avaliação com ID ${id} não encontrada.`,
        );
      }

      const professional = await tx.professional.findUnique({
        where: { id: addDto.professionalId },
      });
      if (!professional) {
        throw new NotFoundException(
          `Profissional com ID ${addDto.professionalId} não encontrado.`,
        );
      }

      const { elderly } = evaluationAnsware;

      for (const formAnsware of addDto.formAnswares) {
        await this.processAndScoreForm(
          tx,
          evaluationAnsware.id,
          formAnsware,
          elderly,
          addDto.professionalId,
        );
      }

      await tx.evaluationAnsware.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      });

      return this._findEvaluationAnswareById(tx, id);
    });
  }

  async pause(id: string, pauseDto: PauseEvaluationAnswareDto) {
    return this.prisma.$transaction(async (tx) => {
      const evaluationAnsware = await tx.evaluationAnsware.findUnique({
        where: { id },
        include: { elderly: true },
      });

      if (!evaluationAnsware) {
        throw new NotFoundException(
          `Resposta da Avaliação com ID ${id} não encontrada.`,
        );
      }

      const professional = await tx.professional.findUnique({
        where: { id: pauseDto.professionalId },
      });
      if (!professional) {
        throw new NotFoundException(
          `Profissional com ID ${pauseDto.professionalId} não encontrado.`,
        );
      }

      const { elderly } = evaluationAnsware;
      const formAnswareDto = pauseDto.formAnswares[0];

      if (!formAnswareDto) {
        throw new BadRequestException(
          'A pausa de uma avaliação deve conter pelo menos uma resposta de formulário para salvar o progresso.',
        );
      }

      await this.saveFormProgress(
        tx,
        id,
        formAnswareDto,
        elderly,
        pauseDto.professionalId,
      );

      await tx.evaluationAnsware.update({
        where: { id },
        data: { status: 'PAUSED' },
      });

      return this._findEvaluationAnswareById(tx, id);
    });
  }

  async complete(id: string, completeDto: PauseEvaluationAnswareDto) {
    return this.prisma.$transaction(async (tx) => {
      const evaluationAnsware = await tx.evaluationAnsware.findUnique({
        where: { id },
        include: { elderly: true },
      });

      if (!evaluationAnsware) {
        throw new NotFoundException(
          `Resposta da Avaliação com ID ${id} não encontrada.`,
        );
      }

      const professional = await tx.professional.findUnique({
        where: { id: completeDto.professionalId },
      });
      if (!professional) {
        throw new NotFoundException(
          `Profissional com ID ${completeDto.professionalId} não encontrado.`,
        );
      }

      const { elderly } = evaluationAnsware;
      const formAnswareDto = completeDto.formAnswares[0];

      await this.processAndScoreForm(
        tx,
        id,
        formAnswareDto,
        elderly,
        completeDto.professionalId,
      );

      await tx.evaluationAnsware.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      return this._findEvaluationAnswareById(tx, id);
    });
  }

  private async processAndScoreForm(
    tx: Prisma.TransactionClient,
    evaluationAnswareId: string,
    formAnswareDto: CreateFormAnswareNestedDto,
    elderly: Elderly,
    professionalId: string,
  ) {
    const form = await tx.form.findUnique({
      where: { id: formAnswareDto.formId },
      include: {
        rule: true,

        seccions: {
          include: {
            rule: true,
            questionsRel: {
              include: {
                question: {
                  include: {
                    rule: true,
                    options: true,
                  },
                },
              },
            },
          },
        },

        questionsRel: {
          orderBy: { index: 'asc' },
          include: {
            question: {
              include: {
                rule: true,
                options: true,
              },
            },
          },
        },
      },
    });

    if (!form) {
      throw new NotFoundException(
        `Formulário com ID ${formAnswareDto.formId} não encontrado.`,
      );
    }

    const topLevelQuestions = form.questionsRel.map((rel) => rel.question);
    const sectionQuestions = form.seccions.flatMap((sec) =>
      sec.questionsRel.map((rel) => rel.question),
    );
    const allQuestionsInForm = [...topLevelQuestions, ...sectionQuestions];

    const allQuestionScores: { questionId: string; score: number }[] = [];
    for (const question of allQuestionsInForm) {
      const answareDto = formAnswareDto.questionsAnswares.find(
        (q) => q.questionId === question.id,
      );
      if (!answareDto) continue;

      let calculatedScore = 0;

      switch (question.type) {
        case 'SCORE':
          calculatedScore = answareDto.score ?? 0;
          break;
        case 'SELECT':
        case 'MULTISELECT': {
          const selectedOptions = question.options
            .filter((opt) => {
              if (question.type === 'SELECT' && answareDto.selectedOptionId) {
                return opt.id === answareDto.selectedOptionId;
              }
              if (question.type === 'MULTISELECT' && answareDto.optionAnswers) {
                return answareDto.optionAnswers.some(
                  (ans) => ans.optionId === opt.id,
                );
              }
              return false;
            })
            .map((opt) => ({
              ...opt,
              description: opt.description ?? '',
            }));

          if (question.rule) {
            const questionContext: EvaluationContext = {
              selectedOptions,
              elderly,
            };
            calculatedScore = this.ruleEngine.calculateScore(
              [question.rule],
              questionContext,
            );
          } else {
            calculatedScore = selectedOptions.reduce(
              (sum, opt) => sum + opt.score,
              0,
            );
          }
          break;
        }
        case 'BOOLEAN': {
          if (question.rule) {
            const questionContext: EvaluationContext = {
              answerBoolean: answareDto.answerBoolean,
              elderly,
            };
            calculatedScore = this.ruleEngine.calculateScore(
              [question.rule],
              questionContext,
            );
          } else {
            calculatedScore = answareDto.score ?? 0;
          }
          break;
        }
        default:
          calculatedScore = answareDto.score ?? 0;
          break;
      }
      allQuestionScores.push({
        questionId: question.id,
        score: calculatedScore,
      });
    }

    const seccionScores: { seccionId: string; score: number }[] = [];
    for (const seccion of form.seccions) {
      const questionScoresForThisSeccion = allQuestionScores.filter((qs) =>
        seccion.questionsRel.some((rel) => rel.questionId === qs.questionId),
      );
      const seccionContext: EvaluationContext = {
        questionScores: questionScoresForThisSeccion,
        elderly,
      };
      const score = this.ruleEngine.calculateScore(
        seccion.rule ? [seccion.rule] : [],
        seccionContext,
      );
      seccionScores.push({ seccionId: seccion.id, score });
    }

    let formScore: number;

    if (form.rule) {
      const scoresOutsideSeccion = allQuestionScores.filter((qs) =>
        form.questionsRel.some((rel) => rel.questionId === qs.questionId),
      );
      const formContext: EvaluationContext = {
        questionScores: scoresOutsideSeccion,
        seccionScores,
        elderly,
      };
      formScore = this.ruleEngine.calculateScore([form.rule], formContext);
    } else {
      const totalSeccionScore = seccionScores.reduce(
        (acc, curr) => acc + curr.score,
        0,
      );
      const totalTopLevelQuestionScore = allQuestionScores
        .filter((qs) =>
          form.questionsRel.some((rel) => rel.questionId === qs.questionId),
        )
        .reduce((acc, curr) => acc + curr.score, 0);

      formScore = totalSeccionScore + totalTopLevelQuestionScore;
    }

    const questionScoresMap = new Map(
      allQuestionScores.map((qs) => [qs.questionId, qs.score]),
    );

    await this._upsertFormAnsware(
      tx,
      evaluationAnswareId,
      formAnswareDto,
      elderly,
      professionalId,
      { formScore, questionScores: questionScoresMap },
    );
  }

  private async saveFormProgress(
    tx: Prisma.TransactionClient,
    evaluationAnswareId: string,
    formAnswareDto: CreateFormAnswareNestedDto,
    elderly: Elderly,
    professionalId: string,
  ) {
    await this._upsertFormAnsware(
      tx,
      evaluationAnswareId,
      formAnswareDto,
      elderly,
      professionalId,
      { formScore: 0, questionScores: new Map() },
    );
  }

  private async _upsertFormAnsware(
    tx: Prisma.TransactionClient,
    evaluationAnswareId: string,
    formAnswareDto: CreateFormAnswareNestedDto,
    elderly: Elderly,
    professionalId: string,
    scores: { formScore: number; questionScores: Map<string, number> },
  ) {
    const formAnsware = await tx.formAnsware.upsert({
      where: {
        evaluationAnswareId_formId: {
          evaluationAnswareId,
          formId: formAnswareDto.formId,
        },
      },
      update: {
        totalScore: scores.formScore,
        questionsAnswares: { deleteMany: {} },
      },
      create: {
        formId: formAnswareDto.formId,
        evaluationAnswareId,
        totalScore: scores.formScore,
        techProfessionalId: professionalId,
        elderlyId: elderly.id,
      },
    });

    if (!formAnswareDto.questionsAnswares) return;

    for (const questionAnswareDto of formAnswareDto.questionsAnswares) {
      const score =
        scores.questionScores.get(questionAnswareDto.questionId) ?? 0;

      let savedImagePath: string | undefined = questionAnswareDto.answerImage;
      if (
        questionAnswareDto.answerImage &&
        questionAnswareDto.answerImage.startsWith('data:image/')
      ) {
        try {
          const result = await this.imageStorageService.saveBase64Image(
            questionAnswareDto.answerImage,
            `question-${questionAnswareDto.questionId}`,
          );
          savedImagePath = result.filePath;
        } catch (error) {
          console.error(
            `Failed to save image for question ${questionAnswareDto.questionId}:`,
            error,
          );
          throw new BadRequestException(
            `Erro ao processar imagem para a questão ${questionAnswareDto.questionId}.`,
          );
        }
      }

      const createdQuestionAnswer = await tx.questionAnswer.create({
        data: {
          questionId: questionAnswareDto.questionId,
          formAnswareId: formAnsware.id,
          score,
          answerText: questionAnswareDto.answerText,
          answerNumber: questionAnswareDto.answerNumber,
          answerBoolean: questionAnswareDto.answerBoolean,
          answerImage: savedImagePath,
          selectedOptionId: questionAnswareDto.selectedOptionId,
        },
      });

      if (
        questionAnswareDto.optionAnswers &&
        questionAnswareDto.optionAnswers.length > 0
      ) {
        const optionIds = questionAnswareDto.optionAnswers.map(
          (opt) => opt.optionId,
        );
        const optionsInDb = await tx.option.findMany({
          where: { id: { in: optionIds } },
          select: { id: true, score: true },
        });
        const optionScoresMap = new Map(
          optionsInDb.map((opt) => [opt.id, opt.score]),
        );

        await tx.optionAnswer.createMany({
          data: questionAnswareDto.optionAnswers.map((opt) => ({
            optionId: opt.optionId,
            questionAnswerId: createdQuestionAnswer.id,
            score: optionScoresMap.get(opt.optionId) ?? 0,
            answerText: opt.answerText,
            answerNumber: opt.answerNumber,
            answerBoolean: opt.answerBoolean,
          })),
        });
      }
    }
  }

  async findAll(search?: string) {
    const where: Prisma.EvaluationAnswareWhereInput = {};

    if (search) {
      const cleanedCpf = search.replace(/\D/g, '');
      where.elderly = {
        OR: [{ name: { contains: search } }, { cpf: { contains: cleanedCpf } }],
      };
    }

    return this.prisma.evaluationAnsware.findMany({
      where,
      include: {
        elderly: { select: { id: true, name: true, cpf: true } },
        evaluation: { select: { id: true, title: true } },
      },
      orderBy: { created: 'desc' },
    });
  }

  private async _findEvaluationAnswareById(
    prismaClient: Prisma.TransactionClient | PrismaService,
    id: string,
  ) {
    const evaluationAnsware = await prismaClient.evaluationAnsware.findUnique({
      where: { id },
      include: {
        elderly: true,
        evaluation: true,
        formAnswares: {
          orderBy: { created: 'asc' },
          include: {
            form: { select: { title: true } },
            questionsAnswares: {
              orderBy: { created: 'asc' },
              include: {
                question: { select: { title: true, type: true } },
                selectedOption: {
                  select: { description: true, score: true },
                },
                optionAnswers: {
                  include: {
                    option: { select: { description: true, score: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!evaluationAnsware) {
      throw new NotFoundException(
        `Resposta da Avaliação com ID ${id} não encontrada.`,
      );
    }
    return evaluationAnsware;
  }

  async findOne(id: string) {
    return this._findEvaluationAnswareById(this.prisma, id);
  }

  async findAllByElderlyId(elderlyId: string) {
    return this.prisma.evaluationAnsware.findMany({
      where: {
        elderlyId,
        status: EvaluationAnswareStatus.COMPLETED,
      },
      include: {
        elderly: true,
        evaluation: true,
        formAnswares: {
          orderBy: { created: 'asc' },
          include: {
            form: { select: { id: true, title: true } },
            questionsAnswares: {
              orderBy: { created: 'asc' },
              include: {
                question: { select: { title: true, type: true } },
                selectedOption: {
                  select: { description: true, score: true },
                },
                optionAnswers: {
                  include: {
                    option: { select: { description: true, score: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created: 'desc' },
    });
  }

  async compareFormScoreWithOthersAverage(formId: string, elderlyId: string) {
    const userAnsware = await this.prisma.formAnsware.findFirst({
      where: {
        formId,
        elderlyId,
        evaluationAnsware: {
          status: 'COMPLETED',
        },
      },
      orderBy: {
        created: 'desc',
      },
      select: {
        totalScore: true,
      },
    });

    if (!userAnsware) {
      throw new NotFoundException(
        'Nenhuma resposta para este formulário foi encontrada para você.',
      );
    }

    const aggregateResult = await this.prisma.formAnsware.aggregate({
      _avg: {
        totalScore: true,
      },
      _count: {
        _all: true,
      },
      where: {
        formId,
        elderlyId: {
          not: elderlyId,
        },
        evaluationAnsware: {
          status: 'COMPLETED',
        },
      },
    });

    return {
      myScore: userAnsware.totalScore,
      averageScore: aggregateResult._avg.totalScore ?? 0,
      totalParticipants: aggregateResult._count._all,
    };
  }

  async getElderlyFormsScoresHistory(
    elderlyId: string,
  ): Promise<FormScoreHistory[]> {
    const evaluations = await this.prisma.evaluationAnsware.findMany({
      where: {
        elderlyId,
        status: 'COMPLETED',
      },
      include: {
        formAnswares: {
          orderBy: { created: 'asc' },
          include: {
            form: { select: { id: true, title: true, type: true } },
          },
        },
      },
      orderBy: { created: 'asc' },
    });

    const historyMap = new Map<string, FormScoreHistory>();

    for (const evaluation of evaluations) {
      for (const formAnsware of evaluation.formAnswares) {
        const formId = formAnsware.formId;
        const formTitle = formAnsware.form.title ?? '';
        const formType = formAnsware.form.type ?? '';

        if (!historyMap.has(formId)) {
          historyMap.set(formId, { formId, formTitle, formType, scores: [] });
        }

        historyMap.get(formId)?.scores.push({
          evaluationAnswareId: evaluation.id,
          date: formAnsware.created,
          totalScore: formAnsware.totalScore ?? 0,
          status: evaluation.status,
        });
      }
    }

    const result = Array.from(historyMap.values()).sort((a, b) =>
      a.formTitle.localeCompare(b.formTitle),
    );

    return result;
  }

  async getElderlyFormScoresByType(
    elderlyId: string,
    formId: string,
  ): Promise<FormScoreHistory[]> {
    const targetForm = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { type: true },
    });

    if (!targetForm) {
      throw new NotFoundException(
        `Formulário com ID ${formId} não encontrado.`,
      );
    }

    const targetFormType = targetForm.type;

    const allFormsHistory = await this.getElderlyFormsScoresHistory(elderlyId);

    return allFormsHistory.filter(
      (history) => history.formType === targetFormType,
    );
  }

  async remove(id: string) {
    const existing = await this.prisma.evaluationAnsware.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `Resposta da Avaliação com ID ${id} não encontrada.`,
      );
    }
    return this.prisma.evaluationAnsware.delete({ where: { id } });
  }
}
