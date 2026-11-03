import assert from "node:assert/strict";
import {
  adminToken,
  api,
  login,
  prisma,
} from "./verify-utils";

const WEB = process.env["WEB_BASE"] ?? "http://localhost:3000";
const BANNED = [
  "escrow",
  "checkout",
  "invoice",
  "settlement",
  "disbursement",
  "withdrawal",
  "virtual account",
  "payment gateway",
  "webhook",
  "idempotency",
  "auto-complete",
  "sku",
  "dispute",
  "newsletter",
  "diskon",
  "promo",
];

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main(): Promise<void> {
  const admin = await adminToken();
  const status = await api<{ demoMode: boolean; speed: number; now: string }>(
    "/demo/status",
    { token: admin },
  );
  assert.equal(status.status, 200);
  assert.equal(status.body.demoMode, true);
  assert.ok(status.body.speed >= 1);

  const demo = await api("/demo/status", { token: admin });
  assert.equal(demo.status, 200);

  const pending = await api<unknown[]>("/demo/payments/pending", { token: admin });
  assert.equal(pending.status, 200);
  assert.ok(Array.isArray(pending.body));

  const metrics = await api<{
    gmv: number;
    escrowHeld: number;
    orderCount: number;
    openDisputes: number;
    pendingWithdrawals: number;
  }>("/admin/metrics", { token: admin });
  assert.equal(metrics.status, 200);
  assert.ok(metrics.body.orderCount >= 30);
  assert.ok(metrics.body.gmv > 0);
  assert.ok(metrics.body.escrowHeld >= 0);

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.product.count(),
    prisma.orderInvoice.count(),
    prisma.ledgerJournal.count(),
  ]);
  assert.equal(counts[0], 12);
  assert.equal(counts[1], 5);
  assert.equal(counts[2], 100);
  assert.ok(counts[3] >= 30);
  assert.ok(counts[4] >= 30);

  const shipment = await prisma.shipment.findFirst({
    where: { shippingStatus: "DELIVERED" },
    orderBy: { createdAt: "asc" },
  });
  if (shipment) {
    const tracking = await api<{ awb: string; events: unknown[] }>(
      `/tracking/${shipment.awb}`,
    );
    assert.equal(tracking.status, 200);
    assert.equal(tracking.body.awb, shipment.awb);
    assert.ok(tracking.body.events.length >= 1);
  }

  const buyer = await login("081200000021");
  const orders = await api<unknown[]>("/orders", { token: buyer.token });
  assert.equal(orders.status, 200);
  const notifications = await api<unknown[]>("/notifications", { token: buyer.token });
  assert.equal(notifications.status, 200);
  assert.ok((notifications.body as unknown[]).length > 0);

  const pages = [
    "/",
    "/masuk",
    "/cari",
    "/p/nastar-premium-001",
    "/toko/dapur-bu-sri",
    "/jualan",
    "/keranjang",
    "/pesanan",
  ];
  const findings: { page: string; term: string }[] = [];

  for (const page of pages) {
    const response = await fetch(`${WEB}${page}`);
    assert.equal(response.status, 200, `halaman ${page} harus 200`);
    const text = visibleText(await response.text()).toLowerCase();
    for (const term of BANNED) {
      if (text.includes(term)) {
        findings.push({ page, term });
      }
    }
  }

  assert.deepEqual(findings, []);
  console.log(
    `PASS T-14: ${pages.length} halaman utama tidak menampilkan istilah teknis terlarang (${BANNED.length} istilah diperiksa).`,
  );
  console.log(
    `PASS DMO: demo console aktif (${status.body.speed}x), ${pending.body.length} tagihan menunggu, ${metrics.body.orderCount} pesanan, escrow Rp ${metrics.body.escrowHeld}.`,
  );
  console.log(
    `PASS M8: seed 12 pengguna, 5 toko, 100 produk, ${counts[3]} pesanan, ${counts[4]} jurnal ledger; halaman lacak publik dan inbox berfungsi.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("GAGAL verifikasi M8:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
