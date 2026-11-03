import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, phone: string): Promise<void> {
  await page.goto("/masuk");
  await page.locator("#phone").fill(phone);
  await page.getByRole("button", { name: "Kirim kode" }).click();
  const boxes = page.locator('input[aria-label^="Angka"]');
  await boxes.first().waitFor();
  for (let index = 0; index < 6; index += 1) {
    await boxes.nth(index).fill("123456"[index] ?? "");
  }
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/akun$/);
}

test.describe.configure({ mode: "serial" });

test("pembeli: cari barang, keranjang, bayar, dan lihat pesanan", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await login(page, "081200000021");
  await page.goto("/p/nastar-premium-001");
  await expect(page.getByRole("heading", { name: "Nastar Premium" })).toBeVisible();
  await page.getByRole("button", { name: "Tambah ke keranjang" }).click();
  await expect(page.getByText("masuk keranjang", { exact: false })).toBeVisible();

  await page.goto("/keranjang");
  await expect(page.getByRole("heading", { name: "Keranjang" })).toBeVisible();
  await page.getByRole("link", { name: "Lanjut bayar" }).click();
  await expect(page).toHaveURL(/\/bayar$/);
  await expect(page.getByRole("heading", { name: "Bayar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Bayar sekarang" }).click();
  await expect(page).toHaveURL(/\/pembayaran\//);
  await page.getByRole("button", { name: "Saya sudah bayar (demo)" }).click();
  await expect(page.getByRole("heading", { name: "Pembayaran berhasil" })).toBeVisible({
    timeout: 25_000,
  });

  await page.goto("/pesanan");
  await expect(page.getByRole("heading", { name: "Pesanan" })).toBeVisible();
  await expect(page.getByText("Uang ditahan aman").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("penjual: pesanan masuk dan dompet", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await login(page, "081200000011");
  await page.goto("/jualan/pesanan");
  await expect(page.getByRole("heading", { name: "Pesanan masuk" })).toBeVisible();

  await page.goto("/jualan/dompet");
  await expect(page.getByRole("heading", { name: "Dompet toko" })).toBeVisible();
  await expect(page.getByText("Saldo siap ditarik")).toBeVisible();
  expect(errors).toEqual([]);
});

test("admin: dashboard, komplain, pencairan, dan demo console", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await login(page, "081200000001");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard admin" })).toBeVisible();

  await page.goto("/admin/komplain");
  await expect(page.getByRole("heading", { name: "Pusat resolusi" })).toBeVisible();

  await page.goto("/admin/pencairan");
  await expect(page.getByRole("heading", { name: "Pencairan saldo" })).toBeVisible();

  await page.goto("/dev");
  await expect(page.getByRole("heading", { name: "Demo console" })).toBeVisible();
  expect(errors).toEqual([]);
});
