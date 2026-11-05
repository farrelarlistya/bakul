/**
 * Nomor akun seed memakai awalan 0812000000 (lihat `prisma/seed.ts`).
 * Nomor fiktif ini tidak bisa menerima WhatsApp, jadi selama DEMO_MODE aktif
 * kode masuknya selalu 123456 meskipun OTP_DELIVERY=whatsapp.
 */
const SEED_PHONE_PREFIX = "0812000000";

export const DEMO_OTP_CODE = "123456";

export function isSeedDemoPhone(phone: string): boolean {
  return phone.startsWith(SEED_PHONE_PREFIX);
}
