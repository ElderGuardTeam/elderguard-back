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

  async validate(payload: { sub: string; login: string; userType: UserType }) {
    console.log('Payload JWT recebido:', payload);
    return {
      userId: payload.sub,
      login: payload.login,
      userType: payload.userType,
    };
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      console.log('Usuário não encontrado para o ID:', payload.sub);
      throw new UnauthorizedException();
    }
    return user;
  }
}
