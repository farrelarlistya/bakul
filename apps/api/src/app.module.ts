import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ClockModule } from "./common/clock/clock.module";
import { StorageModule } from "./common/storage/storage.module";
import { validateEnv } from "./config/env";
import { FilesModule } from "./files/files.module";
import { HealthModule } from "./health/health.module";
import { MeModule } from "./me/me.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SellerModule } from "./seller/seller.module";

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
    StorageModule,
    AuthModule,
    CatalogModule,
    MeModule,
    OnboardingModule,
    SellerModule,
    AdminModule,
    NotificationsModule,
    FilesModule,
    HealthModule,
  ],
})
export class AppModule {}
