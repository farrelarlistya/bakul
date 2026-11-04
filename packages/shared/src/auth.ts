import { z } from "zod";
import { phoneSchema } from "./phone";

export const USER_ROLES = ["BUYER", "SELLER", "ADMIN", "OPERATOR_DEMO"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type ShopSummary = {
  id: string;
  name: string;
  slug: string;
  cityName: string;
};

export type AuthUser = {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  role: UserRole;
  isVerified: boolean;
  shop: ShopSummary | null;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type OtpDelivery = "demo" | "whatsapp";

export type OtpRequestResult = {
  phone: string;
  expiresAt: string;
  existing: boolean;
  delivery: OtpDelivery;
  demoCode?: string;
};

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Kode harus 6 angka."),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 huruf.").max(120).optional(),
    email: z
      .string()
      .trim()
      .email("Format email belum benar.")
      .max(190)
      .nullable()
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Isi setidaknya satu bagian.",
  });

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type NotificationItem = {
  id: string;
  template: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};
