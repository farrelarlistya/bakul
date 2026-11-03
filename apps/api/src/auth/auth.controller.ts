import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  requestOtpSchema,
  verifyOtpSchema,
  type AuthSession,
  type OtpRequestResult,
  type RequestOtpInput,
  type VerifyOtpInput,
} from "@bakul/shared";
import type { Request, Response } from "express";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Minta kode masuk untuk nomor baru atau yang sudah ada" })
  @ApiBody({
    schema: {
      example: { phone: "0812-3456-7890" },
    },
  })
  register(
    @Body(new ZodValidationPipe(requestOtpSchema)) body: RequestOtpInput,
  ): Promise<OtpRequestResult> {
    return this.auth.requestOtp(body.phone, "REGISTER");
  }

  @Post("login")
  @ApiOperation({ summary: "Minta kode masuk untuk nomor terdaftar" })
  @ApiBody({
    schema: {
      example: { phone: "0812-3456-7890" },
    },
  })
  login(@Body(new ZodValidationPipe(requestOtpSchema)) body: RequestOtpInput): Promise<OtpRequestResult> {
    return this.auth.requestOtp(body.phone, "LOGIN");
  }

  @Post("verify-otp")
  @HttpCode(200)
  @ApiOperation({ summary: "Verifikasi kode 6 angka dan buat sesi" })
  @ApiBody({
    schema: {
      example: { phone: "0812-3456-7890", code: "123456" },
    },
  })
  verifyOtp(
    @Body(new ZodValidationPipe(verifyOtpSchema)) body: VerifyOtpInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    return this.auth.verifyOtp(body.phone, body.code, response);
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Perbarui access token dari cookie refresh" })
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    return this.auth.refresh(request, response);
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "Cabut sesi dan hapus cookie refresh" })
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    return this.auth.logout(request, response);
  }
}
