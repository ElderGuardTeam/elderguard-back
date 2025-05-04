import { Injectable } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class EvaluationService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateEvaluationDto) {
    return this.prisma.evaluation.create({ data: dto });
  }

  async findAll() {
    return this.prisma.evaluation.findMany();
  }

  async findOne(id: string) {
    return this.prisma.evaluation.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateEvaluationDto) {
    return this.prisma.evaluation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.evaluation.delete({ where: { id } });
  }
}
