import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Admin from "../../models/Admin.js";

let io = null;

const parseCookies = (cookieString) => {
  if (!cookieString) return {};
  return cookieString.split(";").reduce((acc, pair) => {
    const parts = pair.split("=");
    const key = parts[0] ? parts[0].trim() : "";
    const val = parts[1] ? parts[1].trim() : "";
    if (key) acc[key] = val;
    return acc;
  }, {});
};

const onlineAdmins = new Map(); // Map of socket.id -> admin info

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Configured via custom logic or matching app's origins
      credentials: true,
    },
  });

  // JWT authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const cookieStr = socket.handshake.headers.cookie || "";
      const cookies = parseCookies(cookieStr);
      // Fallback to handshake auth token for debugging/testing
      const token = cookies.admin_token || socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication error: Admin JWT token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(decoded.id).select("-password");

      if (!admin) {
        return next(new Error("Authentication error: Admin account not found"));
      }

      socket.admin = admin;
      next();
    } catch (err) {
      console.warn("🔌 Socket Auth Failed:", err.message);
      return next(new Error("Authentication error: Invalid signature"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 CRM Socket Connected: ${socket.admin.name} [Role: ${socket.admin.role}] (ID: ${socket.id})`);
    
    // Track online admin state
    onlineAdmins.set(socket.id, {
      id: socket.admin._id.toString(),
      name: socket.admin.name,
      role: socket.admin.role
    });

    // Broadcast updated online admins list
    const getUniqueOnlineAdmins = () => {
      const unique = {};
      onlineAdmins.forEach(val => {
        unique[val.id] = val;
      });
      return Object.values(unique);
    };

    io.to("admins").emit("online_admins_list", getUniqueOnlineAdmins());

    // Admins general broadcast room
    socket.join("admins");

    // Executive-specific private subscription room
    socket.join(`executive_${socket.admin._id.toString()}`);

    // Join room for specific conversation to route targeted events
    socket.on("join_chat", (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`🔌 Admin ${socket.admin.name} joined chat room: chat_${chatId}`);
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`🔌 Admin ${socket.admin.name} left chat room: chat_${chatId}`);
    });

    // Targeted Typing broadcasts inside specific chat room context
    socket.on("typing", (data) => {
      const { chatId, isTyping } = data;
      if (chatId) {
        socket.to(`chat_${chatId}`).emit("typing", {
          adminId: socket.admin._id,
          adminName: socket.admin.name,
          chatId,
          isTyping
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 CRM Socket Disconnected: ${socket.admin.name} (ID: ${socket.id})`);
      onlineAdmins.delete(socket.id);
      io.to("admins").emit("online_admins_list", getUniqueOnlineAdmins());
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

/**
 * Emit events to connected admin clients.
 * Filters/routes message events based on assignments if needed, but defaults to general broadcasting.
 */
export const emitToAdmins = (eventName, data, assignedExecutiveId = null, chatId = null) => {
  if (!io) return;

  // Emit to targeted conversation room
  if (chatId) {
    io.to(`chat_${chatId.toString()}`).emit(eventName, data);
  }

  // Emit to all general listening admins
  io.to("admins").emit(eventName, data);

  // Additionally emit to the assigned executive's private room
  if (assignedExecutiveId) {
    io.to(`executive_${assignedExecutiveId.toString()}`).emit(eventName, data);
  }
};
