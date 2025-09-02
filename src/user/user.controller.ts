import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Usuários')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'O usuário foi criado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 409,
    description: 'Conflito, email já cadastrado.',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // @Get()
  // @ApiOperation({ summary: 'Lista todos os usuários' })
  // @ApiResponse({ status: 200, description: 'Lista de usuários retornada.' })
  // @ApiResponse({ status: 401, description: 'Não autorizado.' })
  // findAll() {
  //   return this.userService.findAll();
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Busca um usuário pelo ID' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID numérico do usuário',
  //   example: 1,
  // })
  // @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
  // @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  // @ApiResponse({ status: 401, description: 'Não autorizado.' })
  // findOne(@Param('id') id: string) {
  //   return this.userService.findOne(+id);
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Atualiza um usuário pelo ID' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID do usuário a ser atualizado',
  //   example: 1,
  // })
  // @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  // @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  // @ApiResponse({ status: 401, description: 'Não autorizado.' })
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Remove um usuário pelo ID' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID do usuário a ser removido',
  //   example: 1,
  // })
  // @ApiResponse({ status: 200, description: 'Usuário removido com sucesso.' })
  // @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  // @ApiResponse({ status: 401, description: 'Não autorizado.' })
  // remove(@Param('id') id: string) {
  //   return this.userService.remove(+id);
  // }
}
