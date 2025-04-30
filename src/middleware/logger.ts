import { Request, Response, NextFunction } from "express";

export default function (req: Request, res: Response, next: NextFunction) {
  const ip = req.ips.length ? req.ips.join(", ") : req.ip;
  console.log(
    `[${new Date().toLocaleTimeString()}] ${req.method} ${
      req.originalUrl
    } IP: ${ip}`
  );
  next();
}
