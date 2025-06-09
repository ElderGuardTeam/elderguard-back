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
import { ValidateElderlyDto } from './dto/validate-elderly.dto';

@Injectable()
export class ElderlyService {
  constructor(
    private prisma: PrismaService,
    private addressService: AddressService,
    private contactService: ContactService,
    private userService: UserService,
  ) {}

  async create(data: CreateElderlyDto) {
    const sanitizedData = {
      ...data,
      cpf: data.cpf.replace(/\D/g, ''),
      phone: data.phone.replace(/\D/g, ''),
    };

    const address = await this.addressService.create(sanitizedData.address);

    const birthDate = new Date(sanitizedData.dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      throw new BadRequestException('Data de nascimento inválida.');
    }

    const contactsWithAddresses = await Promise.all(
      sanitizedData.contacts.map(async (contact) => {
        if (!contact.address) {
          throw new BadRequestException('Endereço do contato é obrigatório.');
        }
        const contactAddress = await this.addressService.create(
          contact.address,
        );
        return { ...contact, addressId: contactAddress.id };
      }),
    );

    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { login: sanitizedData.cpf },
      });
      if (existingUser) {
        throw new BadRequestException('Este CPF já está cadastrado.');
      }

      const hashedPassword = await bcrypt.hash(sanitizedData.cpf, 10);

      const user = await tx.user.create({
        data: {
          login: sanitizedData.cpf,
          name: sanitizedData.name,
          email: sanitizedData.email,
          password: hashedPassword,
          userType: UserType.USER,
        },
      });

      const elderly = await tx.elderly.create({
        data: {
          cpf: sanitizedData.cpf,
          name: sanitizedData.name,
          email: sanitizedData.email,
          dateOfBirth: birthDate,
          phone: sanitizedData.phone,
          sex: sanitizedData.sex,
          weight: sanitizedData.weight,
          height: sanitizedData.height,
          imc: sanitizedData.imc,
          education: sanitizedData.education,
          socialeconomic: sanitizedData.socialeconomic,
          addressId: address.id,
          userId: user.id,
        },
      });

      for (const contact of contactsWithAddresses) {
        let newContact = await tx.contact.findUnique({
          where: { cpf: contact.cpf },
        });

        if (!newContact) {
          newContact = await tx.contact.create({
            data: {
              ...contact,
              addressId: contact.addressId,
              address: undefined,
            },
          });
        }

        await tx.elderlyContact.create({
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
    const birthDate = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;

    if (data.contacts && data.contacts.length > 0) {
      for (const contact of data.contacts) {
        if (!contact.cpf) {
          throw new BadRequestException('CPF do contato é obrigatório.');
        }
        await this.contactService.update(contact.cpf, contact);
      }
    }

    return this.prisma.elderly.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        dateOfBirth: birthDate,
        sex: data.sex,
        weight: data.weight,
        height: data.height,
        imc: data.imc,
        education: data.education,
        socialeconomic: data.socialeconomic,
        address: {
          update: {
            street: data.address?.street,
            number: data.address?.number,
            complement: data.address?.complement,
            neighborhood: data.address?.neighborhood,
            city: data.address?.city?.replace(/\D/g, '') ?? '',
            state: data.address?.state,
            zipCode: data.address?.zipCode,
          },
        },
      },
      include: { contacts: true },
    });
  }

  async delete(id: string) {
    const elderlyData = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.elderlyContact.deleteMany({ where: { elderlyId: id } });

      await tx.elderly.delete({ where: { id } });

      await this.userService.delete(elderlyData.userId);

      return { message: 'Idoso excluído com sucesso.' };
    });
  }

  async validateIdentity(data: ValidateElderlyDto) {
    const elderly = await this.prisma.elderly.findFirst({
      where: {
        cpf: data.cpf.replace(/\D/g, ''),
        name: data.name,
        sex: data.sex,
      },
    });

    if (!elderly) {
      throw new NotFoundException(
        'Dados inválidos, por favor verifique se os campos estão corretos',
      );
    }

    return elderly;
  }
}
