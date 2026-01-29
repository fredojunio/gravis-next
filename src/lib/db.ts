import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not defined in environment variables");
    }
    // Debug logging to verify what Next.js runtime sees
    const masked = connectionString.replace(/:[^:]+@/, ":****@");
    // Parse connection string manually to ensure correct params for pg driver in Next.js
    const url = new URL(connectionString);
    console.log("[DB] Connecting as user:", url.username); // Debug log

    // Use the same simple approach that works in seed.js
    const pool = new Pool({ connectionString });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
