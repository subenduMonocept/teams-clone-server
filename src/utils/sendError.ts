import { Response } from "express";

interface ErrorResponse {
  type?: string;
  msg: string;
}

export const sendError = (
  res: Response,
  statusCode: number,
  msg: string,
  type: string = "ApplicationError"
) => {
  return res.status(statusCode).json({
    error: {
      type,
      msg,
    },
  });
};
