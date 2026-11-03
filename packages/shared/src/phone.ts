import { z } from "zod";

/**
 * Nomor HP Indonesia disimpan dalam bentuk 08xxxxxxxxxx.
 * Menerima 08..., 628..., +628..., atau 8...
 */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("62")) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith("8")) {
    return `0${digits}`;
  }

  return digits;
}

export const phoneSchema = z
  .string()
  .min(1, "Nomor HP wajib diisi.")
  .transform(normalizePhone)
  .refine((value) => /^08\d{8,11}$/.test(value), {
    message: "Nomor HP belum benar. Contoh: 0812-3456-7890.",
  });
