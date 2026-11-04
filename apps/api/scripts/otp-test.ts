import { config } from "dotenv";
import { normalizePhone } from "@bakul/shared";
import { FonnteNotifier } from "../src/notifications/fonnte.notifier";
import { maskPhone } from "../src/notifications/notifier.utils";

config({ path: "../../.env", quiet: true });
config({ quiet: true });

async function main(): Promise<void> {
  const raw = process.argv[2];

  if (!raw) {
    console.error("Pakai: npm run otp:test -- 08xxxxxxxxxx");
    process.exitCode = 1;
    return;
  }

  const phone = normalizePhone(raw);

  if (!/^08\d{8,11}$/.test(phone)) {
    console.error("Nomor HP belum benar. Contoh: 0812-3456-7890.");
    process.exitCode = 1;
    return;
  }

  const token = process.env["FONNTE_TOKEN"]?.trim();

  if (!token) {
    console.error("FONNTE_TOKEN belum diisi di .env.");
    process.exitCode = 1;
    return;
  }

  const apiUrl = process.env["FONNTE_API_URL"]?.trim() || undefined;
  const notifier = new FonnteNotifier({ token, apiUrl });

  console.log(`Mengirim pesan uji ke ${maskPhone(phone)} lewat WhatsApp...`);

  try {
    await notifier.send({
      channel: "WHATSAPP",
      to: phone,
      template: "OTP_TEST",
      data: {},
    });
    console.log("Pesan uji terkirim. Cek WhatsApp di nomor itu.");
  } catch (error) {
    console.error(
      `Gagal mengirim: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}

void main();
