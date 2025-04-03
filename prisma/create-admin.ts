import { PrismaClient, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      login: 'admin',
      password: hashedPassword, // Armazena a senha com hash
      userType: UserType.ADMIN,
      name: 'Admin',
      mustChangePassword: false,
    },
  });

  console.log('Usuário ADMIN criado:', adminUser);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
