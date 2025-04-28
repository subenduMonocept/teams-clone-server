import express, { Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import Message, { IMessage } from "../models/Message";
import User from "../models/User";
import { AuthenticatedRequest } from "../types/express";
import { createError } from "../middleware/error";
import logger from "../utils/logger";

const router = express.Router();

// Send a new message
router.post(
  "/send",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { receiverId, content, type = "text", fileUrl } = req.body;
      const currentUser = req.user;

      if (!currentUser) {
        throw createError("Unauthorized", 401);
      }

      if (!receiverId) {
        throw createError("Receiver ID is required", 400);
      }

      const message = new Message({
        sender: currentUser._id,
        receiver: receiverId,
        content,
        type,
        fileUrl,
      });

      await message.save();

      // Populate sender details
      await message.populate("sender", "email");

      // Transform message to match client interface
      const transformedMessage = {
        _id: message._id.toString(),
        sender: {
          _id: message.sender._id.toString(),
          email: (message.sender as any).email,
        },
        receiver: message.receiver?.toString(),
        content: message.content,
        type: message.type,
        fileUrl: message.fileUrl,
        createdAt: message.createdAt.toISOString(),
      };

      res.status(201).json(transformedMessage);
    } catch (error) {
      logger.error("Error sending message:", error);
      next(error);
    }
  }
);

// Get messages between two users
router.get(
  "/messages/:userId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const currentUser = req.user;

      if (!currentUser) {
        throw createError("Unauthorized", 401);
      }

      const messages = await Message.find({
        $or: [
          { sender: currentUser._id, receiver: userId },
          { sender: userId, receiver: currentUser._id },
        ],
      })
        .populate("sender", "email")
        .sort({ createdAt: 1 });

      // Transform messages to match client interface
      const transformedMessages = messages.map((msg: IMessage) => ({
        _id: msg._id.toString(),
        sender: {
          _id: msg.sender._id.toString(),
          email: (msg.sender as any).email,
        },
        receiver: msg.receiver?.toString(),
        content: msg.content,
        type: msg.type,
        fileUrl: msg.fileUrl,
        createdAt: msg.createdAt.toISOString(),
      }));

      res.json(transformedMessages);
    } catch (error) {
      logger.error("Error fetching messages:", error);
      next(error);
    }
  }
);

// Get all users
router.get(
  "/users",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const currentUser = req.user;

      if (!currentUser) {
        throw createError("Unauthorized", 401);
      }

      const users = await User.find({ _id: { $ne: currentUser._id } }).select(
        "-password"
      );

      res.json(users);
    } catch (error) {
      logger.error("Error fetching users:", error);
      next(error);
    }
  }
);

export default router;
