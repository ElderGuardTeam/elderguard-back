import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { UserType } from '@prisma/client';

@Injectable()
export class ProfessionalService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProfessionalDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.professional.create({
      data: {
        cpf: data.cpf,
        name: data.name,
        phone: data.phone,
        email: data.email,
        user: {
          create: {
            login: data.cpf,
            password: hashedPassword,
            userType: data.userType,
          },
        },
      },
      include: { user: true },
    });
  }

  async findAll() {
    return this.prisma.professional.findMany({ include: { user: true } });
  }

  async findOne(id: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    return professional;
  }

  async update(id: string, data: UpdateProfessionalDto) {
    return this.prisma.professional.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  async remove(id: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    await this.prisma.professional.delete({ where: { id } });

    await this.prisma.user.delete({ where: { id: professional.userId } });

    return { message: 'Professional deleted successfully' };
  }
}
