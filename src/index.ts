import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "./middleware/error";
import authRoutes from "./routes/auth";
import loggerMiddleware from "./middleware/logger";
import connectDB from "./config/db";
import bodyParser from "body-parser";
import http from "http";
import { initializeSocket } from "./sockets";
import { sanitizeRequest } from "./middleware/sanitize";
import helmet from "helmet";
import compression from "compression";
import { logError } from "./utils/logger";

dotenv.config();
connectDB();

const app = express();

const server = http.createServer(app);

initializeSocket(server);

app.use(helmet());
app.use(cors());
app.use(compression());

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(sanitizeRequest);

app.use(loggerMiddleware);

app.use("/auth", authRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

process.on("unhandledRejection", (reason: Error) => {
  logError(reason);
});

process.on("uncaughtException", (error: Error) => {
  logError(error);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
