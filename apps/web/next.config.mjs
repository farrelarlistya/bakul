/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  devIndicators: false,
  // Agar HMR dan hidrasi juga bekerja saat halaman dibuka lewat IP lokal
  // atau lewat tunnel Cloudflare (`npm run share`).
  allowedDevOrigins: ["127.0.0.1", "*.trycloudflare.com"],
  async rewrites() {
    const apiUrl = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001";

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
