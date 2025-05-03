import { Injectable } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class FormService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateFormDto) {
    return this.prisma.form.create({ data: dto });
  }

  findAll() {
    return this.prisma.form.findMany();
  }

  findOne(id: string) {
    return this.prisma.form.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateFormDto) {
    return this.prisma.form.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.form.delete({ where: { id } });
  }
}
