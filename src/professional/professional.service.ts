import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { UserType } from '@prisma/client';

@Injectable()
export class ProfessionalService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProfessionalDto) {
    return this.prisma.$transaction(async (tx) => {
      // Verifica se o CPF já está cadastrado para evitar erro
      const existingUser = await tx.user.findUnique({
        where: { login: data.cpf },
      });

      if (existingUser) {
        throw new BadRequestException('Este CPF já está cadastrado.');
      }

      const hashedPassword = await bcrypt.hash(data.cpf, 10);

      // Cria o usuário antes do idoso
      const user = await tx.user.create({
        data: {
          login: data.cpf,
          email: data.email,
          name: data.name,
          password: hashedPassword,
          userType: UserType.TECH_PROFESSIONAL,
        },
      });
      const professional = await tx.professional.create({
        data: {
          cpf: data.cpf,
          name: data.name,
          email: data.email,
          phone: data.phone,
          userId: user.id,
        },
      });

      return { professional, user };
    });
  }

  async findAll(search?: string) {
    return this.prisma.professional.findMany({
      where: search
        ? {
            OR: [{ name: { contains: search } }, { cpf: { contains: search } }],
          }
        : undefined,
      include: { user: true },
    });
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
