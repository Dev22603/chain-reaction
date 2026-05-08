import type { Request, Response } from "express";
import { playersService } from "../services/players.service.js";
import type { AuthTokenPayload } from "../types/auth.js";
import { apiResponse } from "../utils/api_response.js";

export const playersController = {
  async show(request: Request, response: Response): Promise<void> {
    const profile = await playersService.getProfile(getPlayerId(request));
    response.json(apiResponse({ profile }));
  },

  async matches(request: Request, response: Response): Promise<void> {
    const limit = typeof request.query.limit === "string" ? Number(request.query.limit) : undefined;
    const matches = await playersService.listMatches(getPlayerId(request), limit);
    response.json(apiResponse({ matches }));
  },

  async myMatches(request: Request, response: Response): Promise<void> {
    const auth = response.locals.auth as AuthTokenPayload;
    const limit = typeof request.query.limit === "string" ? Number(request.query.limit) : undefined;
    const matches = await playersService.listMatches(auth.sub, limit);
    response.json(apiResponse({ matches }));
  }
};

function getPlayerId(request: Request): string {
  const value = request.params.playerId;
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
