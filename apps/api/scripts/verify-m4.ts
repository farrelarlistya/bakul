import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  addToCart,
  adminToken,
  advanceClock,
  api,
  checkoutCart,
  cleanupInvoices,
  ledgerSummary,
  login,
  prisma,
  variantForShop,
  waitFor,
} from "./verify-utils";

const BUYER = "081200000021";

async function rawWebhook(body: string, signature: string): Promise<{
  status: number;
  body: unknown;
}> {
  const response = await fetch(
    (process.env["API_BASE"] ?? "http://127.0.0.1:3001/api/v1") + "/webhooks/payments",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mock-Signature": signature,
      },
      body,
    },
  );
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}

function sign(body: string): string {
  const secret = process.env["MOCK_PG_SECRET"];
  if (!secret) {
    throw new Error("MOCK_PG_SECRET belum diisi.");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const value = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return `t=${timestamp},v1=${value}`;
}

async function main(): Promise<void> {
  const buyer = await login(BUYER);
  const admin = await adminToken();

  // Siapkan tagihan untuk T-03/T-04.
  const variant = await variantForShop("081200000013");
  await addToCart(buyer.token, variant.variantId, 1);
  const checkout = await checkoutCart(buyer.token, "VA_BCA");
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: checkout.result.paymentId },
    include: { invoices: true },
  });

  const journalsBefore = await prisma.ledgerJournal.count();
  const eventsBefore = await prisma.webhookEvent.count();
  const payload = JSON.stringify({
    eventId: `evt_t03_${Date.now()}`,
    event: "payment.paid",
    chargeId: payment.providerRef,
    paidAmount: payment.totalAmount,
    paidAt: new Date().toISOString(),
  });
  const signature = sign(payload);

  const responses = [];
  for (let index = 0; index < 5; index += 1) {
    responses.push(await rawWebhook(payload, signature));
  }
  assert.ok(responses.every((response) => response.status === 201));
  assert.equal(
    responses.filter(
      (response) =>
        typeof response.body === "object" &&
        response.body !== null &&
        (response.body as { duplicate?: boolean }).duplicate,
    ).length,
    4,
  );

  const paid = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  assert.equal(paid.status, "PAID");
  const invoices = await prisma.orderInvoice.findMany({
    where: { paymentId: payment.id },
  });
  assert.ok(invoices.every((invoice) => invoice.escrowStatus === "HELD"));

  const journalsAfter = await prisma.ledgerJournal.count();
  const eventsAfter = await prisma.webhookEvent.count();
  assert.equal(journalsAfter - journalsBefore, 2, "hanya 1 jurnal bayar + 1 biaya PG");
  assert.equal(eventsAfter - eventsBefore, 1, "hanya 1 baris webhook unik");

  console.log(
    "PASS T-03: webhook pembayaran dikirim 5x dengan event_id sama -> 1 baris webhook, 1 jurnal bayar, 1 jurnal biaya PG.",
  );

  // T-04: tanda tangan salah.
  const badPayload = JSON.stringify({
    eventId: `evt_t04_${Date.now()}`,
    event: "payment.paid",
    chargeId: payment.providerRef,
    paidAmount: payment.totalAmount,
    paidAt: new Date().toISOString(),
  });
  const badResponses = await Promise.all([
    rawWebhook(badPayload, "t=1,v1=0000000000000000000000000000000000000000000000000000000000000000"),
    rawWebhook(badPayload, ""),
    rawWebhook(badPayload, "bukan-tanda-tangan"),
  ]);
  assert.ok(badResponses.every((response) => response.status === 401));
  assert.equal(await prisma.ledgerJournal.count(), journalsAfter);
  assert.equal(await prisma.webhookEvent.count(), eventsAfter);
  console.log("PASS T-04: webhook dengan tanda tangan salah ditolak 401 tanpa mengubah data.");

  // T-05: tagihan QRIS kedaluwarsa mengembalikan stok.
  const expiringVariant = await variantForShop("081200000014");
  const stockBefore = await prisma.productVariant.findUniqueOrThrow({
    where: { id: expiringVariant.variantId },
    select: { stockAvailable: true, stockReserved: true },
  });
  await addToCart(buyer.token, expiringVariant.variantId, 1);
  const expiring = await checkoutCart(buyer.token, "QRIS");
  const stockLocked = await prisma.productVariant.findUniqueOrThrow({
    where: { id: expiringVariant.variantId },
    select: { stockAvailable: true, stockReserved: true },
  });
  assert.equal(stockLocked.stockAvailable, stockBefore.stockAvailable - 1);
  assert.equal(stockLocked.stockReserved, stockBefore.stockReserved + 1);

  await advanceClock(admin, 20);
  await waitFor(async () => {
    const row = await prisma.productVariant.findUnique({
      where: { id: expiringVariant.variantId },
      select: { stockAvailable: true, stockReserved: true },
    });
    return (
      row?.stockAvailable === stockBefore.stockAvailable &&
      row?.stockReserved === stockBefore.stockReserved
    );
  });

  const expiredPayment = await prisma.payment.findUniqueOrThrow({
    where: { id: expiring.result.paymentId },
  });
  assert.equal(expiredPayment.status, "EXPIRED");
  const expiredInvoices = await prisma.orderInvoice.findMany({
    where: { paymentId: expiring.result.paymentId },
  });
  assert.ok(
    expiredInvoices.every(
      (invoice) =>
        invoice.orderStatus === "CANCELLED_UNPAID" &&
        invoice.escrowStatus === "CANCELLED",
    ),
  );
  console.log(
    `PASS T-05: tagihan QRIS kedaluwarsa, stok ${stockBefore.stockAvailable} -> ${stockBefore.stockAvailable - 1} -> ${stockBefore.stockAvailable}, pesanan batal tanpa dana tertahan.`,
  );

  await cleanupInvoices(expiring.invoiceIds);

  // T-11: invariant ledger setelah puluhan pesanan.
  const orderCount = await prisma.orderInvoice.count();
  assert.ok(orderCount >= 30, "seed riwayat harus menyediakan minimal 30 pesanan");
  const summary = await ledgerSummary();
  assert.equal(summary.balanced, true);
  assert.equal(summary.mismatch, 0);
  assert.equal(summary.escrowMatches, true);
  console.log(
    `PASS T-11: ${orderCount} pesanan, ${summary.journals} jurnal seimbang, 0 selisih dompet, escrow ledger = escrow pesanan.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("GAGAL verifikasi M4:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
