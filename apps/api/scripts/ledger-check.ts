import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

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
  const journals = await prisma.ledgerJournal.findMany({
    include: { entries: true },
  });

  let unbalancedJournals = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  let invalidEntries = 0;

  for (const journal of journals) {
    let debit = 0;
    let credit = 0;
    for (const entry of journal.entries) {
      if (entry.amount <= 0) {
        invalidEntries += 1;
      }
      if (entry.direction === "DEBIT") {
        debit += entry.amount;
        totalDebit += entry.amount;
      } else {
        credit += entry.amount;
        totalCredit += entry.amount;
      }
    }
    if (debit !== credit) {
      unbalancedJournals += 1;
    }
  }

  const wallets = await prisma.shopWallet.findMany();
  const mismatches: { shopId: string; wallet: number; ledger: number }[] = [];
  for (const wallet of wallets) {
    const entries = await prisma.ledgerEntry.findMany({
      where: { accountCode: `SELLER_PAYABLE:${wallet.shopId}` },
    });
    const ledger = entries.reduce(
      (total, entry) =>
        total + (entry.direction === "CREDIT" ? entry.amount : -entry.amount),
      0,
    );
    const cached = wallet.balanceAvailable + wallet.balanceWithheld;
    if (ledger !== cached) {
      mismatches.push({ shopId: wallet.shopId, wallet: cached, ledger });
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
  const activeEscrow = await prisma.orderInvoice.aggregate({
    where: { escrowStatus: { in: ["HELD", "FROZEN"] } },
    _sum: { totalAmount: true },
  });
  const escrowInvoices = activeEscrow._sum.totalAmount ?? 0;

  let appendOnlyWorks = false;
  const first = await prisma.ledgerEntry.findFirst({ select: { id: true } });
  if (first) {
    try {
      await prisma.$executeRaw`UPDATE "ledger_entries" SET "amount" = "amount" WHERE "id" = ${first.id}::uuid`;
    } catch {
      appendOnlyWorks = true;
    }
  }

  console.log("Pemeriksaan ledger Bakul");
  console.log(`Jurnal             : ${journals.length}`);
  console.log(`Baris ledger       : ${journals.reduce((total, journal) => total + journal.entries.length, 0)}`);
  console.log(`Total debit        : Rp ${totalDebit.toLocaleString("id-ID")}`);
  console.log(`Total kredit       : Rp ${totalCredit.toLocaleString("id-ID")}`);
  console.log(`Jurnal tidak balance: ${unbalancedJournals}`);
  console.log(`Nominal tidak sah  : ${invalidEntries}`);
  console.log(`Saldo dompet beda  : ${mismatches.length}`);
  console.log(`Escrow di ledger   : Rp ${escrowLedger.toLocaleString("id-ID")}`);
  console.log(`Escrow di pesanan  : Rp ${escrowInvoices.toLocaleString("id-ID")}`);
  console.log(`Ledger append-only : ${appendOnlyWorks ? "ya" : "TIDAK"}`);

  for (const mismatch of mismatches) {
    console.log(
      `  beda toko ${mismatch.shopId}: dompet ${mismatch.wallet}, ledger ${mismatch.ledger}`,
    );
  }

  const ok =
    unbalancedJournals === 0 &&
    totalDebit === totalCredit &&
    invalidEntries === 0 &&
    mismatches.length === 0 &&
    escrowLedger === escrowInvoices &&
    appendOnlyWorks;
  console.log(ok ? "HASIL: 0 selisih" : "HASIL: ADA SELISIH");
  process.exitCode = ok ? 0 : 1;
}

main()
  .catch((error: unknown) => {
    console.error("Gagal memeriksa ledger:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
