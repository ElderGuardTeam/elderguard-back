import { Injectable } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class EvaluationService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateEvaluationDto) {
    return this.prisma.evaluation.create({ data: dto });
  }

  findAll() {
    return this.prisma.evaluation.findMany();
  }

  findOne(id: string) {
    return this.prisma.evaluation.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateEvaluationDto) {
    return this.prisma.evaluation.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.evaluation.delete({ where: { id } });
  }
}
