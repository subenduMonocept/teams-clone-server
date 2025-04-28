import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import errorHandler from "./middleware/error";
import authRoutes from "./routes/auth";
import loggerMiddleware from "./middleware/logger";
import connectDB from "./config/db";
import bodyParser from "body-parser";
import http from "http";
import { initializeSocket } from "./sockets";

dotenv.config();
connectDB();

const app = express();

const server = http.createServer(app);

initializeSocket(server);

app.use(cors());
app.use(loggerMiddleware);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.set("trust proxy", true);

app.use("/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
