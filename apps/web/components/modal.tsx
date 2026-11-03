"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  icon?: IconName;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  labelledBy?: string;
};

/**
 * Dialog modal yang mengikuti aturan aksesibilitas: fokus berpindah ke dalam
 * dialog saat dibuka, terkurung di dalam dialog, Escape menutup, dan fokus
 * kembali ke pemicu setelah ditutup.
 */
export function Modal({
  open,
  title,
  description,
  icon = "info",
  children,
  footer,
  onClose,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null,
    );
    if (items.length === 0) {
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    restoreRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel;
    target?.focus();

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      trapFocus(event);
    }

    document.addEventListener("keydown", onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose, trapFocus]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-tinta/45"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-muncul relative w-full max-w-md rounded-t-hero bg-putih p-5 sm:rounded-hero"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pil bg-mint-muda text-teal-aksi">
            <Icon name={icon} size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold text-tinta">{title}</h2>
            {description ? (
              <p className="mt-1 text-base leading-6 text-tinta-lembut">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-m-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-tombol text-tinta-lembut transition duration-cepat ease-standar hover:bg-abu-kartu hover:text-tinta"
            aria-label="Tutup"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div> : null}
      </div>
    </div>
  );
}
