import assert from "node:assert/strict";
import {
  addToCart,
  adminToken,
  advanceClock,
  api,
  checkoutCart,
  ledgerSummary,
  login,
  prisma,
  sellerAcceptAndShip,
  variantForShop,
  waitFor,
} from "./verify-utils";

const BUYER = "081200000021";
const BASE = process.env["API_BASE"] ?? "http://127.0.0.1:3001/api/v1";

async function main(): Promise<void> {
  const buyer = await login(BUYER);
  const admin = await adminToken();

  // T-06: penjual tidak merespons 48 jam.
  const lateVariant = await variantForShop("081200000012");
  const lateBefore = await prisma.productVariant.findUniqueOrThrow({
    where: { id: lateVariant.variantId },
    select: { stockAvailable: true, stockReserved: true },
  });
  await addToCart(buyer.token, lateVariant.variantId, 1);
  const lateOrder = await checkoutCart(buyer.token, "VA_BCA");
  await (async () => {
    const result = await api(`/demo/payments/${lateOrder.result.paymentId}/pay`, {
      method: "POST",
      token: admin,
    });
    assert.equal(result.status, 201);
  })();
  await waitFor(async () => {
    const row = await prisma.payment.findUnique({
      where: { id: lateOrder.result.paymentId },
      select: { status: true },
    });
    return row?.status === "PAID";
  });

  const invoiceId = lateOrder.invoiceIds[0];
  assert.ok(invoiceId);
  await advanceClock(admin, 49 * 60);

  await waitFor(async () => {
    const row = await prisma.orderInvoice.findUnique({
      where: { id: invoiceId },
      select: { orderStatus: true },
    });
    return row?.orderStatus === "CANCELLED_BY_SELLER";
  });

  const cancelled = await prisma.orderInvoice.findUniqueOrThrow({
    where: { id: invoiceId },
  });
  assert.equal(cancelled.escrowStatus, "REFUNDED");
  const lateAfter = await prisma.productVariant.findUniqueOrThrow({
    where: { id: lateVariant.variantId },
    select: { stockAvailable: true, stockReserved: true },
  });
  assert.equal(lateAfter.stockAvailable, lateBefore.stockAvailable);
  assert.equal(lateAfter.stockReserved, lateBefore.stockReserved);

  const refundJournal = await prisma.ledgerJournal.findFirst({
    where: { refType: "ESCROW_REFUND", refId: invoiceId },
  });
  assert.ok(refundJournal);
  console.log(
    "PASS T-06: penjual tidak merespons 48 jam -> pesanan batal otomatis, stok kembali, jurnal refund dibuat.",
  );

  // T-07: AWB, label, tracking, auto-complete.
  const variant = await variantForShop("081200000011");
  await addToCart(buyer.token, variant.variantId, 1);
  const order = await checkoutCart(buyer.token, "VA_BCA");
  await api(`/demo/payments/${order.result.paymentId}/pay`, {
    method: "POST",
    token: admin,
  });
  await waitFor(async () => {
    const row = await prisma.payment.findUnique({
      where: { id: order.result.paymentId },
      select: { status: true },
    });
    return row?.status === "PAID";
  });

  const invoiceId2 = order.invoiceIds[0];
  assert.ok(invoiceId2);
  const awb = await sellerAcceptAndShip("081200000011", invoiceId2);
  assert.match(awb.awb, /^(?:\d{15}|JP\d{10}|00\d{12}|100\d{10}|P\d{12})$/);

  const seller = await login("081200000011");
  const label = await fetch(`${BASE}/seller/orders/${invoiceId2}/label.pdf`, {
    headers: { Authorization: `Bearer ${seller.token}` },
  });
  assert.equal(label.status, 200);
  const labelBytes = Buffer.from(await label.arrayBuffer());
  assert.ok(labelBytes.length > 1_000);
  assert.equal(labelBytes.subarray(0, 4).toString("ascii"), "%PDF");

  await waitFor(async () => {
    const row = await prisma.shipment.findUnique({
      where: { orderInvoiceId: invoiceId2 },
      select: { shippingStatus: true },
    });
    return row?.shippingStatus === "PICKED_UP";
  });
  console.log(
    `PASS SHP-4: resi ${awb.awb} dan label PDF A6 ${Math.round(labelBytes.length / 1024)} KB dibuat; timeline mulai bergerak.`,
  );

  await advanceClock(admin, 33 * 60);
  await waitFor(async () => {
    const row = await prisma.orderInvoice.findUnique({
      where: { id: invoiceId2 },
      select: { orderStatus: true },
    });
    return row?.orderStatus === "DELIVERED";
  });
  const delivered = await prisma.orderInvoice.findUniqueOrThrow({
    where: { id: invoiceId2 },
    include: { shipment: true },
  });
  assert.ok(delivered.deliveredAt);
  assert.ok(delivered.autoCompleteAt);
  assert.equal(delivered.shipment?.shippingStatus, "DELIVERED");
  assert.equal((delivered.shipment?.trackingHistory as unknown[]).length, 6);
  console.log(
    "PASS ORD-1: timeline pengiriman mencapai DELIVERED dengan 6 kejadian dan batas selesai otomatis.",
  );

  const walletBefore = await prisma.shopWallet.findFirst({
    where: { shopId: delivered.shopId },
  });
  await advanceClock(admin, 73 * 60);
  await waitFor(async () => {
    const row = await prisma.orderInvoice.findUnique({
      where: { id: invoiceId2 },
      select: { orderStatus: true },
    });
    return row?.orderStatus === "COMPLETED";
  });

  const completed = await prisma.orderInvoice.findUniqueOrThrow({
    where: { id: invoiceId2 },
  });
  assert.equal(completed.escrowStatus, "RELEASED");
  const walletAfter = await prisma.shopWallet.findUniqueOrThrow({
    where: { shopId: delivered.shopId },
  });
  const releaseJournal = await prisma.ledgerJournal.findFirst({
    where: { refType: "ESCROW_RELEASE", refId: invoiceId2 },
  });
  assert.ok(releaseJournal);
  assert.ok(
    walletAfter.balanceAvailable >=
      (walletBefore?.balanceAvailable ?? 0) + completed.netSellerAmount,
  );
  const summary = await ledgerSummary();
  assert.equal(summary.balanced, true);
  assert.equal(summary.escrowMatches, true);
  console.log(
    `PASS T-07: auto-complete tepat waktu, escrow dilepas Rp ${completed.netSellerAmount}, saldo toko bertambah, ledger tetap seimbang.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("GAGAL verifikasi M5:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
