import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { UserRole } from "@bakul/shared";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthRequestUser } from "./auth-user.type";

type AccessPayload = {
  sub: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthRequestUser }>();
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Silakan masuk dulu.",
      });
    }

    let payload: AccessPayload;

    try {
      payload = await this.jwt.verifyAsync<AccessPayload>(header.slice(7), {
        issuer: "bakul",
        audience: "bakul-web",
      });
    } catch {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Sesi sudah berakhir. Masuk lagi.",
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Akun tidak ditemukan. Masuk lagi.",
      });
    }

    if (user.role === "OPERATOR_DEMO" && process.env["DEMO_MODE"] !== "true") {
      throw new ForbiddenException({
        code: "DEMO_ONLY",
        message: "Akun operator hanya aktif saat mode demo.",
      });
    }

    request.user = { id: user.id, role: user.role as UserRole };
    return true;
  }
}
