import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  tone?: "netral" | "teal" | "krem" | "bahaya";
  emphasis?: boolean;
  className?: string;
  children?: ReactNode;
};

const TONE: Record<
  NonNullable<MetricCardProps["tone"]>,
  { box: string; value: string; iconClass: string }
> = {
  netral: { box: "border-garis bg-putih", value: "text-tinta", iconClass: "text-tinta-lembut" },
  teal: { box: "border-teal bg-mint-muda", value: "text-teal-tua", iconClass: "text-teal-aksi" },
  krem: { box: "border-garis bg-krem", value: "text-tinta", iconClass: "text-perhatian-tua" },
  bahaya: {
    box: "border-bahaya bg-bahaya-muda",
    value: "text-bahaya",
    iconClass: "text-bahaya",
  },
};

/**
 * Kartu angka. Nilai besar, label di atas, konteks di bawah, plus ikon
 * supaya angka mudah dipindai.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "netral",
  emphasis = false,
  className = "",
  children,
}: MetricCardProps) {
  const style = TONE[tone];

  return (
    <div className={`rounded-kartu border p-4 ${style.box} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-base leading-5 text-tinta-lembut">{label}</p>
        {icon ? (
          <span className={`shrink-0 ${style.iconClass}`}>
            <Icon name={icon} size={20} />
          </span>
        ) : null}
      </div>
      <p
        className={`mt-2 font-bold leading-tight ${style.value} ${
          emphasis ? "font-display text-3xl" : "text-xl"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-base leading-5 text-tinta-lembut">{hint}</p> : null}
      {children}
    </div>
  );
}
