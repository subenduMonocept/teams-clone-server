import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { sendError } from "../utils/sendError";

const rateLimitErrorHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    429,
    "Too many requests, please try again later",
    "RateLimitExceeded"
  );
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req: Request, res: Response): void => {
    sendError(
      res,
      429,
      "Too many login attempts, please try again after 15 minutes",
      "LoginRateLimitExceeded"
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: rateLimitErrorHandler,
  standardHeaders: true,
  legacyHeaders: false,
});
