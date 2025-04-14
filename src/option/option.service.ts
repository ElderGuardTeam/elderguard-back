import { Injectable } from '@nestjs/common';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class OptionService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateOptionDto) {
    return this.prisma.option.create({ data });
  }

  findAll() {
    return this.prisma.option.findMany();
  }

  findOne(id: string) {
    return this.prisma.option.findUnique({
      where: { id: id },
    });
  }

  update(id: string, data: UpdateOptionDto) {
    return this.prisma.option.update({
      where: { id: id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.option.delete({
      where: { id: id },
    });
  }
}
