"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhoneOtpForm } from "@/components/phone-otp-form";
import { AppHeader } from "@/components/app-header";
import { Icon } from "@/components/icon";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { useAuth } from "@/lib/auth";

type MasukMode = "login" | "register";

export default function MasukPage() {
  const router = useRouter();
  const { status, user, login } = useAuth();
  const [mode, setMode] = useState<MasukMode>("login");
  const isRegister = mode === "register";

  return (
    <main className="min-h-screen bg-krem">
      <AppHeader />
      <div className="mx-auto max-w-md px-4 py-10">
        <div className={`${cardClass} p-6`}>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-pil bg-mint-muda text-teal-aksi">
            <Icon name="phone" size={24} />
          </span>
          <p className="mt-4 text-base font-semibold text-teal-aksi">
            {isRegister ? "Akun baru" : "Selamat datang kembali"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-tinta">
            {isRegister ? "Daftar ke Bakul" : "Masuk ke Bakul"}
          </h1>
          <p className="mt-2 text-base text-tinta-lembut">
            {isRegister
              ? "Cukup nomor HP dan kode 6 angka. Akun pembeli, tanpa email dan tanpa password."
              : "Cukup nomor HP dan kode 6 angka. Tanpa email, tanpa password."}
          </p>

          {status === "memuat" ? (
            <p className="mt-6 text-base text-tinta-lembut">Memeriksa sesi…</p>
          ) : status === "masuk" && user ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-kartu border border-teal bg-mint-muda p-4 text-base text-tinta">
                Kamu sudah masuk sebagai <strong>{user.name}</strong>.
              </p>
              <Link href="/akun" className={`${primaryButtonClass} w-full`}>
                Buka akun
              </Link>
              <Link href="/" className={`${secondaryButtonClass} w-full`}>
                Kembali ke Beranda
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <PhoneOtpForm
                key={mode}
                mode={mode}
                onSuccess={(session) => {
                  login(session);
                  router.push(isRegister ? "/akun" : "/");
                }}
              />

              <p className="mt-4 text-center text-base text-tinta-lembut">
                {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
                <button
                  type="button"
                  onClick={() => setMode(isRegister ? "login" : "register")}
                  className="inline-flex min-h-11 items-center font-semibold text-teal-aksi underline"
                >
                  {isRegister ? "Masuk" : "Daftar"}
                </button>
              </p>

              {isRegister ? (
                <p className="mt-4 rounded-kartu border border-garis bg-mint-muda p-3 text-base text-tinta-lembut">
                  Daftar di sini membuat akun pembeli. Tidak ada kewajiban membuka
                  toko; kamu bisa berjualan kapan saja lewat Buka toko.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-base text-tinta-lembut">
          Mau berjualan?{" "}
          <Link href="/jualan" className="font-semibold text-teal-aksi underline">
            Buka toko gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
