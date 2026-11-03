import { Module } from "@nestjs/common";
import { LedgerModule } from "../ledger/ledger.module";
import {
  WalletController,
  WithdrawalProofController,
  WithdrawalsController,
} from "./wallet.controller";
import { WalletService } from "./wallet.service";

@Module({
  imports: [LedgerModule],
  controllers: [WalletController, WithdrawalsController, WithdrawalProofController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
