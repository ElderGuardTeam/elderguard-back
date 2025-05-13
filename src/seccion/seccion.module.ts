import { Module } from '@nestjs/common';
import { SeccionService } from './seccion.service';
import { SeccionController } from './seccion.controller';
import { PrismaService } from 'src/database/prisma.service';
import { RuleModule } from 'src/rule/rule.module';

@Module({
  imports: [RuleModule],
  controllers: [SeccionController],
  providers: [SeccionService, PrismaService],
  exports: [SeccionService],
})
export class SeccionModule {}
