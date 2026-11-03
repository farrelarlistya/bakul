export type CreateChargeInput = {
  reference: string;
  amount: number;
  method: string;
  expiresAt: Date;
};

export type ChargeResult = {
  providerRef: string;
  paymentCode: string;
  expiresAt: Date;
};

export type WebhookEvent = {
  eventId: string;
  event: string;
  chargeId: string;
  paidAmount: number;
  paidAt: string;
};

export type RefundResult = {
  providerRef: string;
  amount: number;
  status: "REFUNDED";
};

export interface PaymentProvider {
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  verifyWebhook(rawBody: string, headers: Record<string, string>): WebhookEvent;
  refund(chargeId: string, amount: number): Promise<RefundResult>;
}

export type RateInput = {
  originCityId: string;
  destinationCityId: string;
  weightGram: number;
  couriers: string[];
  services?: string[];
};

export type Rate = {
  courier: string;
  courierName: string;
  service: string;
  serviceName: string;
  etd: string;
  cost: number;
};

export type ShipmentInput = {
  invoiceId: string;
  courier: string;
  service: string;
  originCityId: string;
  destinationCityId: string;
  weightGram: number;
};

export type ShipmentResult = {
  awb: string;
  labelUrl: string;
};

export type TrackingEvent = {
  status: string;
  label: string;
  note: string;
  location: string;
  at: string;
};

export interface LogisticsProvider {
  getRates(input: RateInput): Promise<Rate[]>;
  createShipment(input: ShipmentInput): Promise<ShipmentResult>;
  track(awb: string): Promise<TrackingEvent[]>;
}

export type NotifyInput = {
  channel: "IN_APP" | "EMAIL" | "WHATSAPP";
  to: string;
  template: string;
  data: Record<string, unknown>;
};

export interface Notifier {
  send(input: NotifyInput): Promise<void>;
}

export interface StorageAdapter {
  put(key: string, buffer: Buffer, mime: string): Promise<string>;
  getUrl(key: string): string;
}
