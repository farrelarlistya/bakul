"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/components/icon";

export type ToastTone = "sukses" | "gagal" | "info";

export type ToastItem = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastContextValue = {
  notify: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLE: Record<ToastTone, { box: string; icon: IconName; iconClass: string }> = {
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
};

const DISMISS_MS = 4000;

/**
 * Notifikasi singkat untuk hasil aksi. Berdiri sendiri supaya halaman tidak
 * perlu menyimpan pesan sukses secara manual.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = "sukses") => {
      const id = nextId.current;
      nextId.current += 1;
      setItems((current) => [...current, { id, tone, message }]);
      const timer = window.setTimeout(() => {
        dismiss(id);
      }, DISMISS_MS);
      timers.current.push(timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:right-6 md:left-auto md:items-end"
      >
        {items.map((item) => {
          const tone = TONE_STYLE[item.tone];
          return (
            <div
              key={item.id}
              role="status"
              className={`animate-muncul pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-kartu border p-3 ${tone.box}`}
            >
              <Icon name={tone.icon} size={20} className={`mt-0.5 shrink-0 ${tone.iconClass}`} />
              <p className="min-w-0 flex-1 text-base leading-6">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="-m-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-tombol text-current transition duration-cepat ease-standar hover:bg-putih/60"
                aria-label="Tutup notifikasi"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus dipakai di dalam ToastProvider.");
  }
  return context;
}
