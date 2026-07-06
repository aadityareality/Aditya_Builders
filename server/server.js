import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { configureCloudinary } from "./config/cloudinary.js";

// ─── Admin Route Imports ───────────────────────────────────────────────────────
import authRoutes        from "./routes/authRoutes.js";
import adminProjectRoutes    from "./routes/adminProjectRoutes.js";
import adminGalleryRoutes    from "./routes/adminGalleryRoutes.js";
import adminTestimonialRoutes from "./routes/adminTestimonialRoutes.js";
import adminInquiryRoutes    from "./routes/adminInquiryRoutes.js";
import adminTeamRoutes       from "./routes/adminTeamRoutes.js";
import adminSettingsRoutes   from "./routes/adminSettingsRoutes.js";
import adminUserRoutes       from "./routes/adminUserRoutes.js";

// ─── Error Middleware (must be imported BEFORE mounting, used AFTER routes) ────
import { notFound, globalErrorHandler } from "./middleware/errorMiddleware.js";

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
    credentials: true,
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
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(globalLimiter);

// ─── Stricter Rate Limiter (exported for use on specific routes) ──────────────
// Note: The login-specific 5-req/15-min limiter is applied in authRoutes.js.
// This export remains available for any other sensitive routes added later.
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

// ── Public health check ───────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Aditya Builders API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Admin Auth ────────────────────────────────────────────────────────────────
// Note on security layering:
//   - These /api/admin/* routes are intentionally predictable — real security
//     comes from JWT authentication, not route obscurity.
//   - The CLIENT-SIDE admin panel URL (e.g. /secure-panel-x9k2) is a separate
//     concern: it must remain unlinked from all public nav/footer/sitemaps.
//     That URL is configured via VITE_ADMIN_SLUG in the client .env (Phase 1/6).
app.use("/api/admin/auth",         authRoutes);

import adminUploadRoutes     from "./routes/adminUploadRoutes.js";

// ── Public API Route Imports ──────────────────────────────────────────────────
import publicProjectRoutes from "./routes/publicProjectRoutes.js";
import publicGalleryRoutes from "./routes/publicGalleryRoutes.js";
import publicTestimonialRoutes from "./routes/publicTestimonialRoutes.js";
import publicTeamRoutes from "./routes/publicTeamRoutes.js";
import publicSettingsRoutes from "./routes/publicSettingsRoutes.js";
import publicContactRoutes from "./routes/publicContactRoutes.js";

// ── Admin Resource APIs (all protected by protect middleware in each router) ───
app.use("/api/admin/projects",     adminProjectRoutes);
app.use("/api/admin/gallery",      adminGalleryRoutes);
app.use("/api/admin/testimonials", adminTestimonialRoutes);
app.use("/api/admin/inquiries",    adminInquiryRoutes);
app.use("/api/admin/team",         adminTeamRoutes);
app.use("/api/admin/settings",     adminSettingsRoutes);
app.use("/api/admin/admins",       adminUserRoutes);   // superadmin only
app.use("/api/admin/upload",       adminUploadRoutes); // image upload handler

// ── Public API routes (Phase 4) ───────────────────────────────────────────────
app.use("/api/projects",     publicProjectRoutes);
app.use("/api/gallery",      publicGalleryRoutes);
app.use("/api/testimonials", publicTestimonialRoutes);
app.use("/api/team",         publicTeamRoutes);
app.use("/api/settings",     publicSettingsRoutes);
app.use("/api/contact",      publicContactRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING — Must be mounted LAST, after all routes
// ─────────────────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(
    `🚀 Aditya Builders API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`
  );
  console.log(`   Admin API base: /api/admin/*`);
  console.log(`   Health check:   http://localhost:${PORT}/api/health`);
});

export default app;
