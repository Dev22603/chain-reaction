import dotenv from "dotenv";

dotenv.config();

const parsedPort = Number.parseInt(process.env.PORT ?? "8080", 10);

export const config = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number.isNaN(parsedPort) ? 8080 : parsedPort,
  DATABASE_URL: process.env.DATABASE_URL
} as const;
