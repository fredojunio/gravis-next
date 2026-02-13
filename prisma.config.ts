import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.prod if it exists, otherwise .env.local
config({ path: ".env.prod", override: true });

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
} as any);
