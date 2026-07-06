import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { configureCloudinary } from "./config/cloudinary.js";

// ─── App Init ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Configure Third-Party Services ───────────────────────────────────────────
configureCloudinary();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // allow cookies (for JWT in httpOnly cookie)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── HTTP Request Logger (dev only) ───────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Global Rate Limiter (all routes) ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
});
app.use(globalLimiter);

// ─── Stricter Rate Limiter (prepared for auth & contact routes) ────────────────
// Usage: import { strictLimiter } from "./server.js" and apply to sensitive routes
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too many attempts. Please wait before trying again.",
  },
});

// ─── Health Check Route ────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Aditya Builders API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── API Routes (to be mounted in future phases) ──────────────────────────────
// Example:
// import projectRoutes from "./routes/projects.js";
// app.use("/api/projects", projectRoutes);
//
// import contactRoutes from "./routes/contact.js";
// app.use("/api/contact", strictLimiter, contactRoutes);
//
// import authRoutes from "./routes/auth.js";
// app.use("/api/auth", strictLimiter, authRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("❌ Unhandled Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(
    `🚀 Aditya Builders API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`
  );
});

export default app;
