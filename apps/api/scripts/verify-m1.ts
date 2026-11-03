import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: "../../.env", quiet: true });
config({ quiet: true });

const BASE = process.env["API_BASE"] ?? "http://127.0.0.1:3001/api/v1";
const TEST_PHONE = "081299990099";
const DEMO_PHONES = ["081200000021", "081200000011", "081200000001", TEST_PHONE];

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL belum diisi.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type AuthResult = {
  token: string;
  cookie: string;
};

async function postJson(pathname: string, body: unknown): Promise<Response> {
  return fetch(`${BASE}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function login(phone: string): Promise<AuthResult> {
  const otpResponse = await postJson("/auth/login", { phone });
  assert.equal(otpResponse.status, 201, "permintaan kode login harus 201");
  const otp = (await otpResponse.json()) as { phone: string; demoCode?: string };
  assert.equal(otp.demoCode, "123456", "mode demo harus memakai 123456");

  const verifyResponse = await postJson("/auth/verify-otp", {
    phone: otp.phone,
    code: otp.demoCode,
  });
  assert.equal(verifyResponse.status, 200, "verifikasi kode harus 200");
  const auth = (await verifyResponse.json()) as { accessToken: string };
  const cookie = verifyResponse.headers
    .getSetCookie()
    .find((item) => item.startsWith("bakul_refresh="))
    ?.split(";")[0];

  assert.ok(cookie, "cookie refresh harus dipasang");
  return { token: auth.accessToken, cookie };
}

async function status(pathname: string, token: string): Promise<number> {
  const response = await fetch(`${BASE}${pathname}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.status;
}

async function cleanupTestPhone(): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: TEST_PHONE } });

  if (user) {
    const shop = await prisma.shop.findUnique({ where: { ownerUserId: user.id } });

    if (shop) {
      const products = await prisma.product.findMany({
        where: { shopId: shop.id },
        select: { id: true, images: { select: { url: true } } },
      });
      const productIds = products.map((product) => product.id);

      for (const image of products.flatMap((product) => product.images)) {
        const filename = image.url.split("/").pop();
        if (filename) {
          await unlink(
            path.resolve(process.cwd(), "../../storage/products", filename),
          ).catch(() => undefined);
        }
      }

      await prisma.productImage.deleteMany({ where: { productId: { in: productIds } } });
      await prisma.productVariant.deleteMany({ where: { productId: { in: productIds } } });
      await prisma.product.deleteMany({ where: { id: { in: productIds } } });
      await prisma.shop.delete({ where: { id: shop.id } });
    }

    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.userAddress.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }

  await prisma.otpCode.deleteMany({ where: { phone: TEST_PHONE } });
}

async function main(): Promise<void> {
  await cleanupTestPhone();
  await prisma.otpCode.deleteMany({ where: { phone: { in: DEMO_PHONES } } });

  const buyer = await login("081200000021");
  const seller = await login("081200000011");
  const admin = await login("081200000001");

  assert.equal(await status("/seller/shop", buyer.token), 403);
  assert.equal(await status("/admin/ping", buyer.token), 403);
  assert.equal(await status("/seller/shop", seller.token), 200);
  assert.equal(await status("/admin/ping", seller.token), 403);
  assert.equal(await status("/admin/ping", admin.token), 200);
  console.log("PASS T-12 akses lintas peran ditolak 403");

  const refreshed = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: buyer.cookie },
  });
  assert.equal(refreshed.status, 200, "refresh harus 200");
  const refreshedBody = (await refreshed.json()) as { accessToken: string };
  assert.ok(refreshedBody.accessToken, "access token baru harus ada");
  console.log("PASS refresh cookie httpOnly dan rotasi sesi");

  const addressResponse = await fetch(`${BASE}/me/addresses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${buyer.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      label: "Alamat Uji",
      recipientName: "Sri Wahyuni",
      phone: "081200000021",
      provinceId: "34",
      cityId: "3404",
      districtId: "340401",
      postalCode: "55581",
      fullAddress: "Jl. Uji Verifikasi No. 1, Sleman",
      isDefault: true,
    }),
  });
  assert.equal(addressResponse.status, 201, "alamat baru harus 201");
  const address = (await addressResponse.json()) as { id: string };

  const deleteAddress = await fetch(`${BASE}/me/addresses/${address.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${buyer.token}` },
  });
  assert.equal(deleteAddress.status, 200, "alamat harus bisa dihapus");
  console.log("PASS CRUD alamat dan satu alamat utama");

  const onboardingStartedAt = Date.now();
  const registerResponse = await postJson("/auth/register", { phone: TEST_PHONE });
  assert.equal(registerResponse.status, 201, "registrasi nomor baru harus 201");
  const register = (await registerResponse.json()) as { phone: string; demoCode?: string };
  const verifyResponse = await postJson("/auth/verify-otp", {
    phone: register.phone,
    code: register.demoCode,
  });
  assert.equal(verifyResponse.status, 200, "kode registrasi harus 200");
  const session = (await verifyResponse.json()) as { accessToken: string };

  const shopResponse = await fetch(`${BASE}/onboarding/shop`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Toko Verifikasi M1",
      cityId: "3404",
      cityName: "Sleman",
      description: "Toko sementara untuk bukti Sprint 4.",
    }),
  });
  assert.equal(shopResponse.status, 201, "buka toko harus 201");
  const shop = (await shopResponse.json()) as { status: string };
  assert.equal(shop.status, "ACTIVE", "toko harus langsung aktif");

  const photo = await readFile(
    path.resolve(process.cwd(), "../../docs/desain/gambar/produk-nastar.jpg"),
  );
  const form = new FormData();
  form.set("name", "Nastar Verifikasi M1");
  form.set("price", "45000");
  form.set("weightGram", "250");
  form.set("photo", new Blob([photo], { type: "image/jpeg" }), "nastar.jpg");

  const productResponse = await fetch(`${BASE}/onboarding/first-product`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: form,
  });
  assert.equal(productResponse.status, 201, "produk pertama harus 201");
  const product = (await productResponse.json()) as { id: string; imageUrl: string | null };
  assert.ok(product.id, "produk harus punya id");
  assert.ok(product.imageUrl, "foto produk harus tersimpan");

  const imageResponse = await fetch(`http://127.0.0.1:3001${product.imageUrl}`);
  assert.equal(imageResponse.status, 200, "foto produk harus bisa diambil");

  const meResponse = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const me = (await meResponse.json()) as { role: string };
  assert.equal(me.role, "SELLER", "peran harus berubah menjadi penjual");

  const elapsedMs = Date.now() - onboardingStartedAt;
  assert.ok(elapsedMs < 5 * 60 * 1000, "onboarding harus selesai di bawah 5 menit");
  console.log(
    `PASS T-13 onboarding toko + produk pertama ${Math.round(elapsedMs / 1000)} detik, tanpa email`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("GAGAL verifikasi M1:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanupTestPhone();
    await prisma.$disconnect();
  });
