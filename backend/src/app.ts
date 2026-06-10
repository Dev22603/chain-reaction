import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import playerRoutes from "./routes/player.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import { config } from "./constants/config";
import { getLogger } from "./lib/logger";

const logger = getLogger("app");

const app = express();

app.set("trust proxy", 1);

app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'none'"],
			},
		},
	}),
);

if (config.ALLOWED_ORIGINS.length === 0) {
	logger.warn("ALLOWED_ORIGINS is empty. All origins are allowed (development mode only).");
}

app.use(
	cors({
		origin: config.ALLOWED_ORIGINS.length ? config.ALLOWED_ORIGINS : true,
	}),
);
app.use(express.json());

app.get("/health", (req, res) => {
	res.status(200).json({ status: "Server is Up and Running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

export { app };
