import assert from "node:assert/strict";
import {
  adminToken,
  api,
  ledgerSummary,
  login,
  prisma,
} from "./verify-utils";

const BASE = process.env["API_BASE"] ?? "http://127.0.0.1:3001/api/v1";
const SELLER = "081200000011";

type Wallet = {
  balanceAvailable: number;
  balanceWithheld: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  transferProofUrl: string | null;
};

async function main(): Promise<void> {
  const seller = await login(SELLER);
  const admin = await adminToken();
  const wallet = await api<Wallet>("/wallet", { token: seller.token });
  assert.equal(wallet.status, 200);
  assert.ok(
    wallet.body.balanceAvailable >= 100_000,
    "saldo penjual harus cukup untuk uji pencairan",
  );

  const tooMuch = await api("/withdrawals", {
    method: "POST",
    token: seller.token,
    headers: { "Idempotency-Key": `wd-over-${Date.now()}` },
    body: {
      amount: wallet.body.balanceAvailable + 10_000,
      bankName: wallet.body.bankName ?? "BCA",
      bankAccountNumber: wallet.body.bankAccountNumber ?? "0000000001",
      bankAccountHolder: wallet.body.bankAccountHolder ?? "Sri Rahayu",
    },
  });
  assert.equal(tooMuch.status, 400);
  assert.equal(
    (tooMuch.body as { error?: { code?: string } }).error?.code,
    "WITHDRAWAL_INSUFFICIENT",
  );

  const tooSmall = await api("/withdrawals", {
    method: "POST",
    token: seller.token,
    headers: { "Idempotency-Key": `wd-small-${Date.now()}` },
    body: {
      amount: 49_000,
      bankName: "BCA",
      bankAccountNumber: "0000000001",
      bankAccountHolder: "Sri Rahayu",
    },
  });
  assert.equal(tooSmall.status, 400);
  console.log("PASS WDR-2: tarik saldo melebihi saldo dan di bawah Rp50.000 ditolak dengan pesan jelas.");

  const key = `wd-ok-${Date.now()}`;
  const body = {
    amount: 50_000,
    bankName: wallet.body.bankName ?? "BCA",
    bankAccountNumber: wallet.body.bankAccountNumber ?? "0000000001",
    bankAccountHolder: wallet.body.bankAccountHolder ?? "Sri Rahayu",
  };
  const requested = await api<Withdrawal>("/withdrawals", {
    method: "POST",
    token: seller.token,
    headers: { "Idempotency-Key": key },
    body,
  });
  assert.equal(requested.status, 201);
  assert.equal(requested.body.status, "REQUESTED");

  const replay = await api<Withdrawal>("/withdrawals", {
    method: "POST",
    token: seller.token,
    headers: { "Idempotency-Key": key },
    body,
  });
  assert.equal(replay.body.id, requested.body.id);

  const walletAfterRequest = await api<Wallet>("/wallet", { token: seller.token });
  assert.equal(
    walletAfterRequest.body.balanceAvailable,
    wallet.body.balanceAvailable - 50_000,
  );
  assert.equal(walletAfterRequest.body.balanceWithheld, wallet.body.balanceWithheld + 50_000);
  console.log(
    "PASS WDR-2: pengajuan Rp50.000 mengunci saldo, kirim ulang kunci yang sama tidak menggandakan pengajuan.",
  );

  const approved = await api<Withdrawal>(
    `/admin/withdrawals/${requested.body.id}/approve`,
    {
      method: "POST",
      token: admin,
      body: { note: "Transfer simulasi uji M6." },
    },
  );
  assert.equal(approved.status, 201);
  assert.equal(approved.body.status, "COMPLETED");

  const walletAfterApprove = await api<Wallet>("/wallet", { token: seller.token });
  assert.equal(walletAfterApprove.body.balanceWithheld, wallet.body.balanceWithheld);
  assert.equal(walletAfterApprove.body.balanceAvailable, wallet.body.balanceAvailable - 50_000);

  const withdrawalJournal = await prisma.ledgerJournal.findFirst({
    where: { refType: "WITHDRAWAL", refId: requested.body.id },
    include: { entries: true },
  });
  assert.ok(withdrawalJournal);
  const debit = withdrawalJournal.entries
    .filter((entry) => entry.direction === "DEBIT")
    .reduce((total, entry) => total + entry.amount, 0);
  const credit = withdrawalJournal.entries
    .filter((entry) => entry.direction === "CREDIT")
    .reduce((total, entry) => total + entry.amount, 0);
  assert.equal(debit, 50_000);
  assert.equal(credit, 50_000);

  const proof = await fetch(`${BASE}/withdrawals/${requested.body.id}/proof`, {
    headers: { Authorization: `Bearer ${seller.token}` },
  });
  assert.equal(proof.status, 200);
  const proofText = await proof.text();
  assert.ok(proofText.includes("BUKTI TRANSFER SIMULASI"));
  assert.ok(proofText.includes("50.000"));

  const summary = await ledgerSummary();
  assert.equal(summary.balanced, true);
  assert.equal(summary.mismatch, 0);
  assert.equal(summary.escrowMatches, true);
  console.log(
    "PASS WDR-1: admin menyetujui pencairan, jurnal seimbang, saldo dompet cocok, bukti transfer simulasi tersedia.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("GAGAL verifikasi M6:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
