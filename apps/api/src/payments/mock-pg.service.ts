import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  ChargeResult,
  CreateChargeInput,
  PaymentProvider,
  RefundResult,
  WebhookEvent,
} from "@bakul/shared";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const VA_PREFIX: Record<string, { prefix: string; length: number }> = {
  VA_BCA: { prefix: "8808", length: 14 },
  VA_MANDIRI: { prefix: "89508", length: 15 },
  VA_BNI: { prefix: "8810", length: 14 },
  VA_BRI: { prefix: "8899", length: 14 },
};

@Injectable()
export class MockPgService implements PaymentProvider {
  private readonly logger = new Logger(MockPgService.name);

  constructor(private readonly config: ConfigService) {}

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    if (input.method === "QRIS") {
      return {
        providerRef: `chg_${randomBytes(6).toString("hex")}`,
        paymentCode: `QRIS${randomInt(100000, 999999)}`,
        expiresAt: input.expiresAt,
      };
    }

    const format = VA_PREFIX[input.method] ?? VA_PREFIX["VA_BCA"]!;
    let code = format.prefix;
    while (code.length < format.length) {
      code += String(randomInt(0, 10));
    }

    return {
      providerRef: `chg_${randomBytes(6).toString("hex")}`,
      paymentCode: code,
      expiresAt: input.expiresAt,
    };
  }

  sign(rawBody: string, timestamp = Math.floor(Date.now() / 1000)): string {
    const secret = this.secret();
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    return `t=${timestamp},v1=${signature}`;
  }

  verifyWebhook(
    rawBody: string,
    headers: Record<string, string> | string | undefined,
  ): WebhookEvent {
    const header =
      typeof headers === "string"
        ? headers
        : headers?.["x-mock-signature"] ?? headers?.["X-Mock-Signature"];

    if (!header) {
      throw new UnauthorizedException({
        code: "WEBHOOK_SIGNATURE_MISSING",
        message: "Tanda tangan webhook tidak ada.",
      });
    }

    const parts = new Map(
      header.split(",").map((part) => {
        const [key, value] = part.trim().split("=");
        return [key ?? "", value ?? ""];
      }),
    );
    const timestamp = parts.get("t");
    const provided = parts.get("v1");

    if (!timestamp || !provided) {
      throw new UnauthorizedException({
        code: "WEBHOOK_SIGNATURE_INVALID",
        message: "Tanda tangan webhook tidak cocok.",
      });
    }

    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (!Number.isFinite(age) || age > 10 * 60) {
      throw new UnauthorizedException({
        code: "WEBHOOK_SIGNATURE_EXPIRED",
        message: "Tanda tangan webhook sudah kedaluwarsa.",
      });
    }

    const expected = createHmac("sha256", this.secret())
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const left = Buffer.from(expected, "hex");
    const right = Buffer.from(provided, "hex");
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      throw new UnauthorizedException({
        code: "WEBHOOK_SIGNATURE_INVALID",
        message: "Tanda tangan webhook tidak cocok.",
      });
    }

    return JSON.parse(rawBody) as WebhookEvent;
  }

  async refund(chargeId: string, amount: number): Promise<RefundResult> {
    return {
      providerRef: `refund_${chargeId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}_${randomBytes(3).toString("hex")}`,
      amount,
      status: "REFUNDED",
    };
  }

  dispatch(event: WebhookEvent): void {    const body = JSON.stringify(event);
    const signature = this.sign(body);
    const host = process.env["API_HOST"] ?? "127.0.0.1";
    const port = process.env["API_PORT"] ?? "3001";
    const url = `http://${host}:${port}/api/v1/webhooks/payments`;

    setTimeout(() => {
      void fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Mock-Signature": signature,
        },
        body,
      })
        .then((response) => {
          if (!response.ok) {
            this.logger.warn(`Webhook ${event.event} ditolak: HTTP ${response.status}`);
          }
        })
        .catch((error: unknown) => {
          this.logger.warn(
            `Webhook ${event.event} gagal dikirim: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        });
    }, 1_200);
  }

  buildEvent(
    event: string,
    payment: { providerRef: string; totalAmount: number },
    now: Date,
  ): WebhookEvent {
    return {
      eventId: `evt_${randomBytes(8).toString("hex")}`,
      event,
      chargeId: payment.providerRef,
      paidAmount: event === "payment.paid" ? payment.totalAmount : 0,
      paidAt: now.toISOString(),
    };
  }

  private secret(): string {
    const secret = this.config.get<string>("MOCK_PG_SECRET");
    if (!secret) {
      throw new Error("MOCK_PG_SECRET belum diisi di .env.");
    }
    return secret;
  }
}
