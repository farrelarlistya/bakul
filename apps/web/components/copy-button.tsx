"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { secondaryButtonClass } from "@/components/ui";

type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

/**
 * Tombol salin. Memberi umpan balik singkat saat berhasil tanpa memindahkan
 * perhatian pengguna.
 */
export function CopyButton({
  value,
  label = "Salin kode",
  copiedLabel = "Tersalin",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function salin(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void salin()}
      aria-live="polite"
      className={`${secondaryButtonClass} ${className}`}
    >
      <Icon name={copied ? "check" : "copy"} size={18} />
      {copied ? copiedLabel : label}
    </button>
  );
}
