import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateElderlyDto } from './dto/create-elderly.dto';
import { UpdateElderlyDto } from './dto/update-elderly.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/database/prisma.service';
import { UserType } from '@prisma/client';

@Injectable()
export class ElderlyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createElderlyDto: CreateElderlyDto) {
    const { cpf, dateOfBirth, addressId, ...elderlyData } = createElderlyDto;

    const birthDate = new Date(dateOfBirth);
    const password = birthDate
      .toISOString()
      .split('T')[0]
      .split('-')
      .reverse()
      .join('');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        login: cpf,
        password: hashedPassword,
        userType: UserType.USER,
      },
    });
    return this.prisma.elderly.create({
      data: {
        ...elderlyData,
        cpf,
        dateOfBirth,
        addressId,
        userId: user.id,
      },
      include: { user: true },
    });
  }

  async findAll() {
    return this.prisma.elderly.findMany({
      include: { user: true, address: true },
    });
  }

  async findOne(id: string) {
    const elderly = await this.prisma.elderly.findUnique({
      where: { id },
      include: { user: true, address: true },
    });

    if (!elderly) throw new NotFoundException('Idoso não encontrado');

    return elderly;
  }

  async update(id: string, updateElderlyDto: UpdateElderlyDto) {
    const elderly = await this.prisma.elderly.findUnique({ where: { id } });
    if (!elderly) throw new NotFoundException('Idoso não encontrado');

    return this.prisma.elderly.update({
      where: { id },
      data: updateElderlyDto,
    });
  }

  async remove(id: string) {
    const elderly = await this.prisma.elderly.findUnique({ where: { id } });
    if (!elderly) throw new NotFoundException('Idoso não encontrado');

    return this.prisma.elderly.delete({ where: { id } });
  }
}
