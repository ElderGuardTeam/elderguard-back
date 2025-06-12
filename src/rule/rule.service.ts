import { Injectable } from '@nestjs/common';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { PrismaService } from 'src/database/prisma.service';
import { RuleBuilderService } from 'src/common/rule-builder/rule-builder.service';

@Injectable()
export class RuleService {
  constructor(
    private prisma: PrismaService,
    private ruleBuilder: RuleBuilderService, // Injeta o novo serviço
  ) {}

  async create(dto: CreateRuleDto) {
    // Usa o builder para gerar a expressão e a descrição
    const { expression, description } = this.ruleBuilder.build(dto);

    return this.prisma.rule.create({
      data: {
        expression,
        description,
        priority: 0, // Pode ser ajustado conforme necessário
      },
    });
  }

  async findAll() {
    return this.prisma.rule.findMany();
  }

  async findOne(id: string) {
    return this.prisma.rule.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateRuleDto) {
    // Usa o builder para gerar a expressão e a descrição atualizadas
    const { expression, description } = this.ruleBuilder.build(
      dto as CreateRuleDto,
    );

    return this.prisma.rule.update({
      where: { id },
      data: {
        expression,
        description,
        priority: dto.priority,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.rule.delete({ where: { id } });
  }
}
