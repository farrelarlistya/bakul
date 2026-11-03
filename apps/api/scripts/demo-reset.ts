import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedHistory } from "../prisma/seed-history";

config({ path: "../../.env", quiet: true });
config({ quiet: true });

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL belum diisi.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main(): Promise<void> {
  if (process.env["DEMO_MODE"] !== "true") {
    throw new Error("demo:reset hanya boleh dijalankan saat DEMO_MODE=true.");
  }

  await prisma.$executeRaw`
    TRUNCATE TABLE
      "webhook_events",
      "ledger_entries",
      "ledger_journals",
      "withdrawals",
      "shop_wallets",
      "dispute_messages",
      "disputes",
      "shipments",
      "order_items",
      "order_invoices",
      "payments",
      "cart_items",
      "carts"
    CASCADE
  `;
  await prisma.notification.deleteMany({});
  await prisma.otpCode.deleteMany({});
  await prisma.appSetting.deleteMany({
    where: { key: { in: ["demo_epoch", "demo_started_at"] } },
  });

  const created = await seedHistory(prisma);
  const [orders, journals, wallets] = await Promise.all([
    prisma.orderInvoice.count(),
    prisma.ledgerJournal.count(),
    prisma.shopWallet.count(),
  ]);

  console.log(
    `Reset demo selesai: ${orders} pesanan riwayat (${created} baru), ${journals} jurnal, ${wallets} dompet toko.`,
  );
  console.log("Restart API agar jam simulasi dimulai dari waktu sekarang.");
}

main()
  .catch((error: unknown) => {
    console.error("Gagal reset demo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
