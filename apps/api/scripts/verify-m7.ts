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
const OTHER_BUYER = "081200000022";

async function main(): Promise<void> {
  const buyer = await login(BUYER);
  const admin = await adminToken();

  const variant = await variantForShop("081200000013");
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
  const invoiceId = order.invoiceIds[0];
  assert.ok(invoiceId);
  await sellerAcceptAndShip("081200000013", invoiceId);
  await advanceClock(admin, 33 * 60);
  await waitFor(async () => {
    const row = await prisma.orderInvoice.findUnique({
      where: { id: invoiceId },
      select: { orderStatus: true },
    });
    return row?.orderStatus === "DELIVERED";
  });

  // T-08: komplain membekukan escrow.
  const dispute = await api<{ disputeId: string }>(
    `/orders/${invoiceId}/dispute`,
    {
      method: "POST",
      token: buyer.token,
      body: {
        reason: "Barang datang penyok dan warna berbeda dari foto.",
        requestedSolution: "REFUND_PARTIAL",
        evidenceUrls: [],
      },
    },
  );
  assert.equal(dispute.status, 201);
  const frozen = await prisma.orderInvoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { dispute: { include: { messages: true } } },
  });
  assert.equal(frozen.orderStatus, "DISPUTED");
  assert.equal(frozen.escrowStatus, "FROZEN");
  assert.equal(frozen.dispute?.status, "WAITING_SELLER");
  assert.equal(frozen.dispute?.messages.length, 1);

  const seller = await login("081200000013");
  const reply = await api(`/orders/${invoiceId}/dispute/messages`, {
    method: "POST",
    token: seller.token,
    body: { body: "Mohon maaf, boleh dikirim foto bagian yang penyok?" },
  });
  assert.equal(reply.status, 201);

  const escalate = await api(`/orders/${invoiceId}/dispute/escalate`, {
    method: "POST",
    token: buyer.token,
  });
  assert.equal(escalate.status, 201);
  const escalated = await prisma.dispute.findUniqueOrThrow({
    where: { id: dispute.body.disputeId },
    include: { messages: true },
  });
  assert.equal(escalated.status, "ESCALATED_TO_ADMIN");
  assert.equal(escalated.messages.length, 2);
  console.log(
    "PASS T-08: komplain membekukan escrow, ruang diskusi terbuka, balasan penjual tercatat, eskalasi ke admin tersimpan.",
  );

  // T-09: refund sebagian dalam satu jurnal.
  const total = frozen.totalAmount;
  const refundAmount = Math.min(20_000, total - 1_000);
  const decide = await api(`/admin/disputes/${dispute.body.disputeId}/decide`, {
    method: "POST",
    token: admin,
    body: {
      decision: "REFUND_PARTIAL",
      refundAmount,
      note: "Barang penyok. Sebagian uang dikembalikan, sisanya ke penjual.",
    },
  });
  assert.equal(decide.status, 201);

  const refunded = await prisma.orderInvoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { dispute: true },
  });
  assert.equal(refunded.orderStatus, "REFUNDED");
  assert.equal(refunded.escrowStatus, "PARTIALLY_REFUNDED");
  assert.equal(refunded.dispute?.status, "RESOLVED_BUYER");

  const journal = await prisma.ledgerJournal.findFirst({
    where: { refType: "ESCROW_PARTIAL_REFUND", refId: invoiceId },
    include: { entries: true },
  });
  assert.ok(journal);
  const debit = journal.entries
    .filter((entry) => entry.direction === "DEBIT")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const credit = journal.entries
    .filter((entry) => entry.direction === "CREDIT")
    .reduce((sum, entry) => sum + entry.amount, 0);
  assert.equal(debit, total);
  assert.equal(credit, total);
  console.log(
    `PASS T-09: refund sebagian Rp ${refundAmount} dan hak penjual dicatat dalam satu jurnal seimbang Rp ${total}.`,
  );

  // T-12: akses lintas peran ditolak.
  const buyerToSeller = await api("/seller/orders", { token: buyer.token });
  const sellerToAdmin = await api("/admin/metrics", { token: seller.token });
  const otherBuyer = await login(OTHER_BUYER);
  const otherOrder = await api(`/orders/${invoiceId}`, { token: otherBuyer.token });
  const buyerToAdminDecision = await api(
    `/admin/disputes/${dispute.body.disputeId}/decide`,
    {
      method: "POST",
      token: buyer.token,
      body: { decision: "RELEASE", note: "Coba akses lintas peran." },
    },
  );
  assert.equal(buyerToSeller.status, 403);
  assert.equal(sellerToAdmin.status, 403);
  assert.equal(otherOrder.status, 404);
  assert.equal(buyerToAdminDecision.status, 403);
  console.log(
    "PASS T-12: pembeli tidak bisa membuka pesanan pembeli lain atau menu penjual/admin; penjual tidak bisa membuka admin (403/404).",
  );

  const summary = await ledgerSummary();
  assert.equal(summary.balanced, true);
  assert.equal(summary.mismatch, 0);
  assert.equal(summary.escrowMatches, true);
  console.log("PASS: ledger tetap seimbang setelah komplain dan refund sebagian.");
}

main()
  .catch((error: unknown) => {
    console.error("GAGAL verifikasi M7:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
