import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const AXE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const HALAMAN: Array<{ nama: string; url: string; masuk?: string }> = [
  { nama: "Beranda", url: "/" },
  { nama: "Cari", url: "/cari" },
  { nama: "Detail barang", url: "/p/nastar-premium-001" },
  { nama: "Keranjang", url: "/keranjang" },
  { nama: "Bayar", url: "/bayar" },
  { nama: "Pesanan", url: "/pesanan" },
  { nama: "Inbox", url: "/inbox" },
  { nama: "Akun", url: "/akun" },
  { nama: "Masuk", url: "/masuk" },
  { nama: "Buka toko", url: "/jualan" },
];

async function masuk(page: Page, phone: string): Promise<void> {
  await page.goto("/masuk");
  await page.locator("#phone").fill(phone);
  await page.getByRole("button", { name: "Kirim kode" }).click();
  const boxes = page.locator('input[aria-label^="Angka"]');
  await boxes.first().waitFor();
  for (let index = 0; index < 6; index += 1) {
    await boxes.nth(index).fill("123456"[index] ?? "");
  }
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL(/\/akun$/);
}

async function audit(page: Page, nama: string): Promise<void> {
  await page.addScriptTag({ content: AXE });
  const hasil = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (ctx: unknown, opts: unknown) => Promise<{ violations: Array<{ id: string; impact: string | null; nodes: Array<{ target: string[] }> }> }> } }).axe;
    const run = await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
    });
    return run.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      target: violation.nodes[0]?.target ?? [],
    }));
  });

  expect(hasil, `${nama}: ${hasil.map((v) => `${v.id} (${v.target.join(" ")})`).join(" | ")}`).toEqual([]);
}

test.describe.configure({ mode: "serial" });

test("audit aksesibilitas seluruh halaman pembeli", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const halaman of HALAMAN) {
    await page.goto(halaman.url);
    await page.waitForTimeout(1500);
    await audit(page, halaman.nama);
  }

  // Halaman yang butuh sesi
  await masuk(page, "081200000021");
  for (const halaman of [
    { nama: "Pesanan (sesi)", url: "/pesanan" },
    { nama: "Keranjang (sesi)", url: "/keranjang" },
    { nama: "Bayar (sesi)", url: "/bayar" },
    { nama: "Inbox (sesi)", url: "/inbox" },
    { nama: "Akun (sesi)", url: "/akun" },
  ]) {
    await page.goto(halaman.url);
    await page.waitForTimeout(1500);
    await audit(page, halaman.nama);
  }
});

test("audit aksesibilitas halaman admin", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await masuk(page, "081200000001");

  for (const halaman of [
    { nama: "Admin dashboard", url: "/admin" },
    { nama: "Admin komplain", url: "/admin/komplain" },
    { nama: "Admin pencairan", url: "/admin/pencairan" },
    { nama: "Admin toko", url: "/admin/toko" },
    { nama: "Demo console", url: "/dev" },
  ]) {
    await page.goto(halaman.url);
    await page.waitForTimeout(1500);
    await audit(page, halaman.nama);
  }
});
