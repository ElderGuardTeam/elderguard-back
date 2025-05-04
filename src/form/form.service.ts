import { Injectable } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from 'src/database/prisma.service';
import { RuleService } from 'src/rule/rule.service';
import { SeccionService } from 'src/seccion/seccion.service';

@Injectable()
export class FormService {
  constructor(
    private prisma: PrismaService,
    private seccionService: SeccionService,
  ) {}
  async create(dto: CreateFormDto) {
    if (dto.seccion) {
      const rule = await this.seccionService.create(dto.seccion);
      return this.prisma.form.create({
        data: { ...dto, ruleId: rule.id }});
    }
    return this.prisma.form.create({ data: dto });
  }

  async findAll() {
    return this.prisma.form.findMany();
  }

  async findOne(id: string) {
    return this.prisma.form.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateFormDto) {
    return this.prisma.form.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.form.delete({ where: { id } });
  }
}
