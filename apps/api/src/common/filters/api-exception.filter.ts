import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";

const CODE_BY_STATUS: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    let code = CODE_BY_STATUS[status] ?? "ERROR";
    let message = "Terjadi kesalahan. Coba lagi.";
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      const body = exception.getResponse();

      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object") {
        const record = body as Record<string, unknown>;
        if (typeof record.code === "string") {
          code = record.code;
        }
        if (Array.isArray(record.details)) {
          details = record.details;
        }
        if (Array.isArray(record.message)) {
          message = record.message.join(" ");
        } else if (typeof record.message === "string") {
          message = record.message;
        } else if (typeof record.error === "string") {
          message = record.error;
        }
      }
    }

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack ?? exception.message : String(exception),
      );
      message = "Terjadi kesalahan. Coba lagi.";
      details = [];
    }

    response.status(status).json({ error: { code, message, details } });
  }
}
