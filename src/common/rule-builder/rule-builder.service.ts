/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateRuleDto } from 'src/rule/dto/create-rule.dto';

interface BuildResult {
  expression: string;
  description: string;
}

@Injectable()
export class RuleBuilderService {
  build(dto: CreateRuleDto): BuildResult {
    switch (dto.type) {
      case 'SUM':
        return this.buildSumExpression(dto);
      case 'ARITHMETIC':
        return this.buildArithmeticExpression(dto);
      case 'CONDITIONAL':
        return this.buildConditionalExpression(dto);
      case 'PRORATE':
        return this.buildProrateExpression(dto);
      default:
        throw new BadRequestException(
          `Tipo de regra desconhecido: ${dto.type}`,
        );
    }
  }

  private buildSumExpression(dto: CreateRuleDto): BuildResult {
    if (dto.maxScore) {
      return {
        expression: `MIN(SUM(questionScores), ${dto.maxScore})`,
        description: `Soma as pontuações das questões, com um máximo de ${dto.maxScore} pontos.`,
      };
    }
    return {
      expression: 'SUM(questionScores)',
      description: 'Soma as pontuações de todas as questões.',
    };
  }

  private buildArithmeticExpression(dto: CreateRuleDto): BuildResult {
    const val1 = dto.value1Type === 'score' ? 'currentScore' : dto.value1;
    const val2 = dto.value2Type === 'score' ? 'currentScore' : dto.value2;
    const op = dto.operation;

    if (val1 === undefined || val2 === undefined || !op) {
      throw new BadRequestException(
        'Para regras aritméticas, todos os valores e a operação são necessários.',
      );
    }

    return {
      expression: `${val1} ${op} ${val2}`,
      description: `Operação: ${val1} ${op} ${val2}`,
    };
  }

  private buildConditionalExpression(dto: CreateRuleDto): BuildResult {
    const { condition, value1, operation, value2 } = dto;

    if (
      !condition ||
      value1 === undefined ||
      !operation ||
      value2 === undefined
    ) {
      throw new BadRequestException(
        'Para regras condicionais, todos os campos são necessários.',
      );
    }

    const conditionStr = `currentScore ${condition} ${value1}`;
    const thenStr = `currentScore ${operation} ${value2}`;

    return {
      expression: `(${conditionStr}) ? (${thenStr}) : currentScore`,
      description: `Se (pontuação ${condition} ${value1}) então (pontuação ${operation} ${value2}) senão mantém a pontuação.`,
    };
  }
  private buildProrateExpression(dto: CreateRuleDto): BuildResult {
    if (!dto.totalItems || dto.totalItems <= 0) {
      throw new BadRequestException(
        'Para regras de prorrateio, o número total de itens (totalItems) é obrigatório e deve ser positivo.',
      );
    }
    return {
      expression: `(SUM(questionScores) * ${dto.totalItems}) / COUNT(questionScores)`,
      description: `Soma as pontuações das questões, e ajusta proporcionalmente para um total de ${dto.totalItems} itens, tratando ausentes.`,
    };
  }
}
