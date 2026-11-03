import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Muat .env di root repo lebih dulu, lalu .env lokal apps/api bila ada.
config({ path: "../../.env", quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
