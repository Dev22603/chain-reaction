import express from "express";
import { getPlayerProfile, getPlayerMatches, getMyMatches } from "../controllers/player.controllers";
import { authenticate } from "../middlewares/auth";
import { publicReadLimiter } from "../middlewares/rate-limit";

const router = express.Router();

// Declared before /:playerId so "me" is not captured as a player id
router.get("/me/matches", authenticate, getMyMatches);
router.get("/:playerId", publicReadLimiter, getPlayerProfile);
router.get("/:playerId/matches", publicReadLimiter, getPlayerMatches);

export default router;
