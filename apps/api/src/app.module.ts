import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { CartModule } from "./cart/cart.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CheckoutModule } from "./checkout/checkout.module";
import { ClockModule } from "./common/clock/clock.module";
import { InventoryModule } from "./common/inventory/inventory.module";
import { StorageModule } from "./common/storage/storage.module";
import { validateEnv } from "./config/env";
import { DemoModule } from "./demo/demo.module";
import { DisputesModule } from "./disputes/disputes.module";
import { FilesModule } from "./files/files.module";
import { HealthModule } from "./health/health.module";
import { LedgerModule } from "./ledger/ledger.module";
import { MeModule } from "./me/me.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { SellerModule } from "./seller/seller.module";
import { ShippingModule } from "./shipping/shipping.module";
import { WalletModule } from "./wallet/wallet.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ["../../.env", ".env"],
      validate: validateEnv,
    }),
    PrismaModule,
    ClockModule,
    InventoryModule,
    StorageModule,
    AuthModule,
    CatalogModule,
    MeModule,
    OnboardingModule,
    SellerModule,
    CartModule,
    ShippingModule,
    LedgerModule,
    PaymentsModule,
    CheckoutModule,
    OrdersModule,
    WalletModule,
    DisputesModule,
    AdminModule,
    NotificationsModule,
    FilesModule,
    DemoModule,
    SchedulerModule,
    HealthModule,
  ],
})
export class AppModule {}
