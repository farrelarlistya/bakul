import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@bakul/shared";
import type { Request } from "express";
import { ROLES_KEY } from "./roles.decorator";
import type { AuthRequestUser } from "./auth-user.type";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthRequestUser }>();

    if (!request.user) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Silakan masuk dulu.",
      });
    }

    if (!required.includes(request.user.role)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Kamu tidak punya akses ke halaman ini.",
      });
    }

    return true;
  }
}
