import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { PrismaService } from 'src/database/prisma.service';
import {
  RuleEngineService,
  EvaluationContext,
} from '../common/rule-engine/rule-engine.service';
import { AddFormAnswareDto } from './dto/add-form-answare.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EvaluationAnswareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  /**
   * Cria o registro EvaluationAnsware com a resposta do PRIMEIRO formulário.
   */
  async create(createDto: CreateEvaluationAnswareDto) {
    if (!createDto.formAnswares || createDto.formAnswares.length !== 1) {
      throw new BadRequestException(
        'A criação de uma avaliação deve conter exatamente uma resposta de formulário.',
      );
    }

    const { formAnswares, ...evaluationData } = createDto;

    return this.prisma.$transaction(async (prisma) => {
      const evaluationAnsware = await prisma.evaluationAnsware.create({
        data: {
          elderlyId: evaluationData.elderlyId,
          evaluationId: evaluationData.evaluationId,
          status: 'IN_PROGRESS',
        },
      });

      await this.processAndScoreForm(
        prisma,
        evaluationAnsware.id,
        formAnswares[0],
      );

      return this.findOne(evaluationAnsware.id);
    });
  }

  /**
   * Adiciona a resposta de um novo formulário a uma EvaluationAnsware existente.
   */
  async addFormAnsware(id: string, addDto: AddFormAnswareDto) {
    return this.prisma.$transaction(async (prisma) => {
      const evaluationAnsware = await prisma.evaluationAnsware.findUnique({
        where: { id },
      });
      if (!evaluationAnsware) {
        throw new NotFoundException(
          `Resposta da Avaliação com ID ${id} não encontrada.`,
        );
      }

      // Previne o reenvio de um formulário já respondido
      const existingForm = await prisma.formAnsware.findFirst({
        where: { evaluationAnswareId: id, formId: addDto.formAnsware.formId },
      });
      if (existingForm) {
        throw new BadRequestException(
          'Este formulário já foi respondido para esta avaliação.',
        );
      }

      await this.processAndScoreForm(
        prisma,
        evaluationAnsware.id,
        addDto.formAnsware,
      );

      return this.findOne(id);
    });
  }

  /**
   * Lógica centralizada para processar e pontuar UM ÚNICO formulário.
   */
  private async processAndScoreForm(
    prisma: Prisma.TransactionClient,
    evaluationAnswareId: string,
    formAnswareDto: any,
  ) {
    const [form, elderly] = await Promise.all([
      prisma.form.findUnique({
        where: { id: formAnswareDto.formId },
        include: {
          rules: true,
          seccions: {
            include: {
              rule: true,
              questions: { include: { rules: true, options: true } },
            },
          },
          questions: {
            where: { seccionId: null },
            include: { rules: true, options: true },
          },
        },
      }),
      prisma.elderly.findUnique({ where: { id: formAnswareDto.elderlyId } }),
    ]);

    if (!form)
      throw new NotFoundException(
        `Formulário com ID ${formAnswareDto.formId} não encontrado.`,
      );
    if (!elderly)
      throw new NotFoundException(
        `Idoso com ID ${formAnswareDto.elderlyId} não encontrado.`,
      );

    const allQuestionScores: { questionId: string; score: number }[] = [];
    const allQuestionsInForm = [
      ...form.questions,
      ...form.seccions.flatMap((s) => s.questions),
    ];

    for (const question of allQuestionsInForm) {
      const answareDto = formAnswareDto.questionAnswares.find(
        (q) => q.questionId === question.id,
      );
      if (!answareDto) continue;

      const selectedOptions = question.options.filter((opt) =>
        answareDto.optionAnswares?.some((ans) => ans.optionId === opt.id),
      );
      const questionContext: EvaluationContext = { selectedOptions, elderly };
      const score = this.ruleEngine.calculateScore(
        question.rules,
        questionContext,
      );
      allQuestionScores.push({ questionId: question.id, score });
    }

    const seccionScores: { seccionId: string; score: number }[] = [];
    for (const seccion of form.seccions) {
      const questionScoresForThisSeccion = allQuestionScores.filter((qs) =>
        seccion.questions.some((q) => q.id === qs.questionId),
      );
      const answeredQuestions = questionScoresForThisSeccion.length;
      const totalQuestions = seccion.questions.length;

      const seccionContext: EvaluationContext = {
        questionScores: questionScoresForThisSeccion,
        elderly,
        answeredQuestions,
        totalQuestions,
      };
      const score = this.ruleEngine.calculateScore(
        seccion.rules,
        seccionContext,
      );
      seccionScores.push({ seccionId: seccion.id, score });
    }

    const scoresOutsideSeccion = allQuestionScores.filter((qs) =>
      form.questions.some((q) => q.id === qs.questionId),
    );
    const formContext: EvaluationContext = {
      questionScores: scoresOutsideSeccion,
      seccionScores,
      elderly,
    };
    const formScore = this.ruleEngine.calculateScore(form.rules, formContext);

    const formAnsware = await prisma.formAnsware.create({
      data: {
        formId: form.id,
        evaluationAnswareId,
        score: formScore,
        professionalId: formAnswareDto.professionalId,
        elderlyId: formAnswareDto.elderlyId,
      },
    });

    for (const questionAnswareDto of formAnswareDto.questionAnswares) {
      const score =
        allQuestionScores.find(
          (qs) => qs.questionId === questionAnswareDto.questionId,
        )?.score ?? 0;
      const questionAnsware = await prisma.questionAnsware.create({
        data: {
          questionId: questionAnswareDto.questionId,
          formAnswareId: formAnsware.id,
          score,
        },
      });
      if (questionAnswareDto.optionAnswares) {
        await prisma.optionAnsware.createMany({
          data: questionAnswareDto.optionAnswares.map((opt) => ({
            optionId: opt.optionId,
            questionAnswareId: questionAnsware.id,
          })),
        });
      }
    }
  }

  /**
   * Busca todas as respostas de avaliação (sem alterações).
   */
  findAll() {
    return this.prisma.evaluationAnsware.findMany({
      include: {
        elderly: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        evaluation: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca uma única resposta de avaliação por ID, incluindo todos os detalhes (sem alterações).
   */
  async findOne(id: string) {
    const evaluationAnsware = await this.prisma.evaluationAnsware.findUnique({
      where: { id },
      include: {
        elderly: true,
        professional: true,
        evaluation: true,
        formAnswares: {
          orderBy: { createdAt: 'asc' },
          include: {
            form: { select: { name: true } },
            questionAnswares: {
              orderBy: { createdAt: 'asc' },
              include: {
                question: { select: { text: true, type: true } },
                optionAnswares: {
                  include: { option: { select: { text: true, score: true } } },
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

  /**
   * Remove uma resposta de avaliação (sem alterações).
   */
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
