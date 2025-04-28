import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

export interface AuthenticatedSocket extends Socket {
  user?: jwt.JwtPayload;
}

export interface DecodedToken extends jwt.JwtPayload {
  userId: string;
}
