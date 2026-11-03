import { describe, expect, it } from "vitest";
import { catalogQuerySchema } from "../src/catalog";
import { productInputSchema } from "../src/seller";
import { slugify } from "../src/slug";

describe("slug dan katalog", () => {
  it("membuat slug yang aman dan tidak kosong", () => {
    expect(slugify("Nastar Premium!")).toBe("nastar-premium");
    expect(slugify("Batik Parang 2 m")).toBe("batik-parang-2-m");
    expect(slugify("  ")).toBe("");
  });

  it("mengisi nilai default pencarian", () => {
    const query = catalogQuerySchema.parse({});
    expect(query.sort).toBe("terbaru");
    expect(query.page).toBe(1);
    expect(query.limit).toBe(12);
  });

  it("mengubah angka dari query string", () => {
    const query = catalogQuerySchema.parse({
      minPrice: "10000",
      maxPrice: "50000",
      rating: "4.5",
      sort: "harga-asc",
    });
    expect(query.minPrice).toBe(10000);
    expect(query.maxPrice).toBe(50000);
    expect(query.rating).toBe(4.5);
  });

  it("menolak rentang harga terbalik", () => {
    expect(
      catalogQuerySchema.safeParse({ minPrice: "50000", maxPrice: "10000" }).success,
    ).toBe(false);
  });

  it("memvalidasi produk penjual dan varian", () => {
    const product = productInputSchema.parse({
      name: "Nastar Baru",
      categoryId: "6f1c2a9e-6f1e-4f6e-9f6e-6f1e6f1e6f1e",
      weightGram: "250",
      variants: [{ name: "250 g", price: "45000", stockAvailable: "10" }],
    });
    expect(product.variants[0]?.price).toBe(45000);
    expect(
      productInputSchema.safeParse({
        name: "X",
        categoryId: "bukan-uuid",
        variants: [],
      }).success,
    ).toBe(false);
  });
});
