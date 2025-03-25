/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        cpf: data.cpf,
        name: data.name,
        email: data.email,
        phone: data.phone,
        addressId: data.addressId,
      },
    });
  }

//   async createOrUpdate(data: CreateContactDto) {
//     return this.prisma.contact.upsert({
//       where: { cpf: data.cpf },
//       update: {
//         cpf: data.cpf,
//         name: data.name,
//         email: data.email,
//         phone: data.phone,
//         address: data.address
//           ? { connect: { id: data.address.id } }
//           : undefined,
//       },
//       create: {
//         cpf: data.cpf,
//         name: data.name,
//         email: data.email,
//         phone: data.phone,
//         address: data.address
//           ? { connect: { id: data.address.id } }
//           : undefined,
//       },
//     });
//   }
}
