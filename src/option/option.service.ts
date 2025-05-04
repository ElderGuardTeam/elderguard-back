import { Injectable } from '@nestjs/common';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class OptionService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateOptionDto) {
    return this.prisma.option.create({ data });
  }

  async findAll() {
    return this.prisma.option.findMany();
  }

  async findOne(id: string) {
    return this.prisma.option.findUnique({
      where: { id: id },
    });
  }

  async update(id: string, data: UpdateOptionDto) {
    return this.prisma.option.update({
      where: { id: id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.option.delete({
      where: { id: id },
    });
  }
}
