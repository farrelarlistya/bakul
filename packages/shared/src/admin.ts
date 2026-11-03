import { z } from "zod";

export type AdminMetrics = {
  gmv: number;
  escrowHeld: number;
  revenue: number;
  orderCount: number;
  completedOrders: number;
  activeShops: number;
  activeProducts: number;
  waitingSeller: number;
  delivered: number;
  openDisputes: number;
  pendingWithdrawals: number;
  ordersByStatus: { status: string; count: number }[];
  recentOrders: {
    id: string;
    invoiceNumber: string;
    shopName: string;
    buyerName: string;
    totalAmount: number;
    orderStatus: string;
    createdAt: string;
  }[];
};

export type AdminDisputeItem = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  shopName: string;
  buyerName: string;
  totalAmount: number;
  status: string;
  reason: string;
  requestedSolution: string;
  createdAt: string;
};

export const adminShopStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  note: z.string().trim().max(500).optional(),
});

export type AdminShopStatusInput = z.infer<typeof adminShopStatusSchema>;

export const adminWithdrawalDecisionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(500).optional(),
});

export const adminWithdrawalNoteSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export type AdminWithdrawalNoteInput = z.infer<typeof adminWithdrawalNoteSchema>;

export type AdminWithdrawalDecisionInput = z.infer<typeof adminWithdrawalDecisionSchema>;

export type AdminShopRow = {
  id: string;
  name: string;
  slug: string;
  cityName: string;
  status: string;
  productCount: number;
  balanceAvailable: number;
  ownerName: string;
  ownerPhone: string;
  createdAt: string;
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  shopName: string;
  status: string;
  price: number;
  stock: number;
  createdAt: string;
};
