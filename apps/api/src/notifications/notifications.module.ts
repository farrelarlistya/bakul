import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Notifier } from "@bakul/shared";
import { FonnteNotifier } from "./fonnte.notifier";
import { MockNotifier } from "./mock.notifier";
import { NOTIFIER } from "./notifier.token";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NOTIFIER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Notifier => {
        const provider = config.get<string>("NOTIFIER_PROVIDER") ?? "mock";

        if (provider === "fonnte") {
          return new FonnteNotifier({
            token: config.getOrThrow<string>("FONNTE_TOKEN"),
            apiUrl: config.get<string>("FONNTE_API_URL") ?? "https://api.fonnte.com/send",
          });
        }

        return new MockNotifier();
      },
    },
  ],
  exports: [NotificationsService, NOTIFIER],
})
export class NotificationsModule {}
