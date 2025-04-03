import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateElderlyDto } from './dto/create-elderly.dto';
import { UpdateElderlyDto } from './dto/update-elderly.dto';
import { AddressService } from 'src/address/address.service';
import { ContactService } from 'src/contact/contact.service';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { UserType } from '@prisma/client';

@Injectable()
export class ElderlyService {
  constructor(
    private prisma: PrismaService,
    private addressService: AddressService,
    private contactService: ContactService,
    private userService: UserService,
  ) {}

  async create(data: CreateElderlyDto) {
    return this.prisma.$transaction(async (tx) => {
      // Verifica se o CPF já está cadastrado para evitar erro
      const existingUser = await tx.user.findUnique({
        where: { login: data.cpf },
      });

      if (existingUser) {
        throw new BadRequestException('Este CPF já está cadastrado.');
      }
      const address = await this.addressService.create(data.address);

      const birthDate = new Date(data.dateOfBirth);

      if (isNaN(birthDate.getTime())) {
        throw new Error('Data de nascimento inválida');
      }

      const password = birthDate
        .toISOString()
        .split('T')[0]
        .split('-')
        .reverse()
        .join('');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Cria o usuário antes do idoso
      const user = await tx.user.create({
        data: {
          login: data.cpf,
          name: data.name,
          password: hashedPassword,
          userType: UserType.USER,
        },
      });
      const elderly = await tx.elderly.create({
        data: {
          cpf: data.cpf,
          name: data.name,
          dateOfBirth: birthDate,
          phone: data.phone,
          sex: data.sex,
          weight: data.weight,
          height: data.height,
          imc: data.imc,
          addressId: address.id,
          userId: user.id,
        },
      });

      for (const contact of data.contacts) {
        if (!contact.address) {
          throw new Error('Contact address is required');
        }
        const address = await this.addressService.create(contact.address);
        const newContact = await this.contactService.create({
          ...contact,
          addressId: address.id,
        });
        await this.prisma.elderlyContact.create({
          data: { elderlyId: elderly.id, contactId: newContact.id },
        });
      }

      return { elderly, user };
    });
  }

  async findAll(search?: string) {
    return this.prisma.elderly.findMany({
      where: search
        ? {
            OR: [{ name: { contains: search } }, { cpf: { contains: search } }],
          }
        : undefined,
      include: { user: true, contacts: true, address: true },
    });
  }

  async findOne(id: string) {
    const elderly = await this.prisma.elderly.findUnique({
      where: { id },
      include: {
        address: true,
        contacts: { include: { contact: { include: { address: true } } } },
        user: true,
      },
    });

    if (!elderly) {
      throw new NotFoundException(`Idoso com o ID ${id} não encontrado.`);
    }

    return elderly;
  }

  async update(id: string, data: UpdateElderlyDto) {
    const existingElderly = await this.prisma.elderly.findUnique({
      where: { id },
      include: { contacts: true },
    });

    if (!existingElderly) {
      throw new NotFoundException(`Idoso com ID ${id} não encontrado.`);
    }

    if (data.contacts && data.contacts.length > 0) {
      for (const contact of data.contacts) {
        if (!contact.cpf) {
          throw new Error('CPF do contato é obrigatório');
        }
        await this.contactService.update(contact.cpf, contact);
      }
    }

    return this.prisma.elderly.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        sex: data.sex,
        weight: data.weight,
        height: data.height,
        imc: data.imc,
        address: {
          update: {
            street: data.address?.street,
            number: data.address?.number,
            complement: data.address?.complement,
            neighborhood: data.address?.neighborhood,
            city: data.address?.city,
            state: data.address?.state,
            zipCode: data.address?.zipCode,
          },
        },
      },
      include: { contacts: true },
    });
  }

  async delete(id: string) {
    const elderly = await this.findOne(id);

    await this.prisma.elderlyContact.deleteMany({ where: { elderlyId: id } });

    await this.prisma.elderly.delete({ where: { id } });

    await this.userService.delete(elderly.userId);

    return { message: 'Elderly deleted successfully' };
  }
}
