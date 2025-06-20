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

      return this.findOne(evaluationAnsware.id);
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

      await this.processAndScoreForm(
        tx,
        evaluationAnsware.id,
        addDto.formAnsware,
        elderly, // Passa o objeto 'elderly'
        addDto.professionalId, // Passa o 'professionalId' da avaliação existente
      );

      return this.findOne(id);
    });
  }

  /**
   * Lógica centralizada para processar e pontuar UM ÚNICO formulário.
   * @private
   */
  private async processAndScoreForm(
    tx: Prisma.TransactionClient, // Renamed for clarity within transaction
    evaluationAnswareId: string,
    formAnswareDto: CreateFormAnswareNestedDto,
    elderly: Elderly,
    professionalId: string,
  ) {
    // 1. BUSCA CORRIGIDA: Navegando através das tabelas de relacionamento
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

    // 2. LÓGICA ATUALIZADA: Extrai as questões da nova estrutura de dados
    const topLevelQuestions = form.questionsRel.map((rel) => rel.question);
    const sectionQuestions = form.seccions.flatMap((sec) =>
      sec.questionsRel.map((rel) => rel.question),
    );
    const allQuestionsInForm = [...topLevelQuestions, ...sectionQuestions];

    // O resto da lógica de cálculo permanece a mesma, pois agora opera sobre 'allQuestionsInForm'

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

    const scoresOutsideSeccion = allQuestionScores.filter((qs) =>
      form.questionsRel.some((rel) => rel.questionId === qs.questionId),
    );
    const formContext: EvaluationContext = {
      questionScores: scoresOutsideSeccion,
      seccionScores,
      elderly,
    };
    const formScore = this.ruleEngine.calculateScore(
      form.rule ? [form.rule] : [],
      formContext,
    );

    // 3. Persistência dos dados (sem alterações necessárias aqui)
    const formAnsware = await tx.formAnsware.create({
      data: {
        formId: form.id,
        evaluationAnswareId,
        totalScore: formScore,
        techProfessionalId: professionalId,
        elderlyId: elderly.id,
      },
    });

    for (const questionAnswareDto of formAnswareDto.questionsAnswares) {
      const score =
        allQuestionScores.find(
          (qs) => qs.questionId === questionAnswareDto.questionId,
        )?.score ?? 0;
      const questionAnsware = await tx.questionAnswer.create({
        data: {
          questionId: questionAnswareDto.questionId,
          formAnswareId: formAnsware.id,
          score,
        },
      });
      if (questionAnswareDto.optionAnswers) {
        await tx.optionAnswer.createMany({
          data: questionAnswareDto.optionAnswers.map((opt) => ({
            optionId: opt.optionId,
            questionAnswerId: questionAnsware.id,
            // Add 'score' if it's required, set to a default value if needed
            score: opt.score ?? 0,
          })),
        });
      }
    }
  }

  // findAll, findOne, e remove permanecem os mesmos
  async findAll() {
    return this.prisma.evaluationAnsware.findMany({
      include: {
        elderly: { select: { id: true, name: true } },
        evaluation: { select: { id: true, title: true } },
      },
      orderBy: { created: 'desc' },
    });
  }

  async findOne(id: string) {
    const evaluationAnsware = await this.prisma.evaluationAnsware.findUnique({
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
