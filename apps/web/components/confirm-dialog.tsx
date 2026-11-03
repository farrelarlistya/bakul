"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { dangerButtonClass, ghostButtonClass, primaryButtonClass } from "@/components/ui";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Konfirmasi dalam aplikasi. Menggantikan `window.confirm` supaya pesan
 * folgt bahasa Bakul dan tampilannya konsisten.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      icon={danger ? "warning" : "info"}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className={ghostButtonClass} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? dangerButtonClass : primaryButtonClass}
            onClick={onConfirm}
            data-autofocus
          >
            {confirmLabel}
          </button>
        </>
      }
    />
  );
}

/**
 * Pembantu state untuk mengelola dialog konfirmasi tanpa menulis ulang
 * `useState` di setiap halaman.
 */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    danger?: boolean;
    action: (() => void) | null;
  }>({
    open: false,
    title: "",
    action: null,
  });

  function ask(options: {
    title: string;
    description?: string;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
  }): void {
    setState({
      open: true,
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel,
      danger: options.danger,
      action: options.onConfirm,
    });
  }

  function close(): void {
    setState((current) => ({ ...current, open: false, action: null }));
  }

  function confirm(): void {
    const action = state.action;
    close();
    action?.();
  }

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      danger={state.danger}
      onConfirm={confirm}
      onCancel={close}
    />
  );

  return { ask, dialog };
}
