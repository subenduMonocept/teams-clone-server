import { Server } from "socket.io";
import { verifyToken } from "../middleware/auth";
import { AuthenticatedSocket } from "../types/socket";
import Message, { IMessageBase } from "../models/Message";
import mongoose from "mongoose";

interface MessagePayload {
  content: string;
  receiverId?: string;
  groupId?: string;
  type?: "text" | "file" | "call";
  fileUrl?: string;
}

interface TypingPayload {
  receiverId?: string;
  groupId?: string;
  isTyping: boolean;
}

interface CallPayload {
  receiverId?: string;
  groupId?: string;
  type: "video" | "audio";
  status: "ringing" | "accepted" | "rejected" | "ended";
}

interface LoadMessagesPayload {
  receiverId?: string;
  groupId?: string;
}

const onlineUsers = new Map<string, string>();

export const initializeSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket"],
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token?.split(" ")[1];
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = await verifyToken(token);
      if (!decoded || !decoded.userId) {
        return next(new Error("Invalid token"));
      }

      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    if (!socket.user?.userId) {
      socket.disconnect(true);
      return;
    }

    const userId = socket.user.userId;
    console.log(`User connected: ${userId}`);
    onlineUsers.set(userId, socket.id);

    // Join user's personal room
    socket.join(userId);

    // Notify all connected clients about this user's online status
    io.emit("userOnline", { userId });

    // Send current online users to the newly connected user
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit("onlineUsers", { users: onlineUserIds });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      // Notify all clients about this user's offline status
      io.emit("userOffline", { userId });
    });

    // Handle loading messages
    socket.on("loadMessages", async (payload: LoadMessagesPayload) => {
      try {
        if (!socket.user?.userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        const query: any = {};
        if (payload.receiverId) {
          query.$or = [
            { sender: socket.user.userId, receiver: payload.receiverId },
            { sender: payload.receiverId, receiver: socket.user.userId },
          ];
        } else if (payload.groupId) {
          query.group = payload.groupId;
        }

        const messages = await Message.find(query)
          .sort({ createdAt: 1 })
          .populate("sender", "name email")
          .populate("receiver", "name email")
          .lean();

        socket.emit("messagesLoaded", messages);
      } catch (error) {
        console.error("Error loading messages:", error);
        socket.emit("error", "Failed to load messages");
      }
    });

    // Handle private messages
    socket.on("sendMessage", async (payload: MessagePayload) => {
      try {
        if (!socket.user?.userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        const messageData: IMessageBase = {
          sender: new mongoose.Types.ObjectId(socket.user.userId),
          content: payload.content,
          receiver: payload.receiverId
            ? new mongoose.Types.ObjectId(payload.receiverId)
            : undefined,
          group: payload.groupId
            ? new mongoose.Types.ObjectId(payload.groupId)
            : undefined,
          type: payload.type || "text",
          fileUrl: payload.fileUrl,
          createdAt: new Date(),
        };

        const message = new Message(messageData);
        await message.save();

        // Emit to specific receiver or group
        if (payload.receiverId) {
          io.to(payload.receiverId).emit("newMessage", message);
        } else if (payload.groupId) {
          io.to(payload.groupId).emit("newMessage", message);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", "Failed to send message");
      }
    });

    // Handle typing status
    socket.on("typing", (payload: TypingPayload) => {
      if (!socket.user?.userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      if (payload.receiverId) {
        io.to(payload.receiverId).emit("typing", {
          userId: socket.user.userId,
          isTyping: payload.isTyping,
        });
      } else if (payload.groupId) {
        io.to(payload.groupId).emit("typing", {
          userId: socket.user.userId,
          isTyping: payload.isTyping,
        });
      }
    });

    // Handle group joining
    socket.on("joinGroup", (groupId: string) => {
      if (!socket.user?.userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      socket.join(groupId);
      io.to(groupId).emit("userJoined", {
        userId: socket.user.userId,
        groupId,
      });
    });

    // Handle group leaving
    socket.on("leaveGroup", (groupId: string) => {
      if (!socket.user?.userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      socket.leave(groupId);
      io.to(groupId).emit("userLeft", {
        userId: socket.user.userId,
        groupId,
      });
    });

    // Handle calls
    socket.on("call", (payload: CallPayload) => {
      if (!socket.user?.userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      if (payload.receiverId) {
        io.to(payload.receiverId).emit("call", {
          ...payload,
          from: socket.user.userId,
        });
      } else if (payload.groupId) {
        io.to(payload.groupId).emit("call", {
          ...payload,
          from: socket.user.userId,
        });
      }
    });
  });

  return io;
};
