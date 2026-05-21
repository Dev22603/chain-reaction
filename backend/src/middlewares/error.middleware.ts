import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ERROR_CODES, MESSAGE_TYPES } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import { getLogger } from "../lib/logger.js";
import { ApiError } from "../utils/api_error.js";
import { getClientIp } from "../utils/clientIp.js";
import { logSecurityEvent } from "../utils/securityLogger.js";

const logger = getLogger("error.middleware");

export const errorMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      type: MESSAGE_TYPES.ERROR,
      code: ERROR_CODES.VALIDATION_FAILED,
      message: SERVER_MESSAGES.VALIDATION_FAILED,
      errors: error.issues.map((issue) => issue.message)
    });
    return;
  }

  if (error instanceof ApiError) {
    if (error.code === ERROR_CODES.INVALID_CREDENTIALS) {
      const ip = getClientIp(request);
      logSecurityEvent("auth_failure", { ip, details: "HTTP login invalid credentials" });
    }

    response.status(error.statusCode).json({
      type: MESSAGE_TYPES.ERROR,
      code: error.code,
      message: error.message,
      ...(error.errors.length ? { errors: error.errors } : {})
    });
    return;
  }

  logger.error("unhandled HTTP error", {
    error: error instanceof Error ? error.message : String(error)
  });

  response.status(500).json({
    type: MESSAGE_TYPES.ERROR,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: SERVER_MESSAGES.INTERNAL_ERROR
  });
};

