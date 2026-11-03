"use client";

import { Icon, type IconName } from "@/components/icon";

type StatusBannerProps = {
  tone: "sukses" | "gagal" | "info" | "perhatian";
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
};

const TONE: Record<
  StatusBannerProps["tone"],
  { box: string; icon: IconName; iconClass: string }
> = {
  sukses: {
    box: "border-teal bg-mint-muda text-teal-tua",
    icon: "check",
    iconClass: "text-teal-aksi",
  },
  gagal: {
    box: "border-bahaya bg-bahaya-muda text-bahaya",
    icon: "warning",
    iconClass: "text-bahaya",
  },
  info: {
    box: "border-garis-kuat bg-abu-kartu text-tinta",
    icon: "info",
    iconClass: "text-teal-aksi",
  },
  perhatian: {
    box: "border-perhatian bg-krem text-perhatian-tua",
    icon: "warning",
    iconClass: "text-perhatian-tua",
  },
};

/**
 * Pesan status yang menempel di dalam konteks. Berbeda dari toast: banner
 * menjelaskan hal penting dan boleh ditutup.
 */
export function StatusBanner({
  tone,
  title,
  children,
  onDismiss,
  className = "",
}: StatusBannerProps) {
  const style = TONE[tone];

  return (
    <div
      role={tone === "gagal" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-kartu border p-3 ${style.box} ${className}`}
    >
      <Icon name={style.icon} size={20} className={`mt-0.5 shrink-0 ${style.iconClass}`} />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="text-base font-semibold leading-6">{title}</p>
        ) : null}
        <div className="text-base leading-6">{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-tombol transition duration-cepat ease-standar hover:bg-putih/60"
          aria-label="Tutup pesan"
        >
          <Icon name="close" size={18} />
        </button>
      ) : null}
    </div>
  );
}
