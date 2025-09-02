import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Questões')
@ApiBearerAuth('JWT-auth')
@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova questão' })
  @ApiResponse({ status: 201, description: 'Questão criada com sucesso.' })
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionService.create(createQuestionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as questões' })
  @ApiResponse({ status: 200, description: 'Lista de questões retornada.' })
  findAll(@Query('search') search?: string) {
    return this.questionService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma questão pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da questão' })
  @ApiResponse({ status: 200, description: 'Questão encontrada.' })
  @ApiResponse({ status: 404, description: 'Questão não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.questionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma questão pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da questão' })
  @ApiResponse({ status: 200, description: 'Questão atualizada.' })
  @ApiResponse({ status: 404, description: 'Questão não encontrada.' })
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma questão pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da questão' })
  @ApiResponse({ status: 200, description: 'Questão removida.' })
  @ApiResponse({ status: 404, description: 'Questão não encontrada.' })
  remove(@Param('id') id: string) {
    return this.questionService.remove(id);
  }
}
