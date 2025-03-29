import { Module } from '@nestjs/common';
import { ProfessionalService } from './professional.service';
import { ProfessionalController } from './professional.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [ProfessionalController],
  providers: [ProfessionalService, PrismaService],
  exports: [ProfessionalService],
})
export class ProfessionalModule {}
