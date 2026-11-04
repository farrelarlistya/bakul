const REQUIRED = ["DATABASE_URL", "AUTH_JWT_ACCESS_SECRET", "OTP_PEPPER", "MOCK_PG_SECRET"];

function readString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  for (const key of REQUIRED) {
    const value = config[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(
        `${key} belum diisi. Salin .env.example menjadi .env lalu lengkapi nilainya.`,
      );
    }
  }

  const demoMode = readString(config, "DEMO_MODE") === "true";
  const otpDelivery = readString(config, "OTP_DELIVERY") ?? (demoMode ? "demo" : "whatsapp");

  if (otpDelivery !== "demo" && otpDelivery !== "whatsapp") {
    throw new Error("OTP_DELIVERY harus 'demo' atau 'whatsapp'.");
  }

  const notifier = readString(config, "NOTIFIER_PROVIDER") ?? "mock";

  if (notifier !== "mock" && notifier !== "fonnte") {
    throw new Error("NOTIFIER_PROVIDER harus 'mock' atau 'fonnte'.");
  }

  if (otpDelivery === "whatsapp" && notifier !== "fonnte") {
    throw new Error(
      "OTP_DELIVERY=whatsapp membutuhkan NOTIFIER_PROVIDER=fonnte dan FONNTE_TOKEN di .env.",
    );
  }

  if (notifier === "fonnte" && !readString(config, "FONNTE_TOKEN")) {
    throw new Error(
      "FONNTE_TOKEN belum diisi. Salin token perangkat Fonnte ke .env, lalu jalankan ulang API.",
    );
  }

  return config;
}
