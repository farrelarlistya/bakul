import { Module } from "@nestjs/common";
import { SellerController } from "./seller.controller";
import { SellerEtalasesController } from "./seller-etalases.controller";
import { SellerProductsController } from "./seller-products.controller";
import { SellerService } from "./seller.service";
import { SellerProductsService } from "./seller-products.service";

@Module({
  controllers: [SellerController, SellerProductsController, SellerEtalasesController],
  providers: [SellerService, SellerProductsService],
})
export class SellerModule {}
