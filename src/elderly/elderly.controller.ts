import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ElderlyService } from './elderly.service';
import { CreateElderlyDto } from './dto/create-elderly.dto';
import { UpdateElderlyDto } from './dto/update-elderly.dto';

@Controller('elderly')
export class ElderlyController {
  constructor(private readonly elderlyService: ElderlyService) {}

  @Post()
  create(@Body() createElderlyDto: CreateElderlyDto) {
    return this.elderlyService.create(createElderlyDto);
  }

  @Get()
  findAll() {
    return this.elderlyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.elderlyService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateElderlyDto: UpdateElderlyDto) {
    return this.elderlyService.update(id, updateElderlyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.elderlyService.delete(id);
  }
}
