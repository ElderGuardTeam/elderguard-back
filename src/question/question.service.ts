import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}
  create(data: CreateQuestionDto) {
    return this.prisma.question.create({ data });
  }

  findAll(search?: string) {
    return this.prisma.question.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.question.findUnique({
      where: { id: id },
    });
  }

  update(id: string, data: UpdateQuestionDto) {
    return this.prisma.question.update({
      where: { id: id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.question.delete({
      where: { id: id },
    });
  }
}
