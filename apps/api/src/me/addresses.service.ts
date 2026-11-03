import { Injectable, NotFoundException } from "@nestjs/common";
import type { Address, AddressInput, AddressUpdateInput } from "@bakul/shared";
import { PrismaService } from "../prisma/prisma.service";

type AddressRow = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  districtId: string;
  postalCode: string;
  fullAddress: string;
  isDefault: boolean;
};

export function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    label: row.label,
    recipientName: row.recipientName,
    phone: row.phone,
    provinceId: row.provinceId,
    cityId: row.cityId,
    districtId: row.districtId,
    postalCode: row.postalCode,
    fullAddress: row.fullAddress,
    isDefault: row.isDefault,
  };
}

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Address[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return addresses.map(toAddress);
  }

  async create(userId: string, input: AddressInput): Promise<Address> {
    const existing = await this.prisma.userAddress.count({ where: { userId } });
    const makeDefault = input.isDefault ?? existing === 0;

    const address = await this.prisma.$transaction(async (transaction) => {
      if (makeDefault) {
        await transaction.userAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return transaction.userAddress.create({
        data: {
          userId,
          label: input.label,
          recipientName: input.recipientName,
          phone: input.phone,
          provinceId: input.provinceId,
          cityId: input.cityId,
          districtId: input.districtId,
          postalCode: input.postalCode,
          fullAddress: input.fullAddress,
          isDefault: makeDefault,
        },
      });
    });

    return toAddress(address);
  }

  async update(userId: string, addressId: string, input: AddressUpdateInput): Promise<Address> {
    await this.ensureOwned(userId, addressId);

    const address = await this.prisma.$transaction(async (transaction) => {
      if (input.isDefault === true) {
        await transaction.userAddress.updateMany({
          where: { userId, isDefault: true, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

      return transaction.userAddress.update({
        where: { id: addressId },
        data: input,
      });
    });

    return toAddress(address);
  }

  async remove(userId: string, addressId: string): Promise<{ ok: true }> {
    const address = await this.ensureOwned(userId, addressId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.userAddress.delete({ where: { id: addressId } });

      if (address.isDefault) {
        const next = await transaction.userAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });

        if (next) {
          await transaction.userAddress.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { ok: true };
  }

  private async ensureOwned(userId: string, addressId: string): Promise<AddressRow> {
    const address = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new NotFoundException({
        code: "ADDRESS_NOT_FOUND",
        message: "Alamat tidak ditemukan.",
      });
    }

    return address;
  }
}
