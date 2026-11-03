import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  COURIERS,
  COURIER_SERVICES,
  WILAYAH,
  courierName,
  serviceName,
  type Rate,
  type RateInput,
  type TrackingEvent,
} from "@bakul/shared";
import { createHash } from "node:crypto";
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";

const PROVINCE_BY_CITY = new Map(WILAYAH.map((item) => [item.cityId, item.provinceId]));
const ISLAND_BY_PROVINCE: Record<string, string> = {
  "31": "Jawa",
  "32": "Jawa",
  "33": "Jawa",
  "34": "Jawa",
  "35": "Jawa",
  "36": "Jawa",
  "51": "Bali",
  "52": "Nusa Tenggara",
};
const ZONE_RATE: Record<string, number> = {
  Z1: 9_000,
  Z2: 13_000,
  Z3: 20_000,
  Z4: 29_000,
};

export type ShipmentTimelineInput = {
  id: string;
  createdAt: Date;
  courierCode: string;
  courierName: string;
  serviceType: string;
  awb: string;
  originCity: string;
  destinationCity: string;
  destinationDistrict: string | null;
  recipientName: string;
};

export type TimelineResult = {
  events: TrackingEvent[];
  status: string;
  deliveredAt: Date | null;
};

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  zoneFor(originCityId: string, destinationCityId: string): string {
    if (originCityId === destinationCityId) {
      return "Z1";
    }

    const originProvince = PROVINCE_BY_CITY.get(originCityId);
    const destinationProvince = PROVINCE_BY_CITY.get(destinationCityId);

    if (originProvince && destinationProvince) {
      if (originProvince === destinationProvince) {
        return "Z2";
      }
      if (ISLAND_BY_PROVINCE[originProvince] === ISLAND_BY_PROVINCE[destinationProvince]) {
        return "Z3";
      }
    }

    return "Z4";
  }

  getRates(input: RateInput): Rate[] {
    const zone = this.zoneFor(input.originCityId, input.destinationCityId);
    const baseRate = ZONE_RATE[zone] ?? ZONE_RATE["Z4"]!;
    const weightKg = Math.max(1, Math.ceil(input.weightGram / 1_000));
    const rates: Rate[] = [];

    const allowedCouriers = COURIERS.filter((courier) =>
      input.couriers.includes(courier.code),
    );

    for (const courier of allowedCouriers) {
      for (const service of COURIER_SERVICES) {
        if (!(courier.services as readonly string[]).includes(service.code)) {
          continue;
        }
        if (input.services && !input.services.includes(service.code)) {
          continue;
        }

        const raw = weightKg * baseRate * courier.multiplier * service.multiplier;
        rates.push({
          courier: courier.code,
          courierName: courier.name,
          service: service.code,
          serviceName: service.name,
          etd: service.etd,
          cost: Math.round(raw / 100) * 100,
        });
      }
    }

    return rates.sort((a, b) => a.cost - b.cost);
  }

  awbFor(invoiceId: string, courier: string): string {
    const digest = createHash("sha256").update(invoiceId).digest("hex");
    let digits = "";
    for (let index = 0; digits.length < 20; index += 1) {
      const byte = Number.parseInt(digest.slice((index * 2) % 60, (index * 2) % 60 + 2), 16);
      digits += String(byte % 10);
    }

    switch (courier) {
      case "JNE":
        return digits.slice(0, 15);
      case "JNT":
        return `JP${digits.slice(0, 10)}`;
      case "SICEPAT":
        return `00${digits.slice(0, 12)}`;
      case "ANTERAJA":
        return `100${digits.slice(0, 10)}`;
      case "POS":
        return `P${digits.slice(0, 12)}`;
      default:
        return digits.slice(0, 15);
    }
  }

  async labelPdf(input: {
    awb: string;
    courierCode: string;
    courierName: string;
    serviceType: string;
    invoiceNumber: string;
    originName: string;
    originCity: string;
    originPhone: string;
    recipientName: string;
    recipientPhone: string;
    destinationCity: string;
    destinationDistrict: string | null;
    destinationPostal: string;
    fullAddress: string;
    weightGram: number;
    itemCount: number;
  }): Promise<Buffer> {
    const doc = new PDFDocument({
      size: [100 * 2.83465, 150 * 2.83465],
      margin: 12,
      info: { Title: `Label ${input.awb}` },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    doc.fillOpacity(0.1);
    doc.save();
    doc.translate(120, 260);
    doc.rotate(-45);
    doc.font("Helvetica-Bold").fontSize(64).fillColor("#000000").text("DEMO", 0, 0);
    doc.restore();
    doc.fillOpacity(1);

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#14201B").text(input.courierName);
    doc.font("Helvetica").fontSize(8).fillColor("#5C6B64");
    doc.text(`${input.serviceType} · ${input.invoiceNumber}`);

    const png = await bwipjs.toBuffer({
      bcid: "code128",
      text: input.awb,
      scale: 2,
      height: 10,
      includetext: true,
      textxalign: "center",
      textsize: 8,
    });
    doc.image(png, 12, 42, { width: 260, height: 42 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#14201B").text(input.awb, 12, 88);

    doc.moveTo(12, 102).lineTo(272, 102).strokeColor("#E6E6E6").stroke();

    doc.font("Helvetica-Bold").fontSize(8).text("PENGIRIM", 12, 108);
    doc.font("Helvetica").fontSize(7.5);
    doc.text(`${input.originName} · ${input.originCity}`, 12, 120, { width: 120 });
    doc.text(input.originPhone, 12, 140, { width: 120 });

    doc.font("Helvetica-Bold").fontSize(8).text("PENERIMA", 142, 108);
    doc.font("Helvetica").fontSize(7.5);
    doc.text(input.recipientName, 142, 120, { width: 125 });
    doc.text(input.recipientPhone, 142, 131, { width: 125 });
    doc.text(
      `${input.fullAddress}, ${input.destinationDistrict ?? ""} ${input.destinationCity} ${input.destinationPostal}`,
      142,
      142,
      { width: 125, height: 40 },
    );

    doc.font("Helvetica").fontSize(7.5).fillColor("#5C6B64");
    doc.text(
      `Berat ${input.weightGram} g · ${input.itemCount} barang · 1 koli`,
      12,
      360,
      { width: 260 },
    );
    doc.text("Tanda tangan kurir: ____________________", 12, 385, { width: 260 });

    doc.end();
    return done;
  }

  buildTimeline(
    shipment: ShipmentTimelineInput,
    now: Date,
    existing: TrackingEvent[] = [],
  ): TimelineResult {
    const steps: { status: string; label: string; note: string; location: string; hours: number }[] = [
      {
        status: "PICKED_UP",
        label: "Paket diambil kurir",
        note: `Paket sudah diambil kurir di ${shipment.originCity}.`,
        location: shipment.originCity,
        hours: 0,
      },
      {
        status: "IN_TRANSIT",
        label: "Paket dalam perjalanan",
        note: `Paket tiba di hub ${shipment.originCity}.`,
        location: `Hub ${shipment.originCity}`,
        hours: 3,
      },
      {
        status: "IN_TRANSIT",
        label: "Paket dalam perjalanan",
        note: `Paket transit menuju ${shipment.destinationCity}.`,
        location: "Hub transit",
        hours: 14,
      },
      {
        status: "ARRIVED_AT_DESTINATION",
        label: "Paket sampai di kota tujuan",
        note: `Paket tiba di ${shipment.destinationCity}.`,
        location: shipment.destinationCity,
        hours: 26,
      },
      {
        status: "OUT_FOR_DELIVERY",
        label: "Paket sedang diantar",
        note: "Kurir menuju alamat penerima.",
        location: shipment.destinationDistrict ?? shipment.destinationCity,
        hours: 30,
      },
      {
        status: "DELIVERED",
        label: "Paket sudah sampai",
        note: `Paket diterima di ${shipment.destinationCity}.`,
        location: shipment.destinationDistrict ?? shipment.destinationCity,
        hours: 32,
      },
    ];

    const events = [...existing];
    let status = existing.at(-1)?.status ?? "AWB_CREATED";
    let deliveredAt: Date | null = null;

    for (const step of steps) {
      const at = new Date(shipment.createdAt.getTime() + step.hours * 60 * 60 * 1000);
      if (at > now) {
        continue;
      }
      if (events.some((event) => event.status === step.status && event.at === at.toISOString())) {
        continue;
      }
      // IN_TRANSIT muncul dua kali; cukup tambah bila menitnya berbeda.
      if (
        events.some(
          (event) =>
            event.status === step.status &&
            event.note === step.note &&
            event.at === at.toISOString(),
        )
      ) {
        continue;
      }

      events.push({
        status: step.status,
        label: step.label,
        note: step.note,
        location: step.location,
        at: at.toISOString(),
      });
      status = step.status;
      if (step.status === "DELIVERED") {
        deliveredAt = at;
      }
    }

    events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    return { events, status, deliveredAt };
  }

  trackingView(shipment: {
    awb: string;
    courierCode: string;
    courierName: string;
    serviceType: string;
    shippingStatus: string;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    labelUrl: string | null;
    trackingHistory: unknown;
  }) {
    return {
      id: "",
      awb: shipment.awb,
      courierCode: shipment.courierCode,
      courierName: shipment.courierName,
      serviceType: serviceName(shipment.serviceType),
      shippingStatus: shipment.shippingStatus,
      shippedAt: shipment.shippedAt?.toISOString() ?? null,
      deliveredAt: shipment.deliveredAt?.toISOString() ?? null,
      labelUrl: shipment.labelUrl,
      events: this.asEvents(shipment.trackingHistory),
    };
  }

  asEvents(value: unknown): TrackingEvent[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is TrackingEvent => {
      return (
        typeof item === "object" &&
        item !== null &&
        "status" in item &&
        "label" in item &&
        "at" in item
      );
    });
  }

  courierLabel(code: string): string {
    return courierName(code);
  }

  handleMissingAwb(awb: string): never {
    this.logger.warn(`AWB tidak ditemukan: ${awb}`);
    throw new NotFoundException({
      code: "TRACKING_NOT_FOUND",
      message: "Nomor resi tidak ditemukan. Periksa lagi nomornya.",
    });
  }
}
