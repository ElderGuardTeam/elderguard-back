import { Module } from '@nestjs/common';
import { SeccionService } from './seccion.service';
import { SeccionController } from './seccion.controller';

@Module({
  controllers: [SeccionController],
  providers: [SeccionService],
})
export class SeccionModule {}
