/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { Rule } from '@prisma/client';
import { create, all } from 'mathjs';

// A interface EvaluationContext permanece a mesma
export interface EvaluationContext {
  questionScores?: { questionId: string; score: number }[];
  seccionScores?: { seccionId: string; score: number }[];
  selectedOptions?: { score: number; description: string }[];
  answeredQuestions?: number;
  totalQuestions?: number;
  elderly?: { education: string };
  answerBoolean?: boolean;
}

@Injectable()
export class RuleEngineService {
  private math;

  constructor() {
    this.math = create(all);
  }

  public calculateScore(rules: Rule[], context: EvaluationContext): number {
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

    if (sortedRules.length > 0) {
      let finalScore = 0;
      for (const rule of sortedRules) {
        const ruleContext = { ...context, currentScore: finalScore };
        finalScore = this._evaluateExpression(
          rule.expression ?? '',
          ruleContext,
        );
      }
      return finalScore;
    }

    // --- LÓGICA PADRÃO CORRIGIDA ---
    // Se não houver regras, o comportamento padrão é somar todas as pontuações do contexto.
    let defaultScore = 0;
    if (context.seccionScores?.length) {
      defaultScore += context.seccionScores.reduce(
        (acc, curr) => acc + curr.score,
        0,
      );
    }
    if (context.questionScores?.length) {
      defaultScore += context.questionScores.reduce(
        (acc, curr) => acc + curr.score,
        0,
      );
    }
    if (defaultScore > 0) {
      return defaultScore;
    }
    // Apenas se não houver seções ou questões, usa as opções (para o nível de questão)
    if (context.selectedOptions?.length) {
      return context.selectedOptions.reduce((acc, opt) => acc + opt.score, 0);
    }

    return 0;
  }

  private _evaluateExpression(expression: string, context: any): number {
    try {
      const scope = {
        ...context,
        SUM: (arr: any[]) =>
          arr?.reduce((acc, curr) => acc + (curr.score ?? 0), 0) ?? 0,
        AVG: (arr: any[]) => {
          if (!arr || arr.length === 0) return 0;
          const sum = arr.reduce((acc, curr) => acc + (curr.score ?? 0), 0);
          return sum / arr.length;
        },
        COUNT: (arr: any[]) => (arr ? arr.length : 0),
        MIN: Math.min,
        MAX: Math.max,
      };

      const result = this.math.evaluate(expression, scope);
      return typeof result === 'number' ? result : 0;
    } catch (error) {
      console.error(
        `[RuleEngine] Erro ao avaliar a expressão: "${expression}"`,
        error,
      );
      return 0;
    }
  }
}
