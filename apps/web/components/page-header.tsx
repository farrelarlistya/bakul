import type { ReactNode } from "react";
import { eyebrowClass, pageTitleClass } from "@/components/ui";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

/**
 * Kepala halaman yang seragam: label kecil, judul besar, penjelasan singkat,
 * dan tempat untuk aksi. Semua halaman memakai pola ini agar hierarki
 * antarhalaman sama.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? <p className={eyebrowClass}>{eyebrow}</p> : null}
        <h1 className={`${pageTitleClass} mt-1`}>{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-base leading-6 text-tinta-lembut">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
