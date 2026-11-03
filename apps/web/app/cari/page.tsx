import { Suspense } from "react";
import { CariClient } from "./cari-client";

export default function CariPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-putih p-6">
          <p className="text-base text-tinta-lembut">Memuat pencarian…</p>
        </main>
      }
    >
      <CariClient />
    </Suspense>
  );
}
