const REQUIRED = ["DATABASE_URL", "AUTH_JWT_ACCESS_SECRET", "OTP_PEPPER", "MOCK_PG_SECRET"];

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  for (const key of REQUIRED) {
    const value = config[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(
        `${key} belum diisi. Salin .env.example menjadi .env lalu lengkapi nilainya.`,
      );
    }
  }

  return config;
}
