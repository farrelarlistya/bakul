"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneOtpForm } from "@/components/phone-otp-form";
import { SiteHeader } from "@/components/site-header";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function MasukPage() {
  const router = useRouter();
  const { status, user, login } = useAuth();

  return (
    <main className="min-h-screen bg-krem">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-10">
        <div className={cardClass}>
          <p className="text-base font-semibold text-teal-aksi">Selamat datang kembali</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-tinta">Masuk ke Bakul</h1>
          <p className="mt-2 text-base text-tinta-lembut">
            Cukup nomor HP dan kode 6 angka. Tanpa email, tanpa password.
          </p>

          {status === "memuat" ? (
            <p className="mt-6 text-base text-tinta-lembut">Memeriksa sesi…</p>
          ) : status === "masuk" && user ? (
            <div className="mt-6 space-y-4">
              <p className="rounded-kartu bg-mint-muda p-4 text-base text-tinta">
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
                mode="login"
                onSuccess={(session) => {
                  login(session);
                  router.push("/akun");
                }}
              />
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-base text-tinta-lembut">
          Belum punya toko?{" "}
          <Link href="/jualan" className="font-semibold text-teal-aksi">
            Buka toko gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
