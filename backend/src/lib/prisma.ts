import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "../constants/config.js";
import { PrismaClient } from "../generated/prisma/client.js";

const createPrismaClient = () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"]
  });
};

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientSingleton;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (config.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
