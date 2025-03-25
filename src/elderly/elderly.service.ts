import { Injectable, NotFoundException } from '@nestjs/common';
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
    // Criar endereço
    const address = await this.addressService.create(data.address);

    // Criar usuário para o idoso (CPF como login, data de nascimento como senha)
    const birthDate = new Date(data.dateOfBirth);

    if (isNaN(birthDate.getTime())) {
      throw new Error('Data de nascimento inválida');
    }

    // Criar senha baseada na data de nascimento (DDMMAAAA)
    const password = birthDate
      .toISOString()
      .split('T')[0]
      .split('-')
      .reverse()
      .join('');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      login: data.cpf,
      password: hashedPassword,
      userType: UserType.USER,
    });

    // Criar idoso no banco
    const elderly = await this.prisma.elderly.create({
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

    // Criar contatos e associá-los ao idoso
    for (const contact of data.contacts) {
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
  }

  async findAll() {
    return this.prisma.elderly.findMany({
      include: {
        address: true,
        contacts: { include: { contact: true } },
        user: true,
      },
    });
  }

  async findOne(id: string) {
    const elderly = await this.prisma.elderly.findUnique({
      where: { id },
      include: {
        address: true,
        contacts: { include: { contact: true } },
        user: true,
      },
    });

    if (!elderly) {
      throw new NotFoundException(`Elderly with ID ${id} not found`);
    }

    return elderly;
  }

  async update(id: string, data: UpdateElderlyDto) {
    const elderly = await this.findOne(id);

    // Atualiza endereço
    if (data.address) {
      await this.addressService.update(elderly.addressId, data.address);
    }

    // Atualiza contatos
    if (data.contacts?.length) {
      await this.prisma.elderlyContact.deleteMany({ where: { elderlyId: id } });

      // for (const contact of data.contacts) {
      //   const updatedContact =
      //     await this.contactService.createOrUpdate(contact);
      //   await this.prisma.elderlyContact.create({
      //     data: { elderlyId: id, contactId: updatedContact.id },
      //   });
      // }
    }

    return this.prisma.elderly.update({
      where: { id },
      data: {
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        sex: data.sex,
        weight: data.weight,
        height: data.height,
        imc: data.imc,
      },
      include: {
        address: true,
        contacts: { include: { contact: true } },
        user: true,
      },
    });
  }

  async delete(id: string) {
    const elderly = await this.findOne(id);

    // Excluir contatos associados
    await this.prisma.elderlyContact.deleteMany({ where: { elderlyId: id } });

    // Excluir usuário associado
    await this.userService.delete(elderly.userId);

    // Excluir idoso
    await this.prisma.elderly.delete({ where: { id } });

    return { message: 'Elderly deleted successfully' };
  }
}
