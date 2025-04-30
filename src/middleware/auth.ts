import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../services/tokenService";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
};

declare global {
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload;
    }
  }
}
