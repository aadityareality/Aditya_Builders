import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import path from "path";

import connectDB from "./config/db.js";
import { configureCloudinary } from "./config/cloudinary.js";

// ─── Health Check Router ──────────────────────────────────────────────────────
import healthRoutes from "./routes/healthRoutes.js";

// ─── Admin Route Imports ───────────────────────────────────────────────────────
import authRoutes from "./routes/authRoutes.js";
import adminProjectRoutes from "./routes/adminProjectRoutes.js";
import adminGalleryRoutes from "./routes/adminGalleryRoutes.js";
import adminTestimonialRoutes from "./routes/adminTestimonialRoutes.js";
import adminInquiryRoutes from "./routes/adminInquiryRoutes.js";
import adminTeamRoutes from "./routes/adminTeamRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminUploadRoutes from "./routes/adminUploadRoutes.js";
import adminAppointmentRoutes from "./routes/adminAppointmentRoutes.js";
import adminCrmRoutes from "./routes/adminCrmRoutes.js";
import http from "http";
import { initSocket } from "./src/services/socketService.js";

// ─── Public API Route Imports ──────────────────────────────────────────────────
import publicProjectRoutes from "./routes/publicProjectRoutes.js";
import publicGalleryRoutes from "./routes/publicGalleryRoutes.js";
import publicTestimonialRoutes from "./routes/publicTestimonialRoutes.js";
import publicTeamRoutes from "./routes/publicTeamRoutes.js";
import publicSettingsRoutes from "./routes/publicSettingsRoutes.js";
import publicContactRoutes from "./routes/publicContactRoutes.js";
import publicCallbackRoutes from "./routes/publicCallbackRoutes.js";
import adminCallbackRoutes from "./routes/adminCallbackRoutes.js";
import whatsappRoutes from "./src/routes/whatsappRoutes.js";
import { initReminderCron } from "./src/services/reminderService.js";

// ─── Error Middleware (must be imported BEFORE mounting, used AFTER routes) ────
import { notFound, globalErrorHandler } from "./middleware/errorMiddleware.js";

// ─── App Init ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// Trust first proxy (required for Render, Heroku, etc. — fixes express-rate-limit X-Forwarded-For)
app.set("trust proxy", 1);

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Configure Third-Party Services ───────────────────────────────────────────
configureCloudinary();

// ─── Security Middleware: Helmet with customized CSP ────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: [
          "'self'",
          "https://res.cloudinary.com",
          "https://api.cloudinary.com",
          "https://aadityareality.in",
          "https://www.aadityareality.in",
          "https://aditya-builders.vercel.app",
          "http://localhost:5173",
          "http://localhost:3000",
          "http://localhost:5000",
          process.env.CLIENT_URL,
        ].filter(Boolean),
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
      },
    },
  })
);

// ─── CORS: Restricted to allowed origins in prod ─────────────────────────────
const productionOrigins = [
  "https://aadityareality.in",
  "https://www.aadityareality.in",
  "https://aditya-builders.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const developmentOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      const isProduction = process.env.NODE_ENV === "production";
      const allowedOrigins = isProduction
        ? productionOrigins
        : [...new Set([...productionOrigins, ...developmentOrigins])];

      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS request blocked: Origin ${origin} not authorized for environment.`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── HTTP Request Logger (dev only) ───────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── Body Parsing & Sanitization ─────────────────────────────────────────────
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Strips MongoDB operator injections (such as $gt, $where, etc.)
app.use(mongoSanitize());

// HTTP Parameter Pollution protection
app.use(hpp());

// ─── Global Rate Limiter (all routes) ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // 100 reqs limit
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests from this IP. Please try again later." },
  skip: (req) => {
    return req.originalUrl.startsWith("/api/webhook") || req.originalUrl.startsWith("/webhook") || req.path.includes("/webhook");
  }
});
app.use(globalLimiter);

// ─── Stricter Rate Limiter (exported for use on specific routes) ──────────────
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please wait before trying again." },
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// ── Health Check ─────────────────────────────────────────────────────────────
app.use("/api/health", healthRoutes);

// ── Admin Auth ────────────────────────────────────────────────────────────────
app.use("/api/admin/auth", authRoutes);

// ── Admin Resource APIs (protected) ───────────────────────────────────────────
app.use("/api/admin/projects", adminProjectRoutes);
app.use("/api/admin/gallery", adminGalleryRoutes);
app.use("/api/admin/testimonials", adminTestimonialRoutes);
app.use("/api/admin/inquiries", adminInquiryRoutes);
app.use("/api/admin/team", adminTeamRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/admin/admins", adminUserRoutes);
app.use("/api/admin/upload", adminUploadRoutes);
app.use("/api/admin/callback-requests", adminCallbackRoutes);
app.use("/api/admin/appointments", adminAppointmentRoutes);
app.use("/api/admin/crm", adminCrmRoutes);

// ── Public APIs ───────────────────────────────────────────────────────────────
app.use("/api/projects", publicProjectRoutes);
app.use("/api/gallery", publicGalleryRoutes);
app.use("/api/testimonials", publicTestimonialRoutes);
app.use("/api/team", publicTeamRoutes);
app.use("/api/settings", publicSettingsRoutes);
app.use("/api/contact", publicContactRoutes);
app.use("/api/callback-request", publicCallbackRoutes);

// ── WhatsApp APIs ────────────────────────────────────────────────────────────
app.use("/", whatsappRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// SERVING STATIC FRONTEND IN PRODUCTION
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  // Serve built static assets from Vite client build
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // Any non-API route gets served the client index.html
  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) return next();
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING — Must be mounted LAST
// ─────────────────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(
    `🚀 Aditya Builders API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`
  );
  console.log(`   Admin API base: /api/admin/*`);
  console.log(`   Health check:   /api/health`);
  
  // Initialize cron reminders daemon
  initReminderCron();
});

export default app;
