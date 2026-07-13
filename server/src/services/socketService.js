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
    
    // Admins general broadcast room
    socket.join("admins");

    // Executive-specific private subscription room
    socket.join(`executive_${socket.admin._id.toString()}`);

    // Typing broadcasts
    socket.on("typing", (data) => {
      socket.to("admins").emit("typing", {
        adminId: socket.admin._id,
        adminName: socket.admin.name,
        customerId: data.customerId,
        isTyping: data.isTyping
      });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 CRM Socket Disconnected: ${socket.admin.name} (ID: ${socket.id})`);
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
export const emitToAdmins = (eventName, data, assignedExecutiveId = null) => {
  if (!io) return;

  // Emit to all general listening admins (superadmin, managers, editor)
  io.to("admins").emit(eventName, data);

  // Additionally emit to the assigned executive's private room
  if (assignedExecutiveId) {
    io.to(`executive_${assignedExecutiveId.toString()}`).emit(eventName, data);
  }
};
