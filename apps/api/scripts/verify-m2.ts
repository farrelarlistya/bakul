import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: "../../.env", quiet: true });
config({ quiet: true });

const BASE = process.env["API_BASE"] ?? "http://127.0.0.1:3001/api/v1";
const TEST_NAME = "Barang Verifikasi M2";
const TEST_ETALASE = "Etalase Verifikasi M2";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL belum diisi.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type AuthResult = { token: string };
type ProductResult = {
  id: string;
  slug: string;
  variants: { id: string; price: number; stockAvailable: number }[];
  images: { url: string }[];
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
  assert.equal(otpResponse.status, 201);
  const otp = (await otpResponse.json()) as { phone: string; demoCode?: string };

  const verifyResponse = await postJson("/auth/verify-otp", {
    phone: otp.phone,
    code: otp.demoCode,
  });
  assert.equal(verifyResponse.status, 200);
  const body = (await verifyResponse.json()) as { accessToken: string };
  return { token: body.accessToken };
}

function headers(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function json<T>(pathname: string, token?: string): Promise<T> {
  const response = await fetch(`${BASE}${pathname}`, {
    headers: token ? headers(token) : undefined,
  });
  assert.equal(response.status, 200, `${pathname} harus 200`);
  return (await response.json()) as T;
}

async function cleanup(): Promise<void> {
  const products = await prisma.product.findMany({
    where: { name: TEST_NAME },
    select: { id: true, images: { select: { url: true } } },
  });

  for (const image of products.flatMap((product) => product.images)) {
    const filename = image.url.split("/").pop();
    if (filename) {
      await unlink(
        path.resolve(process.cwd(), "../../storage/products", filename),
      ).catch(() => undefined);
    }
  }

  const ids = products.map((product) => product.id);
  await prisma.productImage.deleteMany({ where: { productId: { in: ids } } });
  await prisma.review.deleteMany({ where: { productId: { in: ids } } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } });
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
  await prisma.shopEtalase.deleteMany({ where: { name: TEST_ETALASE } });
  await prisma.otpCode.deleteMany({ where: { phone: "081200000011" } });
}

async function main(): Promise<void> {
  await cleanup();

  const categories = await json<{ id: string; slug: string; name: string }[]>(
    "/categories",
  );
  assert.equal(categories.length, 8, "harus ada 8 kategori");

  const all = await json<{ meta: { total: number }; products: unknown[] }>(
    "/products?limit=4",
  );
  assert.equal(all.meta.total, 100);
  assert.equal(all.products.length, 4);

  const search = await json<{ meta: { total: number } }>("/products?q=nastar&limit=48");
  assert.ok(search.meta.total >= 1, "pencarian nastar harus menemukan barang");

  const kue = await json<{ meta: { total: number } }>(
    "/products?category=kue-kering&limit=48",
  );
  assert.ok(kue.meta.total >= 1, "filter kategori harus bekerja");

  const bandung = await json<{ meta: { total: number } }>(
    "/products?city=Bandung&limit=48",
  );
  assert.equal(bandung.meta.total, 20);

  const murah = await json<{ meta: { total: number } }>(
    "/products?maxPrice=20000&limit=48",
  );
  assert.ok(murah.meta.total >= 1, "filter harga harus bekerja");

  const rating = await json<{ meta: { total: number } }>(
    "/products?rating=4.9&limit=48",
  );
  assert.ok(rating.meta.total >= 1, "filter rating harus bekerja");

  const sorted = await json<{ products: { price: number }[] }>(
    "/products?sort=harga-asc&limit=48",
  );
  for (let index = 1; index < sorted.products.length; index += 1) {
    const previous = sorted.products[index - 1];
    const current = sorted.products[index];
    if (previous && current) {
      assert.ok(previous.price <= current.price, "urutan harga harus naik");
    }
  }

  const detail = await json<{
    name: string;
    variants: unknown[];
    images: string[];
    reviews: unknown[];
  }>("/products/nastar-premium-001");
  assert.equal(detail.name, "Nastar Premium");
  assert.ok(detail.variants.length >= 1);
  assert.ok(detail.images.length >= 1);
  assert.ok(detail.reviews.length >= 1);

  const shop = await json<{ name: string; productCount: number }>(
    "/shops/dapur-bu-sri",
  );
  assert.equal(shop.name, "Dapur Bu Sri");
  assert.equal(shop.productCount, 20);

  console.log("PASS pencarian, filter kategori/kota/harga/rating, urutan, detail, toko");

  const seller = await login("081200000011");
  const etalases = await json<{ id: string; name: string }[]>(
    "/seller/etalases",
    seller.token,
  );
  assert.ok(etalases.length >= 2);

  const etalaseResponse = await fetch(`${BASE}/seller/etalases`, {
    method: "POST",
    headers: { ...headers(seller.token), "Content-Type": "application/json" },
    body: JSON.stringify({ name: TEST_ETALASE }),
  });
  assert.equal(etalaseResponse.status, 201);
  const etalase = (await etalaseResponse.json()) as { id: string };

  const category = categories.find((item) => item.slug === "makanan-ringan");
  assert.ok(category);

  const productBody = {
    name: TEST_NAME,
    categoryId: category.id,
    etalaseId: etalase.id,
    description: "Barang untuk bukti Sprint 5.",
    weightGram: 250,
    variants: [
      { name: "100 g", price: 15000, stockAvailable: 10 },
      { name: "250 g", price: 30000, stockAvailable: 5 },
    ],
  };

  const create = async () =>
    fetch(`${BASE}/seller/products`, {
      method: "POST",
      headers: { ...headers(seller.token), "Content-Type": "application/json" },
      body: JSON.stringify(productBody),
    });

  const firstResponse = await create();
  assert.equal(firstResponse.status, 201);
  const first = (await firstResponse.json()) as ProductResult;
  const secondResponse = await create();
  assert.equal(secondResponse.status, 201);
  const second = (await secondResponse.json()) as ProductResult;
  assert.notEqual(first.slug, second.slug, "slug harus unik");
  console.log("PASS slug unik dan produk + dua pilihan dibuat");

  const photo = await readFile(
    path.resolve(process.cwd(), "../../docs/desain/gambar/produk-keripik.jpg"),
  );
  const form = new FormData();
  form.set("photo", new Blob([photo], { type: "image/jpeg" }), "foto.jpg");
  const imageResponse = await fetch(`${BASE}/seller/products/${first.id}/images`, {
    method: "POST",
    headers: headers(seller.token),
    body: form,
  });
  assert.equal(imageResponse.status, 201);
  const image = (await imageResponse.json()) as { url: string };
  assert.ok(image.url.endsWith(".webp"), "foto harus WebP");

  const imageFile = await fetch(`http://127.0.0.1:3001${image.url}`);
  assert.equal(imageFile.status, 200);
  const imageBytes = (await imageFile.arrayBuffer()).byteLength;
  assert.ok(imageBytes <= 40 * 1024, "foto produk harus <= 40 KB");
  console.log(`PASS foto WebP ${Math.round(imageBytes / 1024)} KB`);

  const variant = first.variants[0];
  assert.ok(variant);
  const updateVariant = await fetch(
    `${BASE}/seller/products/${first.id}/variants/${variant.id}`,
    {
      method: "PATCH",
      headers: { ...headers(seller.token), "Content-Type": "application/json" },
      body: JSON.stringify({ price: 50000, stockAvailable: 7 }),
    },
  );
  assert.equal(updateVariant.status, 200);
  const updated = (await updateVariant.json()) as ProductResult;
  const updatedVariant = updated.variants.find((item) => item.id === variant.id);
  assert.equal(updatedVariant?.price, 50000);
  assert.equal(updatedVariant?.stockAvailable, 7);

  const addVariant = await fetch(`${BASE}/seller/products/${first.id}/variants`, {
    method: "POST",
    headers: { ...headers(seller.token), "Content-Type": "application/json" },
    body: JSON.stringify({ name: "500 g", price: 60000, stockAvailable: 3 }),
  });
  assert.equal(addVariant.status, 201);
  const withVariant = (await addVariant.json()) as ProductResult;
  assert.equal(withVariant.variants.length, 3);
  const newVariant = withVariant.variants.find((item) => item.name === "500 g");
  assert.ok(newVariant);

  const removeVariant = await fetch(
    `${BASE}/seller/products/${first.id}/variants/${newVariant.id}`,
    { method: "DELETE", headers: headers(seller.token) },
  );
  assert.equal(removeVariant.status, 200);
  console.log("PASS tambah/ubah/hapus pilihan dan stok");

  const setStatus = async (id: string, status: string) => {
    const response = await fetch(`${BASE}/seller/products/${id}/status`, {
      method: "PATCH",
      headers: { ...headers(seller.token), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    assert.equal(response.status, 200);
  };

  await setStatus(first.id, "INACTIVE");
  const oneVisible = await json<{ meta: { total: number } }>(
    `/products?q=${encodeURIComponent(TEST_NAME)}&limit=48`,
  );
  assert.equal(oneVisible.meta.total, 1);

  await setStatus(first.id, "ACTIVE");
  await setStatus(first.id, "DELETED");
  await setStatus(second.id, "DELETED");
  const gone = await json<{ meta: { total: number } }>(
    `/products?q=${encodeURIComponent(TEST_NAME)}&limit=48`,
  );
  assert.equal(gone.meta.total, 0, "barang terhapus harus hilang dari katalog");

  const sellerProducts = await json<{ status: string }[]>(
    "/seller/products",
    seller.token,
  );
  assert.ok(
    sellerProducts.some((product) => product.status === "DELETED"),
    "penjual tetap melihat barang terhapus",
  );
  console.log("PASS status nonaktif dan soft delete menyembunyikan dari katalog");

  const renamed = await fetch(`${BASE}/seller/etalases/${etalase.id}`, {
    method: "PATCH",
    headers: { ...headers(seller.token), "Content-Type": "application/json" },
    body: JSON.stringify({ name: `${TEST_ETALASE} Baru` }),
  });
  assert.equal(renamed.status, 200);
  const removed = await fetch(`${BASE}/seller/etalases/${etalase.id}`, {
    method: "DELETE",
    headers: headers(seller.token),
  });
  assert.equal(removed.status, 200);
  console.log("PASS CRUD etalase");
}

main()
  .catch((error: unknown) => {
    console.error("GAGAL verifikasi M2:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
