import dotenv from "dotenv";

dotenv.config();

const isProd = (process.env.NODE_ENV ?? "development") === "production";
const jwtSecret = process.env.JWT_SECRET;

if (isProd) {
  if (!jwtSecret || jwtSecret === "change-me-in-development" || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set to a strong (>=32 char) value in production");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set in production");
  }
}

const parsedPort = Number.parseInt(process.env.PORT ?? "8080", 10);

export const config = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number.isNaN(parsedPort) ? 8080 : parsedPort,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: jwtSecret ?? "change-me-in-development",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? "").split(",").map(s => s.trim()).filter(Boolean),
  CLIENT_IP_HEADER: process.env.CLIENT_IP_HEADER
} as const;
