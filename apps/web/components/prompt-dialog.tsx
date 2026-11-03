"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { ghostButtonClass, inputClass, primaryButtonClass } from "@/components/ui";

type PromptDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

/**
 * Dialog input teks. Menggantikan `window.prompt` supaya label, validasi, dan
 * tampilannya mengikuti aturan Bakul.
 */
export function PromptDialog({
  open,
  title,
  description,
  label,
  defaultValue = "",
  placeholder,
  confirmLabel = "Simpan",
  cancelLabel = "Batal",
  required = true,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError(null);
    }
  }, [open, defaultValue]);

  function submit(): void {
    const trimmed = value.trim();
    if (required && !trimmed) {
      setError("Isi dulu sebelum melanjutkan.");
      return;
    }
    onConfirm(trimmed);
  }

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      icon="edit"
      onClose={onCancel}
      footer={
        <>
          <button type="button" className={ghostButtonClass} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={primaryButtonClass} onClick={submit}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <label htmlFor="prompt-dialog-input" className="mb-2 block text-base font-semibold text-tinta">
        {label}
      </label>
      <input
        id="prompt-dialog-input"
        data-autofocus
        className={inputClass}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "prompt-dialog-error" : undefined}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) {
            setError(null);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      />
      {error ? (
        <p id="prompt-dialog-error" className="mt-2 text-base text-bahaya">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
