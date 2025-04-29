import { Request, Response, NextFunction } from "express";
import xss from "xss";

const sanitize = (data: any): any => {
  if (typeof data === "string") {
    return xss(data);
  }
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  if (typeof data === "object" && data !== null) {
    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitize(data[key]);
    }
    return sanitized;
  }
  return data;
};

export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    const sanitizedQuery = sanitize(req.query);
    Object.keys(sanitizedQuery).forEach((key) => {
      (req as any).query[key] = sanitizedQuery[key];
    });
  }
  if (req.params) {
    const sanitizedParams = sanitize(req.params);
    Object.keys(sanitizedParams).forEach((key) => {
      (req as any).params[key] = sanitizedParams[key];
    });
  }
  next();
};
