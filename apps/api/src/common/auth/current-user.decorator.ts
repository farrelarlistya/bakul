import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { AuthRequestUser } from "./auth-user.type";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthRequestUser => {
    const request = context.switchToHttp().getRequest<Request & { user: AuthRequestUser }>();
    return request.user;
  },
);
