import type { ErrorRequestHandler } from "express";
import { ERROR_CODES, MESSAGE_TYPES } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import { getLogger } from "../lib/logger.js";
import { ApiError } from "../utils/api_error.js";

const logger = getLogger("error.middleware");

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
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
