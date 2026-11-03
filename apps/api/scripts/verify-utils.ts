import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: "../../.env", quiet: true });
config({ quiet: true });

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL belum diisi.");
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export const BASE = process.env["API_BASE"] ?? "http://127.0.0.1:3001/api/v1";

export type ApiResult<T = unknown> = {
  status: number;
  body: T;
};

export async function api<T = unknown>(
  path: string,
  init: {
    method?: string;
    token?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }
  if (init.body !== undefined && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers,
    body:
      init.body === undefined
        ? undefined
        : init.body instanceof FormData
          ? init.body
          : JSON.stringify(init.body),
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body: body as T };
}

export async function login(phone: string): Promise<{ token: string; name: string }> {
  const otp = await api<{ phone: string; demoCode?: string }>("/auth/login", {
    method: "POST",
    body: { phone },
  });
  if (otp.status !== 201 || !otp.body.demoCode) {
    throw new Error(`OTP gagal untuk ${phone}: ${JSON.stringify(otp.body)}`);
  }

  const verify = await api<{ accessToken: string; user: { name: string } }>(
    "/auth/verify-otp",
    { method: "POST", body: { phone, code: otp.body.demoCode } },
  );
  if (verify.status !== 200) {
    throw new Error(`Verifikasi gagal untuk ${phone}: ${JSON.stringify(verify.body)}`);
  }
  return { token: verify.body.accessToken, name: verify.body.user.name };
}

export async function adminToken(): Promise<string> {
  return (await login("081200000001")).token;
}

export type CartChoice = {
  variantId: string;
  quantity: number;
};

export async function addressId(token: string): Promise<string> {
  const result = await api<{ id: string; isDefault: boolean }[]>("/me/addresses", {
    token,
  });
  const address = result.body.find((item) => item.isDefault) ?? result.body[0];
  if (!address) {
    throw new Error("Pembeli tidak punya alamat.");
  }
  return address.id;
}

export async function addToCart(
  token: string,
  variantId: string,
  quantity = 1,
): Promise<void> {
  const result = await api("/cart/items", {
    method: "POST",
    token,
    body: { variantId, quantity },
  });
  if (result.status !== 201) {
    throw new Error(`Tambah keranjang gagal: ${JSON.stringify(result.body)}`);
  }
}

export type CheckoutResult = {
  paymentId: string;
  paymentCode: string;
  totalAmount: number;
  invoiceCount: number;
};

export async function checkoutCart(
  token: string,
  paymentMethod = "VA_BCA",
): Promise<{ result: CheckoutResult; shopCount: number; invoiceIds: string[] }> {
  const address = await addressId(token);
  const quote = await api<{
    shops: {
      shopId: string;
      rates: { courier: string; service: string; cost: number }[];
    }[];
  }>("/checkout/quote", { method: "POST", token, body: { addressId: address } });

  if (quote.status !== 201 || !quote.body.shops?.length) {
    throw new Error(`Quote gagal: ${JSON.stringify(quote.body)}`);
  }

  const shipping = quote.body.shops.map((shop) => {
    const rate = shop.rates[0];
    if (!rate) {
      throw new Error("Toko tidak punya kurir.");
    }
    return { shopId: shop.shopId, courier: rate.courier, service: rate.service };
  });

  const key = `verify-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const result = await api<CheckoutResult>("/checkout", {
    method: "POST",
    token,
    headers: { "Idempotency-Key": key },
    body: {
      addressId: address,
      paymentMethod,
      shipping,
      notes: "Pesanan uji otomatis.",
    },
  });

  if (result.status !== 201) {
    throw new Error(`Checkout gagal: ${JSON.stringify(result.body)}`);
  }

  const orders = await api<{ id: string; payment: { id: string } | null }[]>("/orders", {
    token,
  });
  const invoiceIds = orders.body
    .filter((order) => order.payment?.id === result.body.paymentId)
    .map((order) => order.id);

  return { result: result.body, shopCount: quote.body.shops.length, invoiceIds };
}

export async function payWithDemo(
  paymentId: string,
  admin: string,
): Promise<void> {
  const action = await api(`/demo/payments/${paymentId}/pay`, {
    method: "POST",
    token: admin,
  });
  if (action.status !== 201) {
    throw new Error(`Simulasi bayar gagal: ${JSON.stringify(action.body)}`);
  }

  await waitFor(async () => {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { status: true },
    });
    return payment?.status === "PAID";
  }, 12_000);
}

export async function advanceClock(admin: string, minutes: number): Promise<void> {
  const result = await api("/demo/clock/advance", {
    method: "POST",
    token: admin,
    body: { minutes },
  });
  if (result.status !== 201) {
    throw new Error(`Majukan waktu gagal: ${JSON.stringify(result.body)}`);
  }
}

export async function waitFor(
  predicate: () => Promise<boolean>,
  timeoutMs = 10_000,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Waktu tunggu habis.");
}

export async function variantForShop(phone: string): Promise<{
  productId: string;
  variantId: string;
  price: number;
}> {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new Error(`Pengguna ${phone} tidak ada.`);
  }
  const shop = await prisma.shop.findUnique({ where: { ownerUserId: user.id } });
  if (!shop) {
    throw new Error(`Toko untuk ${phone} tidak ada.`);
  }
  const product = await prisma.product.findFirst({
    where: { shopId: shop.id, status: "ACTIVE" },
    include: { variants: { orderBy: { price: "asc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  });
  const variant = product?.variants[0];
  if (!product || !variant) {
    throw new Error("Barang toko tidak ditemukan.");
  }
  return { productId: product.id, variantId: variant.id, price: variant.price };
}

export async function sellerAcceptAndShip(
  sellerPhone: string,
  invoiceId: string,
): Promise<{ awb: string }> {
  const seller = await login(sellerPhone);
  const accept = await api(`/seller/orders/${invoiceId}/accept`, {
    method: "POST",
    token: seller.token,
  });
  if (accept.status !== 201) {
    throw new Error(`Terima pesanan gagal: ${JSON.stringify(accept.body)}`);
  }

  const awb = await api<{ awb: string }>(`/seller/orders/${invoiceId}/awb`, {
    method: "POST",
    token: seller.token,
  });
  if (awb.status !== 201) {
    throw new Error(`Buat resi gagal: ${JSON.stringify(awb.body)}`);
  }
  return awb.body;
}

export async function ledgerSummary(): Promise<{
  balanced: boolean;
  mismatch: number;
  escrowMatches: boolean;
  journals: number;
}> {
  const journals = await prisma.ledgerJournal.findMany({ include: { entries: true } });
  let unbalanced = 0;
  for (const journal of journals) {
    const debit = journal.entries
      .filter((entry) => entry.direction === "DEBIT")
      .reduce((total, entry) => total + entry.amount, 0);
    const credit = journal.entries
      .filter((entry) => entry.direction === "CREDIT")
      .reduce((total, entry) => total + entry.amount, 0);
    if (debit !== credit) {
      unbalanced += 1;
    }
  }

  const wallets = await prisma.shopWallet.findMany();
  let mismatch = 0;
  for (const wallet of wallets) {
    const entries = await prisma.ledgerEntry.findMany({
      where: { accountCode: `SELLER_PAYABLE:${wallet.shopId}` },
    });
    const ledger = entries.reduce(
      (total, entry) =>
        total + (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0,
    );
    if (ledger !== wallet.balanceAvailable + wallet.balanceWithheld) {
      mismatch += 1;
    }
  }

  const escrowEntries = await prisma.ledgerEntry.findMany({
    where: { accountCode: "ESCROW_LIABILITY" },
  });
  const escrowLedger = escrowEntries.reduce(
    (total, entry) =>
      total + (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
    0,
  );
  const active = await prisma.orderInvoice.aggregate({
    where: { escrowStatus: { in: ["HELD", "FROZEN"] } },
    _sum: { totalAmount: true },
  });

  return {
    balanced: unbalanced === 0,
    mismatch,
    escrowMatches: escrowLedger === (active._sum.totalAmount ?? 0),
    journals: journals.length,
  };
}

export async function cleanupInvoices(invoiceIds: string[]): Promise<void> {
  if (invoiceIds.length === 0) {
    return;
  }
  const payments = await prisma.orderInvoice.findMany({
    where: { id: { in: invoiceIds } },
    select: { paymentId: true },
  });
  await prisma.orderItem.deleteMany({ where: { orderInvoiceId: { in: invoiceIds } } });
  await prisma.shipment.deleteMany({ where: { orderInvoiceId: { in: invoiceIds } } });
  await prisma.disputeMessage.deleteMany({
    where: { dispute: { orderInvoiceId: { in: invoiceIds } } },
  });
  await prisma.dispute.deleteMany({ where: { orderInvoiceId: { in: invoiceIds } } });
  await prisma.orderInvoice.deleteMany({ where: { id: { in: invoiceIds } } });
  const remaining = await prisma.orderInvoice.count({
    where: { paymentId: { in: payments.map((payment) => payment.paymentId) } },
  });
  if (remaining === 0) {
    await prisma.payment.deleteMany({
      where: { id: { in: payments.map((payment) => payment.paymentId) } },
    });
  }
}
