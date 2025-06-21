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

      const selectedOptions = question.options
        .filter((opt) =>
          answareDto.optionAnswers?.some((ans) => ans.optionId === opt.id),
        )
        .map((opt) => ({
          ...opt,
          description: opt.description ?? '',
        }));
      const questionContext: EvaluationContext = { selectedOptions, elderly };
      const score = this.ruleEngine.calculateScore(
        question.rule ? [question.rule] : [],
        questionContext,
      ); // Envia a regra como um array
      allQuestionScores.push({ questionId: question.id, score });
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

      await tx.questionAnswer.create({
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
