import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    primary?: boolean;
  };
  children?: ReactNode;
  className?: string;
};

/**
 * Tampilan saat tidak ada isi. Memberi penjelasan singkat dan jalan keluar
 * yang jelas supaya halaman kosong tidak terasa buntu.
 */
export function EmptyState({
  icon = "box",
  title,
  description,
  action,
  children,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-kartu border border-dashed border-garis-kuat bg-abu-kartu p-6 text-center ${className}`}
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-pil bg-putih text-teal-aksi">
        <Icon name={icon} size={26} />
      </span>
      <p className="mt-4 font-display text-xl font-bold text-tinta">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-base leading-6 text-tinta-lembut">
          {description}
        </p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className={`${action.primary === false ? secondaryButtonClass : primaryButtonClass} mt-5`}
        >
          {action.label}
        </Link>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
