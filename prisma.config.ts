import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.prod if it exists, otherwise .env.local
config({ path: ".env.prod", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed-users-migration.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
