import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type {
  AuthSession,
  AuthUser,
  Notifier,
  OtpRequestResult,
  UserRole,
} from "@bakul/shared";
import { createHmac, randomInt } from "node:crypto";
import type { Request, Response } from "express";
import { ClockService } from "../common/clock/clock.service";
import {
  clearRefreshCookie,
  hashToken,
  newRefreshToken,
  readCookie,
  REFRESH_COOKIE,
  setRefreshCookie,
} from "../common/http/cookies";
import { NOTIFIER } from "../notifications/notifier.token";
import { maskPhone } from "../notifications/notifier.utils";
import { PrismaService } from "../prisma/prisma.service";
import { DEMO_OTP_CODE, isSeedDemoPhone } from "./demo-accounts";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_WINDOW_MS = 10 * 60 * 1000;
const OTP_MAX_REQUESTS = 3;
const OTP_MAX_ATTEMPTS = 5;
const ACCESS_TTL_SECONDS = 15 * 60;

type UserWithShop = {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  role: UserRole;
  isVerified: boolean;
  shop: { id: string; name: string; slug: string; cityName: string } | null;
};

export function toAuthUser(user: UserWithShop): AuthUser {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    role: user.role,
    isVerified: user.isVerified,
    shop: user.shop
      ? {
          id: user.shop.id,
          name: user.shop.name,
          slug: user.shop.slug,
          cityName: user.shop.cityName,
        }
      : null,
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly clock: ClockService,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
  ) {}

  async requestOtp(phone: string, purpose: "REGISTER" | "LOGIN"): Promise<OtpRequestResult> {
    const now = this.clock.now();
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (purpose === "LOGIN" && !user) {
      throw new NotFoundException({
        code: "PHONE_NOT_FOUND",
        message: "Nomor ini belum terdaftar. Daftar dulu, ya.",
      });
    }

    const recent = await this.prisma.otpCode.count({
      where: {
        phone,
        createdAt: { gte: new Date(now.getTime() - OTP_WINDOW_MS) },
      },
    });

    if (recent >= OTP_MAX_REQUESTS) {
      throw new BadRequestException({
        code: "OTP_RATE_LIMITED",
        message: "Terlalu banyak permintaan kode. Tunggu 10 menit lalu coba lagi.",
      });
    }

    await this.prisma.otpCode.updateMany({
      where: { phone, consumedAt: null },
      data: { consumedAt: now },
    });

    const demoMode = this.config.get<string>("DEMO_MODE") === "true";
    const seedDemoAccount = demoMode && isSeedDemoPhone(phone);
    const otpDelivery = seedDemoAccount
      ? "demo"
      : (this.config.get<string>("OTP_DELIVERY") ?? (demoMode ? "demo" : "whatsapp"));
    const realDelivery = otpDelivery === "whatsapp";
    const code = realDelivery
      ? randomInt(0, 1_000_000).toString().padStart(6, "0")
      : DEMO_OTP_CODE;
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    const otp = await this.prisma.otpCode.create({
      data: {
        phone,
        purpose,
        codeHash: this.hashOtp(phone, code),
        expiresAt,
      },
    });

    if (realDelivery) {
      try {
        await this.notifier.send({
          channel: "WHATSAPP",
          to: phone,
          template: "OTP",
          data: { code, ttlMinutes: OTP_TTL_MS / 60_000 },
        });
      } catch (error) {
        await this.prisma.otpCode.delete({ where: { id: otp.id } }).catch((deleteError: unknown) => {
          this.logger.warn(
            `OTP ${maskPhone(phone)} gagal dihapus setelah pengiriman gagal: ${
              deleteError instanceof Error ? deleteError.message : String(deleteError)
            }`,
          );
        });
        this.logger.warn(
          `[NOTIF] WHATSAPP ${maskPhone(phone)} OTP gagal: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        throw new BadRequestException({
          code: "OTP_DELIVERY_FAILED",
          message: "Kode belum terkirim ke WhatsApp. Periksa koneksi internet lalu coba lagi.",
        });
      }
    }

    if (user) {
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          template: "OTP",
          payload: {
            phone,
            ...(realDelivery ? {} : { code }),
            message: realDelivery
              ? "Kode masuk sudah dikirim ke WhatsApp kamu. Jangan bagikan kodenya."
              : "Kode masuk Bakul kamu sudah dibuat. Jangan bagikan kodenya.",
          },
        },
      });
      this.logger.log(`[NOTIF] IN_APP ${maskPhone(phone)} OTP`);
    }

    return {
      phone,
      expiresAt: expiresAt.toISOString(),
      existing: Boolean(user),
      delivery: realDelivery ? "whatsapp" : "demo",
      ...(realDelivery ? {} : { demoCode: code }),
    };
  }

  async verifyOtp(phone: string, code: string, response: Response): Promise<AuthSession> {
    const now = this.clock.now();
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      throw new BadRequestException({
        code: "OTP_EXPIRED",
        message: "Kode sudah kedaluwarsa. Minta kode baru.",
      });
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException({
        code: "OTP_ATTEMPTS_EXCEEDED",
        message: "Terlalu banyak percobaan. Minta kode baru.",
      });
    }

    if (this.hashOtp(phone, code) !== otp.codeHash) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException({
        code: "OTP_INVALID",
        message: "Kode tidak cocok. Periksa lagi.",
      });
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: now },
    });

    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: { shop: true },
    });

    if (!user) {
      if (otp.purpose !== "REGISTER") {
        throw new NotFoundException({
          code: "PHONE_NOT_FOUND",
          message: "Nomor ini belum terdaftar. Daftar dulu, ya.",
        });
      }

      user = await this.prisma.user.create({
        data: {
          phone,
          name: "Pengguna Bakul",
          role: "BUYER",
          isVerified: true,
        },
        include: { shop: true },
      });

      await this.prisma.notification.create({
        data: {
          userId: user.id,
          template: "WELCOME",
          payload: {
            message: "Selamat datang di Bakul. Uang aman sampai barang diterima.",
          },
        },
      });
    } else if (!user.isVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
        include: { shop: true },
      });
    }

    if (user.role === "OPERATOR_DEMO" && this.config.get<string>("DEMO_MODE") !== "true") {
      throw new ForbiddenException({
        code: "DEMO_ONLY",
        message: "Akun operator hanya aktif saat mode demo.",
      });
    }

    return this.issueSession(user, response);
  }

  async refresh(request: Request, response: Response): Promise<AuthSession> {
    const token = readCookie(request, REFRESH_COOKIE);
    if (!token) {
      clearRefreshCookie(response);
      throw new UnauthorizedException({
        code: "REFRESH_MISSING",
        message: "Sesi tidak ditemukan. Masuk lagi.",
      });
    }

    const now = this.clock.now();
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hashToken(token) },
      include: { user: { include: { shop: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt <= now) {
      clearRefreshCookie(response);
      throw new UnauthorizedException({
        code: "REFRESH_EXPIRED",
        message: "Sesi sudah berakhir. Masuk lagi.",
      });
    }

    if (
      session.user.role === "OPERATOR_DEMO" &&
      this.config.get<string>("DEMO_MODE") !== "true"
    ) {
      clearRefreshCookie(response);
      throw new ForbiddenException({
        code: "DEMO_ONLY",
        message: "Akun operator hanya aktif saat mode demo.",
      });
    }

    const refreshDays = this.refreshDays();
    const nextToken = newRefreshToken();
    const expiresAt = new Date(now.getTime() + refreshDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: now, lastUsedAt: now },
      }),
      this.prisma.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash: hashToken(nextToken),
          expiresAt,
        },
      }),
    ]);

    setRefreshCookie(response, nextToken, refreshDays * 24 * 60 * 60 * 1000);

    const accessToken = await this.signAccessToken(session.user.id, session.user.role);

    return {
      accessToken,
      user: toAuthUser(session.user),
    };
  }

  async logout(request: Request, response: Response): Promise<{ ok: true }> {
    const token = readCookie(request, REFRESH_COOKIE);

    if (token) {
      await this.prisma.session.updateMany({
        where: { refreshTokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: this.clock.now() },
      });
    }

    clearRefreshCookie(response);
    return { ok: true };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Akun tidak ditemukan.",
      });
    }

    return toAuthUser(user);
  }

  async updateMe(
    userId: string,
    input: { name?: string; email?: string | null },
  ): Promise<AuthUser> {
    if (input.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: input.email, NOT: { id: userId } },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException({
          code: "EMAIL_TAKEN",
          message: "Email ini sudah dipakai akun lain.",
        });
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
      },
      include: { shop: true },
    });

    return toAuthUser(user);
  }

  private async issueSession(user: UserWithShop, response: Response): Promise<AuthSession> {
    const refreshDays = this.refreshDays();
    const refreshToken = newRefreshToken();
    const expiresAt = new Date(
      this.clock.now().getTime() + refreshDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    setRefreshCookie(response, refreshToken, refreshDays * 24 * 60 * 60 * 1000);

    return {
      accessToken: await this.signAccessToken(user.id, user.role),
      user: toAuthUser(user),
    };
  }

  private signAccessToken(userId: string, role: UserRole): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, role },
      { expiresIn: ACCESS_TTL_SECONDS, issuer: "bakul", audience: "bakul-web" },
    );
  }

  private hashOtp(phone: string, code: string): string {
    return createHmac("sha256", this.config.getOrThrow<string>("OTP_PEPPER"))
      .update(`${phone}:${code}`)
      .digest("hex");
  }

  private refreshDays(): number {
    const value = Number(this.config.get<string>("AUTH_REFRESH_DAYS") ?? "7");
    return Number.isFinite(value) && value > 0 ? value : 7;
  }
}
