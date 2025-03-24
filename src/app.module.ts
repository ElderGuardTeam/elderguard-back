import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ElderlyModule } from './elderly/elderly.module';

@Module({
  imports: [DatabaseModule, ElderlyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
