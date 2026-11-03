import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  catalogQuerySchema,
  type CatalogPage,
  type CatalogQuery,
  type CategorySummary,
  type ProductDetail,
  type ShopDetail,
} from "@bakul/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  @ApiOperation({ summary: "Daftar kategori aktif" })
  categories(): Promise<CategorySummary[]> {
    return this.catalog.categories();
  }

  @Get("products")
  @ApiOperation({ summary: "Cari barang dengan filter kategori, kota, harga, dan rating" })
  search(
    @Query(new ZodValidationPipe(catalogQuerySchema)) query: CatalogQuery,
  ): Promise<CatalogPage> {
    return this.catalog.search(query);
  }

  @Get("products/:slug")
  @ApiOperation({ summary: "Detail barang beserta pilihan dan ulasan" })
  product(@Param("slug") slug: string): Promise<ProductDetail> {
    return this.catalog.productDetail(slug);
  }

  @Get("shops/:slug")
  @ApiOperation({ summary: "Halaman toko dan seluruh barang aktif" })
  shop(@Param("slug") slug: string): Promise<ShopDetail> {
    return this.catalog.shopDetail(slug);
  }
}
