import { Module } from "@nestjs/common";
import { AddressesController } from "./addresses.controller";
import { AddressesService } from "./addresses.service";
import { MeController } from "./me.controller";

@Module({
  controllers: [MeController, AddressesController],
  providers: [AddressesService],
})
export class MeModule {}
