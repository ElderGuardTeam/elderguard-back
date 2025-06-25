import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateContactDto) {
    return this.prisma.$transaction(async (tx) => {
      const newAddress = await tx.address.create({
        data: data.address,
      });

      const newContact = await tx.contact.create({
        data: {
          cpf: data.cpf,
          name: data.name,
          email: data.email,
          phone: data.phone,
          addressId: newAddress.id,
        },
      });
      return newContact;
    });
  }

  async update(cpf: string, data: UpdateContactDto) {
    const existingContact = await this.prisma.contact.findUnique({
      where: { cpf },
    });

    if (!existingContact) {
      throw new NotFoundException(`Contato com CPF ${cpf} não encontrado.`);
    }

    return this.prisma.contact.update({
      where: { cpf },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        cpf: data.cpf,
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
    });
  }
}
