/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-implied-eval */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException } from '@nestjs/common';
import { RuleType } from '@prisma/client';

@Injectable()
export class RuleEngineService {
  /**
   * Avalia uma única regra com base no tipo
   * @param type Tipo da regra (CONDITIONAL, SUM, ARITHMETIC)
   * @param valores Parâmetros da regra (JSON ou CSV)
   * @param operacao Expressão aritmética para ARITHMETIC
   * @param answer Valor ou coleção de valores da resposta
   */
  evaluate(
    type: RuleType,
    values: string | null,
    operation: string | null,
    answer: number | boolean | string | Array<number>,
  ): number | boolean {
    switch (type) {
      case RuleType.CONDITIONAL: {
        return this._evaluateConditional(values, operation, answer);
      }
      case RuleType.SUM: {
        return this._evaluateSum(answer);
      }
      case RuleType.ARITHMETIC: {
        return this._evaluateArithmetic(values, operation);
      }
      default:
        throw new BadRequestException('Tipo de regra desconhecido');
    }
  }

  private _evaluateConditional(
    values: string | null,
    operation: string | null,
    answer: number | boolean | string | Array<number>,
  ): boolean {
    if (values == null || operation == null) {
      throw new BadRequestException(
        'Regra condicional: "values" e "operation" são obrigatórios.',
      );
    }
    // ATENÇÃO: Number(answer) pode ser NaN se answer for um array.
    // Considerar validação mais robusta para 'answer' neste contexto.
    const threshold = Number(values);
    const val = Number(answer);

    if (isNaN(val) || isNaN(threshold)) {
      throw new BadRequestException(
        'Regra condicional: "values" e "answer" devem ser numéricos ou conversíveis para número.',
      );
    }

    switch (operation) {
      case '>':
        return val > threshold;
      case '<':
        return val < threshold;
      case '>=':
        return val >= threshold;
      case '<=':
        return val <= threshold;
      case '==':
        return val == threshold;
      case '===':
        return val === threshold; // Note: Number(string) pode não ser o que se espera para ===
      case '!=':
        return val != threshold;
      case '!==':
        return val !== threshold; // Similar ao ===
      default:
        throw new BadRequestException(
          `Operador condicional '${operation}' não suportado.`,
        );
    }
  }

  private _evaluateSum(
    answer: number | boolean | string | Array<number>,
  ): number {
    if (Array.isArray(answer)) {
      return answer.reduce((sum, x) => sum + Number(x), 0);
    }
    // Se não for array, tenta converter para número.
    // Se 'answer' for boolean, Number(true) é 1, Number(false) é 0.
    const numericAnswer = Number(answer);
    if (isNaN(numericAnswer)) {
      throw new BadRequestException(
        'Regra de soma: "answer" deve ser um número ou um array de números.',
      );
    }
    return numericAnswer;
  }

  private _evaluateArithmetic(
    values: string | null,
    operation: string | null,
  ): number {
    if (!operation) {
      throw new BadRequestException('Operação aritmética não fornecida');
    }
    // !!! ALERTA DE SEGURANÇA !!!
    // O uso de new Function() é perigoso e pode levar a vulnerabilidades de injeção de código.
    // Considere usar uma biblioteca de parsing de expressões matemáticas segura.
    let context: Record<string, any> = {};
    if (values) {
      try {
        context = JSON.parse(values);
      } catch {
        throw new BadRequestException(
          'Valores (JSON) para expressão aritmética inválidos',
        );
      }
    }

    const args = Object.keys(context);
    const vals = Object.values(context);
    const fn = new Function(...args, `return ${operation};`);
    const result = fn(...vals);

    if (typeof result !== 'number' || isNaN(result)) {
      throw new BadRequestException(
        'Expressão aritmética não retornou um número válido.',
      );
    }
    return result;
  }
}
