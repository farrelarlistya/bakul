import { Logger } from "@nestjs/common";
import type { Notifier, NotifyInput } from "@bakul/shared";
import { buildWhatsAppMessage, maskPhone } from "./notifier.utils";

export type FonnteNotifierOptions = {
  token: string;
  apiUrl?: string;
  timeoutMs?: number;
};

type FonnteResponse = {
  status?: boolean | string;
  reason?: string;
  detail?: string;
  id?: unknown;
};

/**
 * Adapter WhatsApp lewat Fonnte. Token hanya hidup di env; kode OTP tidak
 * pernah ditulis ke log.
 */
export class FonnteNotifier implements Notifier {
  private readonly logger = new Logger(FonnteNotifier.name);
  private readonly token: string;
  private readonly apiUrl: string;
  private readonly timeoutMs: number;

  constructor(options: FonnteNotifierOptions) {
    this.token = options.token;
    this.apiUrl = options.apiUrl ?? "https://api.fonnte.com/send";
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async send(input: NotifyInput): Promise<void> {
    if (input.channel !== "WHATSAPP") {
      throw new Error(`Fonnte hanya mendukung kanal WHATSAPP, bukan ${input.channel}.`);
    }

    const message = buildWhatsAppMessage(input.template, input.data);
    const body = new URLSearchParams({
      target: input.to,
      message,
      countryCode: "62",
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: this.token,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as FonnteResponse | null;
      const accepted =
        response.ok && (payload?.status === true || payload?.status === "true");

      if (!accepted) {
        const reason = payload?.reason ?? payload?.detail ?? `HTTP ${response.status}`;
        throw new Error(`Fonnte menolak pesan: ${reason}`);
      }

      const id = Array.isArray(payload?.id) ? payload.id.join(", ") : payload?.id;
      this.logger.log(
        `[NOTIF] WHATSAPP ${maskPhone(input.to)} ${input.template} terkirim${
          id ? ` (${String(id)})` : ""
        }`,
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Fonnte tidak menjawab dalam ${this.timeoutMs / 1000} detik.`);
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
