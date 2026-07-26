import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  // Supabase's connection pooler presents a self-signed cert, so verify-full
  // (the driver's default for sslmode=require) rejects it. Encrypt but skip CA
  // verification. Harmless for Neon too (also a trusted managed host).
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
