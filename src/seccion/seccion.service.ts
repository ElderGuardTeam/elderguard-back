/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateSeccionDto } from './dto/create-seccion.dto';
import { UpdateSeccionDto } from './dto/update-seccion.dto';
import { PrismaService } from 'src/database/prisma.service';
import { RuleService } from 'src/rule/rule.service';

@Injectable()
export class SeccionService {
  constructor(
    private prisma: PrismaService,
    private ruleService: RuleService,
  ) {}
  async create(dto: CreateSeccionDto) {
    if (dto.rule) {
      const rule = await this.ruleService.create(dto.rule);
      return this.prisma.seccion.create({
        data: { ...{ ...dto, ruleId: rule.id, rule: undefined } },
      });
    }
    const { rule, ...rest } = dto;
    return this.prisma.seccion.create({ data: rest });
  }

  async findAll() {
    return this.prisma.seccion.findMany();
  }

  async findOne(id: string) {
    return this.prisma.seccion.findUnique({ where: { id } });
  }

  // async update(id: string, dto: UpdateSeccionDto) {
  //   const { ruleId, ...rest } = dto;
  //   return this.prisma.seccion.update({
  //     where: { id },
  //     data: rest,
  //   });
  // }

  async remove(id: string) {
    return this.prisma.seccion.delete({ where: { id } });
  }
}
