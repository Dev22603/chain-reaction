import type { Request, Response } from "express";
import { apiResponse } from "../utils/api_response.js";

export const healthController = {
  show(_request: Request, response: Response): void {
    response.json(apiResponse({ status: "ok" }));
  }
};
