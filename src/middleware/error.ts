import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

interface ErrorWithStatus extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

class AppError extends Error implements ErrorWithStatus {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number) => {
  return new AppError(message, statusCode);
};

export default function (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    logger.error("Error 💥", {
      error: err,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    });

    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    if (err.isOperational) {
      logger.error("Operational Error 💥", {
        error: err,
        path: req.path,
        method: req.method,
      });

      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      logger.error("Programming Error 💥", {
        error: err,
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        status: "error",
        message: "Something went wrong",
      });
    }
  }
}
