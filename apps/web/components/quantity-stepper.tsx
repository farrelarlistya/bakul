"use client";

import { Icon } from "@/components/icon";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  label?: string;
};

/**
 * Pengatur jumlah barang. Tombol punya target sentuh 44 px dan state
 * nonaktif yang jelas supaya pengguna tahu kenapa tidak bisa ditambah.
 */
export function QuantityStepper({
  value,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  disabled = false,
  onChange,
  label = "Jumlah barang",
}: QuantityStepperProps) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-tombol border border-garis bg-putih text-xl text-tinta transition duration-cepat ease-standar hover:border-garis-kuat hover:bg-abu-kartu active:scale-95 disabled:cursor-not-allowed disabled:border-garis-lembut disabled:bg-abu-kartu disabled:text-tinta-lembut disabled:active:scale-100"
        disabled={!canDecrease}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Kurangi jumlah"
      >
        <Icon name="minus" size={20} />
      </button>
      <span
        aria-live="polite"
        className="min-w-9 text-center text-lg font-semibold text-tinta"
      >
        {value}
      </span>
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-tombol border border-garis bg-putih text-xl text-tinta transition duration-cepat ease-standar hover:border-garis-kuat hover:bg-abu-kartu active:scale-95 disabled:cursor-not-allowed disabled:border-garis-lembut disabled:bg-abu-kartu disabled:text-tinta-lembut disabled:active:scale-100"
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Tambah jumlah"
      >
        <Icon name="plus" size={20} />
      </button>
    </div>
  );
}
