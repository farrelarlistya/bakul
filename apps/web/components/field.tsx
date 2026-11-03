"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { fieldErrorClass, hintClass, labelClass } from "@/components/ui";

type FieldProps = {
  label: string;
  htmlFor: string;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => ReactNode;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
};

/**
 * Pembungkus field form. Menyatukan label, petunjuk, dan pesan kesalahan
 * sekaligus menyambungkan `aria-describedby` serta `aria-invalid` ke kontrol.
 */
export function Field({
  label,
  htmlFor,
  children,
  hint,
  error,
  required = false,
  className = "",
}: FieldProps) {
  const hintId = useId();
  const errorId = useId();
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required ? (
          <span className="ml-1 font-normal text-tinta-lembut">(wajib)</span>
        ) : null}
      </label>
      {children({
        id: htmlFor,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint ? (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={`${fieldErrorClass} flex items-start gap-1`}>
          <Icon name="warning" size={16} className="mt-1 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
