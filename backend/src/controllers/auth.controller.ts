import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import type { AuthTokenPayload } from "../types/auth.js";
import { apiResponse } from "../utils/api_response.js";
import { LoginSchema, SignupSchema } from "../schemas/auth.schemas.js";

export const authController = {
  async signup(request: Request, response: Response): Promise<void> {
    const input = SignupSchema.parse(request.body);
    const result = await authService.signup(input);
    response.status(201).json(apiResponse(result));
  },

  async login(request: Request, response: Response): Promise<void> {
    const input = LoginSchema.parse(request.body);
    const result = await authService.login(input);
    response.json(apiResponse(result));
  },

  async me(_request: Request, response: Response): Promise<void> {
    const auth = response.locals.auth as AuthTokenPayload;
    const player = await authService.getMe(auth.sub);
    response.json(apiResponse({ player }));
  }
};
