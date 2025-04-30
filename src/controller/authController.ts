import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import { generateTokens } from "../services/tokenService";
import { sendError } from "../utils/sendError";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, "User already exists", "DuplicateUserError");
    }
    const newUser = new User({ name, email, password });
    await newUser.save();

    const { accessToken } = generateTokens(newUser._id, newUser.email);

    res.status(201).json({
      message: "Signup successful",
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 401, "Invalid credentials", "AuthError");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return sendError(res, 401, "Invalid credentials", "AuthError");
    }

    const { accessToken } = generateTokens(user._id, user.email);
    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { email } = req.body;

    const user = await User.findOneAndDelete({ email });
    if (!user) {
      sendError(res, 404, "User not found", "UserNotFoundError");
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const email = req.query.email as string;
    const updates = req.body;

    const user = await User.findOneAndUpdate({ email }, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      sendError(res, 404, "User not found", "UserNotFoundError");
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const users = await User.find().select("name email");
    if (!users || users.length === 0) {
      sendError(res, 404, "No users found", "NoUsersFoundError");
    }

    res.json(users);
  } catch (err) {
    next(err);
  }
};
