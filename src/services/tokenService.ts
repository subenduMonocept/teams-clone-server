import jwt from "jsonwebtoken";
import { Types } from "mongoose";

export const generateTokens = (userId: Types.ObjectId, email: string) => {
  const accessToken = jwt.sign(
    { userId: userId.toString(), email },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: userId.toString(), email },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as {
      userId: string;
      email: string;
    };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };
  } catch (error) {
    throw new Error("Invalid access token");
  }
};
