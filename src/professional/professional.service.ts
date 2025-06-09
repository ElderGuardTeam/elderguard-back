import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { UserType, Prisma } from '@prisma/client';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class ProfessionalService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProfessionalDto) {
    return this.prisma.$transaction(async (tx) => {
      const sanitizedData = {
        ...data,
        cpf: data.cpf.replace(/\D/g, ''),
        phone: data.phone.replace(/\D/g, ''),
      };
      const existingUser = await tx.user.findUnique({
        where: { login: sanitizedData.cpf },
      });

      if (existingUser) {
        throw new BadRequestException('Este CPF já está cadastrado.');
      }

      const hashedPassword = await bcrypt.hash(
        sanitizedData.cpf,
        BCRYPT_SALT_ROUNDS,
      );

      const user = await tx.user.create({
        data: {
          login: sanitizedData.cpf,
          email: sanitizedData.email,
          name: sanitizedData.name,
          password: hashedPassword,
          userType: UserType.TECH_PROFESSIONAL,
        },
      });
      const professional = await tx.professional.create({
        data: {
          cpf: sanitizedData.cpf,
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
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
    const { name, email, phone, ...otherProfessionalData } = data;

    const dataToUpdateProfessional: Prisma.ProfessionalUpdateInput = {
      ...otherProfessionalData,
    };
    if (name) dataToUpdateProfessional.name = name;
    if (email) dataToUpdateProfessional.email = email;
    if (phone) dataToUpdateProfessional.phone = phone.replace(/\D/g, '');

    return this.prisma.$transaction(async (tx) => {
      const professionalExists = await tx.professional.findUnique({
        where: { id },
      });

      if (!professionalExists) {
        throw new NotFoundException('Profissional não encontrado');
      }

      const updatedProfessional = await tx.professional.update({
        where: { id },
        data: dataToUpdateProfessional,
      });

      const userDataToUpdate: Prisma.UserUpdateInput = {};
      if (name) userDataToUpdate.name = name;
      if (email) userDataToUpdate.email = email;

      if (Object.keys(userDataToUpdate).length > 0) {
        await tx.user.update({
          where: { id: professionalExists.userId },
          data: userDataToUpdate,
        });
      }

      return tx.professional.findUnique({
        where: { id: updatedProfessional.id },
        include: { user: true },
      });
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const professional = await tx.professional.findUnique({
        where: { id },
      });

      if (!professional) {
        throw new NotFoundException('Profissional não encontrado');
      }

      await tx.professional.delete({ where: { id } });
      await tx.user.delete({ where: { id: professional.userId } });

      return { message: 'Professional deleted successfully' };
    });
  }
}
