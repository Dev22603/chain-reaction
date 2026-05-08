import jwt from "jsonwebtoken";
import { ERROR_CODES } from "../constants/app.constants.js";
import { config } from "../constants/config.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import type { AuthTokenPayload } from "../types/auth.js";
import { ApiError } from "./api_error.js";

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (!isAuthTokenPayload(decoded)) {
      throw new Error("Invalid token payload");
    }

    return decoded;
  } catch {
    throw new ApiError(
      ERROR_CODES.NOT_AUTHENTICATED,
      SERVER_MESSAGES.NOT_AUTHENTICATED,
      [],
      401
    );
  }
}

function isAuthTokenPayload(value: unknown): value is AuthTokenPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "sub" in value &&
    "email" in value &&
    typeof value.sub === "string" &&
    typeof value.email === "string"
  );
}
