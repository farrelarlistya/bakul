import { z } from "zod";
import { phoneSchema } from "./phone";

export const addressInputSchema = z.object({
  label: z.string().trim().min(1, "Nama alamat wajib diisi.").max(40),
  recipientName: z.string().trim().min(2, "Nama penerima minimal 2 huruf.").max(120),
  phone: phoneSchema,
  provinceId: z.string().trim().min(1).max(10),
  cityId: z.string().trim().min(1).max(10),
  districtId: z.string().trim().min(1).max(10),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Kode pos harus 5 angka."),
  fullAddress: z.string().trim().min(8, "Alamat lengkap minimal 8 huruf.").max(500),
  isDefault: z.boolean().optional(),
});

export const addressUpdateSchema = addressInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Isi setidaknya satu bagian alamat.",
  });

export type AddressInput = z.infer<typeof addressInputSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;

export type Address = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  districtId: string;
  postalCode: string;
  fullAddress: string;
  isDefault: boolean;
};
