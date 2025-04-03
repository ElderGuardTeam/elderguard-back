import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserType[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true; // Se não tiver restrição, libera acesso.

    const request = context.switchToHttp().getRequest();
    const user = request.user; // O usuário autenticado

    console.log('Usuário autenticado:', user);
    console.log('Roles necessárias:', requiredRoles);

    if (!user || !requiredRoles.includes(user.userType)) {
      throw new ForbiddenException('Acesso negado.');
    }

    return true;
  }
}
