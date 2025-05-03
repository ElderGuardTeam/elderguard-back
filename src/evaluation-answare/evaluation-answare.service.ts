import { Injectable } from '@nestjs/common';
import { CreateEvaluationAnswareDto } from './dto/create-evaluation-answare.dto';
import { UpdateEvaluationAnswareDto } from './dto/update-evaluation-answare.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class EvaluationAnswareService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateEvaluationAnswareDto) {
    return this.prisma.evaluationAnsware.create({ data: dto });
  }

  findAll() {
    return this.prisma.evaluationAnsware.findMany();
  }

  findOne(id: string) {
    return this.prisma.evaluationAnsware.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateEvaluationAnswareDto) {
    return this.prisma.evaluationAnsware.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.evaluationAnsware.delete({ where: { id } });
  }
}
