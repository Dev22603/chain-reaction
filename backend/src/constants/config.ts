import dotenv from "dotenv";

dotenv.config();

const parsedPort = Number.parseInt(process.env.PORT ?? "8080", 10);

export const config = {
  PORT: Number.isNaN(parsedPort) ? 8080 : parsedPort
} as const;
