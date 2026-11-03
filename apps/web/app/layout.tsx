import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { AppBadgesProvider } from "@/components/app-badges";
import { DocumentTitle } from "@/components/document-title";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bakul — uang aman sampai barang diterima",
  description:
    "Pasar daring untuk pedagang kecil Indonesia. Buka toko tanpa email, belanja dengan tenang.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-tombol focus:bg-teal-aksi focus:px-4 focus:text-base focus:font-semibold focus:text-putih"
        >
          Lewati ke konten
        </a>
        <AuthProvider>
          <ToastProvider>
            <AppBadgesProvider>
              <DocumentTitle />
              <div id="konten" tabIndex={-1}>
                {children}
              </div>
            </AppBadgesProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
