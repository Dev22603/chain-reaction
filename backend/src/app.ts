import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);
app.use(errorMiddleware);
