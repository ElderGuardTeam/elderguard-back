import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserType } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_KEY,
    });
  }

  // async validate(payload: {
  //   sub: string;
  //   login: string;
  //   userType: UserType;
  //   name: string;
  // }) {
  //   const user = await this.userService.findById(payload.sub);
  //   if (!user) {
  //     console.log('Usuário não encontrado para o ID:', payload.sub);
  //     throw new UnauthorizedException();
  //   }
  //   return user;
  // }

  // A função agora é síncrona, mais rápida e retorna o payload diretamente.
  async validate(payload: {
    sub: string;
    login: string;
    userType: UserType;
    name: string;
    elderlyId?: string; // Adicione elderlyId como opcional
    professionalId?: string; // Adicione professionalId como opcional
  }) {
    // O retorno agora é o próprio payload do token.
    // O Passport.js irá anexar este objeto diretamente ao req.user.
    return payload;
  }
}
