import { Injectable } from '@nestjs/common';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { UpdateEvaluationAnswareDto } from './dto/update-evaluation-answare.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class EvaluationAnswareService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateEvaluationAnswareDto) {
    return this.prisma.evaluationAnsware.create({ data: dto });
  }

  async findAll() {
    return this.prisma.evaluationAnsware.findMany();
  }

  async findOne(id: string) {
    return this.prisma.evaluationAnsware.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateEvaluationAnswareDto) {
    return this.prisma.evaluationAnsware.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.evaluationAnsware.delete({ where: { id } });
  }
}
