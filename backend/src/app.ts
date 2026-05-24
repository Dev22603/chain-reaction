import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./constants/config.js";
import { getLogger } from "./lib/logger.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { apiRouter } from "./routes/index.js";

const logger = getLogger("app");

export const app = express();

app.set("trust proxy", 1);

// Add security headers via helmet
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
app.use("/api", apiRouter);
app.use(errorMiddleware);
