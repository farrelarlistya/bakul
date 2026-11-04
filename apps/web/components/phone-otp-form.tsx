"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import type { AuthSession, OtpRequestResult } from "@bakul/shared";
import { Icon } from "@/components/icon";
import { StatusBanner } from "@/components/status-banner";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

type Props = {
  mode: "login" | "register";
  onSuccess: (session: AuthSession) => void;
};

async function readMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: { message?: string } }).error;
    if (error?.message) {
      return error.message;
    }
  }
  return "Ada yang belum beres. Coba lagi.";
}

export function PhoneOtpForm({ mode, onSuccess }: Props) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<OtpRequestResult | null>(null);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  useEffect(() => {
    if (step === "code") {
      inputsRef.current[0]?.focus();
    }
  }, [step]);

  async function sendCode(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error(await readMessage(response));
      }

      const body = (await response.json()) as OtpRequestResult;
      setResult(body);
      setPhone(body.phone);
      setCode(["", "", "", "", "", ""]);
      setStep("code");
      setSeconds(60);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Kode belum bisa dikirim.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(): Promise<void> {
    const value = code.join("");
    if (value.length !== 6) {
      setError("Masukkan 6 angka kodenya.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: value }),
      });

      if (!response.ok) {
        throw new Error(await readMessage(response));
      }

      const session = (await response.json()) as AuthSession;
      onSuccess(session);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Kode belum bisa dipakai.");
    } finally {
      setBusy(false);
    }
  }

  function updateDigit(index: number, value: string): void {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleBackspace(index: number, event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>): void {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) {
      return;
    }

    event.preventDefault();
    const next = Array.from({ length: 6 }, (_, index) => digits[index] ?? "");
    setCode(next);
    inputsRef.current[Math.min(digits.length, 5)]?.focus();
  }

  const phoneTooShort = phone.trim().length > 0 && phone.trim().length < 8;

  return (
    <div className="space-y-5">
      {step === "phone" ? (
        <div>
          <label htmlFor="phone" className={labelClass}>
            Nomor HP
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-describedby="phone-hint"
            aria-invalid={phoneTooShort || Boolean(error)}
            className={inputClass}
            placeholder="0812-3456-7890"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              if (error) {
                setError(null);
              }
            }}
          />
          <p id="phone-hint" className="mt-2 text-base text-tinta-lembut">
            {phoneTooShort
              ? "Nomor HP belum lengkap. Masukkan minimal 8 angka."
              : "Kode 6 angka dikirim ke nomor ini. Tidak perlu email."}
          </p>
          <button
            type="button"
            className={`${primaryButtonClass} mt-4 w-full`}
            disabled={busy || phone.trim().length < 8}
            aria-busy={busy}
            onClick={() => void sendCode()}
          >
            {busy ? (
              <>
                <Icon name="refresh" size={18} className="animate-memuat" />
                Mengirim…
              </>
            ) : (
              <>
                <Icon name="phone" size={18} />
                Kirim kode
              </>
            )}
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError(null);
            }}
            className="mb-4 inline-flex min-h-11 items-center gap-1 rounded-tombol px-1 text-base font-semibold text-teal-aksi transition duration-cepat ease-standar hover:bg-mint-muda"
          >
            <Icon name="arrowLeft" size={18} />
            Ubah nomor
          </button>

          {result?.delivery === "whatsapp" ? (
            <p className="text-base text-tinta-lembut">
              Kode 6 angka dikirim ke WhatsApp{" "}
              <strong className="text-tinta">{phone}</strong>. Buka WhatsApp, lalu masukkan
              kodenya.
            </p>
          ) : (
            <p className="text-base text-tinta-lembut">
              Kode 6 angka dikirim ke <strong className="text-tinta">{phone}</strong>.
            </p>
          )}

          {result?.demoCode ? (
            <div className="mt-3 rounded-kartu border border-teal bg-mint-muda p-3 text-base text-tinta">
              Mode demo: kode <strong className="text-xl">{result.demoCode}</strong>
            </div>
          ) : null}

          {result?.existing && mode === "register" ? (
            <p className="mt-3 rounded-kartu border border-garis-kuat bg-krem p-3 text-base text-tinta">
              Nomor ini sudah terdaftar. Kode di atas dipakai untuk masuk, bukan membuat akun baru.
            </p>
          ) : null}

          <div
            className="mt-4 flex justify-between gap-2"
            role="group"
            aria-label="Kode 6 angka"
            aria-describedby={error ? "otp-error" : undefined}
            onPaste={handlePaste}
          >
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={`Angka ke-${index + 1}`}
                aria-invalid={Boolean(error)}
                maxLength={1}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleBackspace(index, event)}
                className="h-14 w-12 rounded-tombol border border-garis bg-putih text-center text-2xl font-bold text-tinta outline-none transition duration-cepat ease-standar hover:border-garis-kuat focus:border-teal-aksi"
              />
            ))}
          </div>

          <button
            type="button"
            className={`${primaryButtonClass} mt-4 w-full`}
            disabled={busy}
            aria-busy={busy}
            onClick={() => void verifyCode()}
          >
            {busy ? (
              <>
                <Icon name="refresh" size={18} className="animate-memuat" />
                Memeriksa…
              </>
            ) : (
              "Masuk"
            )}
          </button>

          <button
            type="button"
            className={`${secondaryButtonClass} mt-3 w-full`}
            disabled={busy || seconds > 0}
            onClick={() => void sendCode()}
          >
            {seconds > 0 ? (
              <>
                <Icon name="clock" size={18} />
                Kirim ulang dalam {seconds} detik
              </>
            ) : (
              <>
                <Icon name="refresh" size={18} />
                Kirim ulang kode
              </>
            )}
          </button>
        </div>
      )}

      {error ? (
        <div id="otp-error" role="alert">
          <StatusBanner tone="gagal">{error}</StatusBanner>
        </div>
      ) : null}
    </div>
  );
}
