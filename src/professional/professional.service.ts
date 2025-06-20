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
    // Destrinchar os campos do DTO
    const { name, email, phone, cpf, userType, password } = data;

    // Preparar dados para atualização da entidade Professional
    const professionalUpdateData: Prisma.ProfessionalUpdateInput = {};
    if (name !== undefined) professionalUpdateData.name = name;
    if (email !== undefined) professionalUpdateData.email = email; // Professional model has email
    if (phone !== undefined)
      professionalUpdateData.phone = phone.replace(/\D/g, '');
    if (cpf !== undefined) professionalUpdateData.cpf = cpf.replace(/\D/g, ''); // Professional model has cpf

    // Preparar dados para atualização da entidade User associada
    const userUpdateData: Prisma.UserUpdateInput = {};
    if (name !== undefined) userUpdateData.name = name; // Manter User.name sincronizado
    if (email !== undefined) userUpdateData.email = email; // Manter User.email sincronizado
    if (userType !== undefined) userUpdateData.userType = userType;
    if (password !== undefined && password.length > 0) {
      userUpdateData.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }
    if (cpf !== undefined) {
      // Se o cpf do profissional mudar, o login do usuário também deve mudar
      userUpdateData.login = cpf.replace(/\D/g, '');
    }

    return this.prisma.$transaction(async (tx) => {
      const professional = await tx.professional.findUnique({
        where: { id },
      });

      if (!professional) {
        throw new NotFoundException('Profissional não encontrado');
      }

      // Verificar unicidade do CPF/login se estiver sendo alterado
      if (userUpdateData.login && userUpdateData.login !== professional.cpf) {
        const existingUserWithNewLogin = await tx.user.findUnique({
          where: { login: userUpdateData.login as string },
        });
        if (
          existingUserWithNewLogin &&
          existingUserWithNewLogin.id !== professional.userId
        ) {
          throw new BadRequestException(
            'Novo CPF (login) já está cadastrado para outro usuário.',
          );
        }
      }

      let updatedProfessional = professional;
      if (Object.keys(professionalUpdateData).length > 0) {
        updatedProfessional = await tx.professional.update({
          where: { id },
          data: professionalUpdateData,
        });
      }

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: professional.userId },
          data: userUpdateData,
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
