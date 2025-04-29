import { Request, Response, NextFunction } from "express";
import { ValidationError } from "express-validator";
import { JsonWebTokenError } from "jsonwebtoken";

interface CustomError extends Error {
  statusCode?: number;
  errors?: ValidationError[];
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors;

  if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
  }

  if (err.name === "MongoServerError" && (err as any).code === 11000) {
    statusCode = 409;
    message = "Duplicate key error";
  }

  console.error({
    statusCode,
    message,
    errors,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(errors && { errors }),
    },
  });
};
