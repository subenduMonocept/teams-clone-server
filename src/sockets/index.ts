import { Server } from "socket.io";
import { AuthenticatedSocket } from "../types/socket";
import Message, { IMessageBase } from "../models/Message";
import mongoose from "mongoose";
import { verifyAccessToken } from "../services/tokenService";
import Group from "../models/Group";
import User from "../models/User";

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

const currentTime = new Date().toLocaleTimeString();

export const initializeSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
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

      const decoded = await verifyAccessToken(token);
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
    console.log(`User connected: ${userId} at ${currentTime}`);
    onlineUsers.set(userId, socket.id);

    socket.join(userId);
    io.emit("userOnline", { userId });

    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit("onlineUsers", { users: onlineUserIds });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId} at ${currentTime}`);
      onlineUsers.delete(userId);
      io.emit("userOffline", { userId });
    });

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
          .populate("sender", "name email _id")
          .populate("receiver", "name email _id")
          .lean();

        socket.emit("messagesLoaded", messages);
      } catch (error) {
        console.error("Error loading messages:", error);
        socket.emit("error", { message: "Failed to load messages", code: 500 });
      }
    });

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

        if (payload.receiverId) {
          io.to(payload.receiverId).emit("newMessage", message);
        } else if (payload.groupId) {
          io.to(payload.groupId).emit("newMessage", message);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message", code: 500 });
      }
    });

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

    socket.on("joinGroup", async (groupId: string) => {
      if (!socket.user?.userId) {
        socket.emit("error", { message: "Unauthorized", code: 401 });
        return;
      }

      try {
        const group = await Group.findById(groupId).lean();

        if (!group) {
          socket.emit("error", { message: "Group not found", code: 404 });
          return;
        }

        const isMember = group.members.some(
          (memberId) => memberId.toString() === socket.user!.userId
        );

        if (!isMember) {
          socket.emit("error", {
            message: "Forbidden: Not a group member",
            code: 403,
          });
          return;
        }

        socket.join(groupId);
        io.to(groupId).emit("userJoined", {
          userId: socket.user.userId,
          groupId,
        });
      } catch (err) {
        console.error("Join group error:", err);
        socket.emit("error", { message: "Failed to join group", code: 500 });
      }
    });

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

    socket.on("call", async (payload: CallPayload) => {
      if (!socket.user?.userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      try {
        const caller = await User.findById(socket.user.userId)
          .select("name email _id")
          .lean();

        const callData = {
          ...payload,
          from: {
            _id: caller?._id,
            name: caller?.name,
            email: caller?.email,
          },
        };

        if (payload.receiverId) {
          io.to(payload.receiverId).emit("call", callData);
        } else if (payload.groupId) {
          io.to(payload.groupId).emit("call", callData);
        }
      } catch (err) {
        console.error("Call event error:", err);
        socket.emit("error", { message: "Failed to initiate call", code: 500 });
      }
    });
  });

  return io;
};
