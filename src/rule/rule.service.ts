import { Injectable } from '@nestjs/common';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class RuleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRuleDto) {
    return this.prisma.rule.create({ data: dto });
  }

  async findAll() {
    return this.prisma.rule.findMany();
  }

  async findOne(id: string) {
    return this.prisma.rule.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateRuleDto) {
    return this.prisma.rule.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.rule.delete({ where: { id } });
  }
}
