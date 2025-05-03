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
        if (values == null || operation == null) {
          throw new BadRequestException('Regra condicional inválida');
        }
        const threshold = Number(values);
        const val = Number(answer);
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
            return val === threshold;
          case '!=':
            return val != threshold;
          case '!==':
            return val !== threshold;
          default:
            throw new BadRequestException(
              `Operador '${operation}' não suportado`,
            );
        }
      }
      case RuleType.SUM: {
        if (!Array.isArray(answer)) {
          // soma single value
          return Number(answer);
        }
        return answer.reduce((sum, x) => sum + Number(x), 0);
      }
      case RuleType.ARITHMETIC: {
        if (!operation) {
          throw new BadRequestException('Operação aritmética não fornecida');
        }
        // answer deve ser um objeto JSON string no 'valores'
        let context: Record<string, any>;
        try {
          context = values ? JSON.parse(values) : {};
        } catch {
          throw new BadRequestException('Valores para expressão inválidos');
        }
        // cria função dinâmica
        const args = Object.keys(context);
        const vals = Object.values(context);
        // substitui variáveis em operacao, ou usa context
        const fn = new Function(...args, `return ${operation};`);
        const result = fn(...vals);
        if (typeof result !== 'number') {
          throw new BadRequestException('Expressão não retornou número');
        }
        return result;
      }
      default:
        throw new BadRequestException('Tipo de regra desconhecido');
    }
  }
}
