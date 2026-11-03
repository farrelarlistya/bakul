import { Module } from "@nestjs/common";
import { LedgerModule } from "../ledger/ledger.module";
import { MockPgController } from "./mock-pg.controller";
import { MockPgService } from "./mock-pg.service";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { WebhooksController } from "./webhooks.controller";

@Module({
  imports: [LedgerModule],
  controllers: [PaymentsController, WebhooksController, MockPgController],
  providers: [MockPgService, PaymentsService],
  exports: [MockPgService, PaymentsService],
})
export class PaymentsModule {}
