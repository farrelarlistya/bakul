import { expect, test, type Page } from "@playwright/test";

/**
 * Tangkapan layar bukti poles UI/UX.
 *
 * Default menulis ke `test-results/bukti/` (gitignored) supaya `npm run
 * test:e2e` tidak mengubah berkas repo. Set `BAKUL_BUKTI_DIR` untuk menyalin
 * ulang ke `docs/desain/ekspor/`.
 */
const OUT = process.env.BAKUL_BUKTI_DIR ?? "test-results/bukti";

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

test("bukti tangkapan layar polish UI/UX", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  // 1. Beranda pembeli (390 px)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("heading", { name: "Halo, Sobat Bakul" }).waitFor();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/polish-01-beranda-mobile.png`, fullPage: true });

  // 2. Cari dengan chip filter
  await page.goto("/cari");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/polish-02-cari.png`, fullPage: true });

  // 3. Detail barang
  await page.goto("/p/nastar-premium-001");
  await page.getByRole("heading", { name: "Nastar Premium" }).waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/polish-03-detail.png`, fullPage: true });

  // 4. Toko
  const shops = await page.evaluate(async () => {
    const response = await fetch("/api/v1/products?limit=1");
    const data = (await response.json()) as { products: Array<{ shopSlug: string }> };
    return data.products[0]?.shopSlug ?? "";
  });
  if (shops) {
    await page.goto(`/toko/${shops}`);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/polish-04-toko.png`, fullPage: true });
  }

  // 5. Keranjang kosong (empty state)
  await page.goto("/keranjang");
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/polish-05-keranjang-kosong.png`, fullPage: true });

  // 6. Masuk (form OTP)
  await page.goto("/masuk");
  await page.locator("#phone").fill("081200000021");
  await page.getByRole("button", { name: "Kirim kode" }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/polish-06-masuk-otp.png`, fullPage: true });

  // 7. Akun pembeli
  await login(page, "081200000021");
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/polish-07-akun.png`, fullPage: true });

  // 8. Pesanan pembeli
  await page.goto("/pesanan");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/polish-08-pesanan.png`, fullPage: true });

  // 9. Inbox
  await page.goto("/inbox");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/polish-09-inbox.png`, fullPage: true });

  // 10. Admin dashboard (desktop 1440)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.context().clearCookies();
  await page.goto("/masuk");
  await page.locator("#phone").fill("081200000001");
  await page.getByRole("button", { name: "Kirim kode" }).click();
  const adminBoxes = page.locator('input[aria-label^="Angka"]');
  await adminBoxes.first().waitFor();
  for (let index = 0; index < 6; index += 1) {
    await adminBoxes.nth(index).fill("123456"[index] ?? "");
  }
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForTimeout(1200);

  await page.goto("/admin");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/polish-10-admin-dashboard.png`, fullPage: true });

  // 11. Pusat resolusi admin
  await page.goto("/admin/komplain");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/polish-11-admin-komplain.png`, fullPage: true });

  // 12. Demo console
  await page.goto("/dev");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/polish-12-demo-console.png`, fullPage: true });

  // 13. Dialog konfirmasi in-app
  await page.goto("/admin/komplain");
  await page.waitForTimeout(1500);
  const simpan = page.getByRole("button", { name: "Simpan keputusan" }).first();
  if (await simpan.count()) {
    await simpan.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/polish-13-dialog.png` });
  }

  // 14. Beranda desktop (1440) — navbar dan grid 4 kolom
  await page.context().clearCookies();
  await page.goto("/");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/polish-14-beranda-desktop.png`, fullPage: true });

  expect(errors).toEqual([]);
});
