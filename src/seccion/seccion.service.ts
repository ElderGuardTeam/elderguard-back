import { Injectable } from '@nestjs/common';
import { CreateSeccionDto } from './dto/create-seccion.dto';
import { UpdateSeccionDto } from './dto/update-seccion.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class SeccionService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateSeccionDto) {
    return this.prisma.seccion.create({ data: dto });
  }

  findAll() {
    return this.prisma.seccion.findMany();
  }

  findOne(id: string) {
    return this.prisma.seccion.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateSeccionDto) {
    return this.prisma.seccion.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.seccion.delete({ where: { id } });
  }
}
