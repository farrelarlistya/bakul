import { Injectable, Logger } from "@nestjs/common";
import type { Notifier, NotifyInput } from "@bakul/shared";
import { maskPhone } from "./notifier.utils";

@Injectable()
export class MockNotifier implements Notifier {
  private readonly logger = new Logger(MockNotifier.name);

  async send(input: NotifyInput): Promise<void> {
    this.logger.log(
      `[NOTIF] ${input.channel} ${maskPhone(input.to)} ${input.template}`,
    );
  }
}
