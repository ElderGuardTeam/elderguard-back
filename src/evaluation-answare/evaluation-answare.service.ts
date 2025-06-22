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
import { Prisma, Elderly } from '@prisma/client';
import { PauseEvaluationAnswareDto } from './dto/pause-evaluation-answare.dto';

export interface FormScoreHistory {
  formId: string;
  formTitle: string;
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
  ) {}

  /**
   * Cria o registro principal de EvaluationAnsware com a resposta do PRIMEIRO formulário.
   */
  async create(createDto: CreateEvaluationAnswareDto) {
    if (!createDto.formAnswares || createDto.formAnswares.length !== 1) {
      throw new BadRequestException(
        'A criação de uma avaliação deve conter exatamente uma resposta de formulário.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Busca o idoso para passar ao contexto das regras
      const elderly = await tx.elderly.findUnique({
        where: { id: createDto.elderlyId },
      });
      if (!elderly) {
        throw new NotFoundException(
          `Idoso com ID ${createDto.elderlyId} não encontrado.`,
        );
      }

      // Verify Professional existence
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

      // Processa e salva o primeiro formulário
      await this.processAndScoreForm(
        tx,
        evaluationAnsware.id,
        createDto.formAnswares[0],
        elderly, // Passa o objeto 'elderly'
        createDto.professionalId, // Passa o 'professionalId'
      );

      return this._findEvaluationAnswareById(tx, evaluationAnsware.id);
    });
  }

  /**
   * Adiciona a resposta de um novo formulário a uma EvaluationAnsware existente.
   */
  async addFormAnsware(id: string, addDto: AddFormAnswareDto) {
    return this.prisma.$transaction(async (tx) => {
      const evaluationAnsware = await tx.evaluationAnsware.findUnique({
        where: { id },
        include: { elderly: true }, // Inclui o idoso na busca
      });

      if (!evaluationAnsware) {
        throw new NotFoundException(
          `Resposta da Avaliação com ID ${id} não encontrada.`,
        );
      }

      // Verify Professional existence
      const professional = await tx.professional.findUnique({
        where: { id: addDto.professionalId },
      });
      if (!professional) {
        throw new NotFoundException(
          `Profissional com ID ${addDto.professionalId} não encontrado.`,
        );
      }

      const { elderly } = evaluationAnsware;

      // Iterate over the formAnswares array and process each one
      for (const formAnsware of addDto.formAnswares) {
        await this.processAndScoreForm(
          tx,
          evaluationAnsware.id,
          formAnsware, // Pass each formAnsware individually
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

  /**
   * Pausa uma avaliação, salvando o progresso de um formulário sem calcular a pontuação
   * e atualizando o status da avaliação para 'PAUSED'.
   */
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
      const formAnswareDto = pauseDto.formAnswares[0]; // Access the first element of the array

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

  /**
   * Finaliza uma avaliação, processando o último formulário e atualizando o status
   * da avaliação para 'COMPLETED'.
   */
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
      const formAnswareDto = completeDto.formAnswares[0]; // Assume que o último formulário está no array

      // Processa e pontua o último formulário
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

  /**
   * Lógica centralizada para processar e pontuar UM ÚNICO formulário.
   * @private
   */
  private async processAndScoreForm(
    tx: Prisma.TransactionClient,
    evaluationAnswareId: string,
    formAnswareDto: CreateFormAnswareNestedDto,
    elderly: Elderly,
    professionalId: string,
  ) {
    // 1. Busca o formulário e suas regras para cálculo de pontuação
    const form = await tx.form.findUnique({
      where: { id: formAnswareDto.formId },
      include: {
        rule: true, // Relação singular com Rule
        // Para buscar questões dentro de seções: Form -> Seccion -> questionsRel -> question
        seccions: {
          include: {
            rule: true,
            questionsRel: {
              // Acessa a tabela pivo Seccion_has_Question
              include: {
                question: {
                  // Acessa a entidade Question real
                  include: {
                    rule: true,
                    options: true,
                  },
                },
              },
            },
          },
        },
        // Para buscar questões diretas do formulário: Form -> questionsRel -> question
        questionsRel: {
          // Acessa a tabela pivo Form_has_Question
          orderBy: { index: 'asc' },
          include: {
            question: {
              // Acessa a entidade Question real
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

    // 2. Extrai as questões da estrutura de dados do formulário
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
          // For SCORE type questions, use the score directly from the DTO if provided, otherwise 0.
          calculatedScore = answareDto.score ?? 0;
          break;
        case 'SELECT':
        case 'MULTISELECT': {
          // For SELECT/MULTISELECT, calculate score from selected options
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

          // If there's a rule, use it. Otherwise, sum the scores of selected options.
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
          // Handle BOOLEAN questions specifically
          if (question.rule) {
            // If a rule is defined for the boolean question, use the rule engine
            const questionContext: EvaluationContext = {
              answerBoolean: answareDto.answerBoolean, // Pass the boolean answer to the context // This line is already in the compiled JS
              elderly, // Keep elderly in context if rules need it
            };
            calculatedScore = this.ruleEngine.calculateScore(
              [question.rule],
              questionContext,
            );
          } else {
            // If no rule, fallback to the score provided in the DTO, or 0
            // This might still be 0 if the DTO doesn't provide a score for boolean questions
            calculatedScore = answareDto.score ?? 0;
          }
          break;
        }
        default:
          // For other question types (TEXT, NUMBER, IMAGE, BOOLEAN), score is typically 0
          // unless explicitly provided in the DTO.
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

    // Se o formulário tiver uma regra específica, usa o RuleEngine.
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
      // Comportamento padrão se não houver regra no formulário:
      // Soma as pontuações das seções com as pontuações das questões de nível superior.
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

    // 3. Persiste os dados usando o método centralizado
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

  /**
   * Salva o progresso de um formulário sem calcular a pontuação.
   * @private
   */
  private async saveFormProgress(
    tx: Prisma.TransactionClient,
    evaluationAnswareId: string,
    formAnswareDto: CreateFormAnswareNestedDto,
    elderly: Elderly,
    professionalId: string,
  ) {
    // Chama o método de persistência com pontuações zeradas
    await this._upsertFormAnsware(
      tx,
      evaluationAnswareId,
      formAnswareDto,
      elderly,
      professionalId,
      { formScore: 0, questionScores: new Map() },
    );
  }

  /**
   * Centraliza a lógica de criar ou atualizar uma resposta de formulário e suas questões.
   * @private
   */
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
        questionsAnswares: { deleteMany: {} }, // Limpa respostas antigas para atualizar
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

      const createdQuestionAnswer = await tx.questionAnswer.create({
        data: {
          questionId: questionAnswareDto.questionId,
          formAnswareId: formAnsware.id,
          score,
          answerText: questionAnswareDto.answerText,
          answerNumber: questionAnswareDto.answerNumber,
          answerBoolean: questionAnswareDto.answerBoolean,
          answerImage: questionAnswareDto.answerImage,
          selectedOptionId: questionAnswareDto.selectedOptionId,
        },
      });

      // Handle optionAnswers for MULTISELECT questions
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
            score: optionScoresMap.get(opt.optionId) ?? 0, // Get score from DB, default to 0 if not found
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
    // 1. Pega a pontuação mais recente do usuário para este formulário
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

    // 2. Calcula a pontuação média de outros idosos para este formulário
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
          not: elderlyId, // Exclui o idoso atual da média
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

  /**
   * Retorna o histórico de pontuações de formulários para um idoso,
   * agrupado por tipo de formulário e ordenado por data.
   */
  async getElderlyFormsScoresHistory(
    elderlyId: string,
  ): Promise<FormScoreHistory[]> {
    const evaluations = await this.prisma.evaluationAnsware.findMany({
      where: {
        elderlyId,
        status: 'COMPLETED', // Considera apenas avaliações concluídas para o histórico
      },
      include: {
        formAnswares: {
          orderBy: { created: 'asc' }, // Ordena as respostas de formulário pela data de criação
          include: {
            form: { select: { id: true, title: true } }, // Seleciona detalhes do formulário
          },
        },
      },
      orderBy: { created: 'asc' }, // Ordena as avaliações pela data de criação
    });

    const historyMap = new Map<string, FormScoreHistory>();

    for (const evaluation of evaluations) {
      for (const formAnsware of evaluation.formAnswares) {
        const formId = formAnsware.formId;
        const formTitle = formAnsware.form.title;

        if (!historyMap.has(formId)) {
          historyMap.set(formId, { formId, formTitle, scores: [] });
        }

        historyMap.get(formId)?.scores.push({
          evaluationAnswareId: evaluation.id,
          date: formAnsware.created,
          totalScore: formAnsware.totalScore ?? 0,
          status: evaluation.status,
        });
      }
    }

    // Converte os valores do mapa para um array e ordena por título do formulário para saída consistente
    const result = Array.from(historyMap.values()).sort((a, b) =>
      a.formTitle.localeCompare(b.formTitle),
    );

    return result;
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
