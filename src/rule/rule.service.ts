import { Injectable } from '@nestjs/common';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '@prisma/client';
import { RuleBuilderService } from 'src/common/rule-builder/rule-builder.service';

@Injectable()
export class RuleService {
  constructor(
    private prisma: PrismaService,
    private ruleBuilder: RuleBuilderService, // Injeta o novo serviço
  ) {}

  async create(dto: CreateRuleDto, tx?: Prisma.TransactionClient) {
    // Usa o builder para gerar a expressão e a descrição
    const { expression, description } = this.ruleBuilder.build(dto);
    const prismaClient = tx || this.prisma;

    return prismaClient.rule.create({
      data: {
        expression,
        description,
        priority: 0,
        type: dto.type,
        maxScore: dto.maxScore,
        value1Type: dto.value1Type,
        value2Type: dto.value2Type,
        value1: dto.value1,
        value2: dto.value2, // Pode ser ajustado conforme necessário
        totalItems: dto.totalItems, // Novo campo para a regra de prorrateio
      },
    });
  }

  async findAll() {
    return this.prisma.rule.findMany();
  }

  async findOne(id: string) {
    return this.prisma.rule.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateRuleDto, tx?: Prisma.TransactionClient) {
    // Usa o builder para gerar a expressão e a descrição atualizadas
    const { expression, description } = this.ruleBuilder.build(
      dto as CreateRuleDto,
    );
    const prismaClient = tx || this.prisma;

    return prismaClient.rule.update({
      where: { id },
      data: {
        expression,
        description,
        priority: dto.priority,
        type: dto.type,
        maxScore: dto.maxScore,
        value1Type: dto.value1Type,
        value2Type: dto.value2Type,
        value1: dto.value1,
        value2: dto.value2, // Pode ser ajustado conforme necessário
        totalItems: dto.totalItems, // Novo campo para a regra de prorrateio
        condition: dto.condition, // Adiciona o campo de condição
        operation: dto.operation, // Adiciona o campo de operação
      },
    });
  }

  async remove(id: string) {
    return this.prisma.rule.delete({ where: { id } });
  }
}
