import jwt from "jsonwebtoken";
import { ERROR_CODES } from "../constants/app.constants.js";
import { config } from "../constants/config.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import type { AuthTokenPayload } from "../types/auth.js";
import { ApiError } from "./api_error.js";

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE
    });
    if (!isAuthTokenPayload(decoded)) {
      throw new Error("Invalid token payload");
    }

    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new ApiError(
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
        "Access token has expired",
        [],
        401
      );
    }

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
