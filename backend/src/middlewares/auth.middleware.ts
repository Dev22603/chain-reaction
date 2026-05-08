import type { RequestHandler } from "express";
import { ERROR_CODES } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import type { AuthTokenPayload } from "../types/auth.js";
import { ApiError } from "../utils/api_error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth: RequestHandler = (request, response, next) => {
  const token = getBearerToken(request.headers.authorization);
  if (!token) {
    next(new ApiError(ERROR_CODES.NOT_AUTHENTICATED, SERVER_MESSAGES.NOT_AUTHENTICATED, [], 401));
    return;
  }

  response.locals.auth = verifyAccessToken(token) satisfies AuthTokenPayload;
  next();
};

function getBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}
