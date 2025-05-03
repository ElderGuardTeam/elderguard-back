import { Injectable } from '@nestjs/common';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class RuleService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateRuleDto) {
    return this.prisma.rule.create({ data: dto });
  }

  findAll() {
    return this.prisma.rule.findMany();
  }

  findOne(id: string) {
    return this.prisma.rule.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateRuleDto) {
    return this.prisma.rule.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.rule.delete({ where: { id } });
  }
}
