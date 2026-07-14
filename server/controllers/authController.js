import { validationResult, body } from "express-validator";
import Admin from "../models/Admin.js";
import catchAsync from "../utils/catchAsync.js";
import { generateToken, sendTokenCookie } from "../utils/generateToken.js";

// ─── Validation Rules ─────────────────────────────────────────────────────────
export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
];

// ─── Helper: check express-validator results ──────────────────────────────────
const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/login
// ─────────────────────────────────────────────────────────────────────────────
/**
 * loginAdmin — Authenticates an admin and issues a JWT httpOnly cookie.
 *
 * Security notes:
 * - Generic 401 "Invalid credentials" is returned whether email or
 *   password is wrong — never reveal WHICH field was incorrect.
 * - The stricter rate limiter (10 req/15 min) from server.js is applied
 *   to this route to blunt brute-force attempts.
 * - Token is set as an httpOnly cookie (not in JSON body) to prevent
 *   JavaScript-based XSS token theft.
 *
 * Note on API vs. UI security:
 * This /api/admin/* path is fine to be predictable — real security comes
 * from authentication, not route obscurity. The CLIENT-SIDE admin panel
 * URL (/secure-panel-x9k2 etc.) is a separate concern — it stays
 * unlinked from any public nav/footer/sitemap (configured in Phase 1/6).
 */
export const loginAdmin = [
  ...loginValidation,
  catchAsync(async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { email, password } = req.body;

    // Explicitly select password (it has select: false in the schema)
    let admin;
    try {
      admin = await Admin.findOne({ email }).select("+password");
    } catch {
      return res.status(503).json({
        success: false,
        message: "Database unavailable. Please ensure MONGO_URI is configured.",
      });
    }

    // Generic error prevents enumeration of valid emails
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login timestamp
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // Issue JWT cookie
    const token = generateToken(admin._id);
    sendTokenCookie(res, token);

    res.status(200).json({
      success: true,
      admin: {
        id:    admin._id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
      },
      token, // fallback for third-party cookie blocking
    });
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
export const logoutAdmin = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  // Clear the cookie by setting it to expire immediately
  res.cookie("admin_token", "", {
    httpOnly: true,
    expires:  new Date(0),
    secure:   isProduction,
    sameSite: isProduction ? "none" : "strict",
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/auth/me
// ─────────────────────────────────────────────────────────────────────────────
/**
 * getMe — Returns the currently authenticated admin's profile.
 * Used by the client admin panel on every page load to validate the session.
 * Requires protect middleware (populates req.admin).
 */
export const getMe = catchAsync(async (req, res) => {
  // req.admin is populated by the protect middleware, password excluded
  res.status(200).json({
    success: true,
    admin: {
      id:        req.admin._id,
      name:      req.admin.name,
      email:     req.admin.email,
      role:      req.admin.role,
      lastLogin: req.admin.lastLogin,
      createdAt: req.admin.createdAt,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = [
  ...changePasswordValidation,
  catchAsync(async (req, res) => {
    if (!checkValidation(req, res)) return;

    const { currentPassword, newPassword } = req.body;

    // Reload admin with password (protect middleware excluded it)
    const admin = await Admin.findById(req.admin._id).select("+password");

    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    admin.password = newPassword;
    // Pre-save hook in Admin.js will hash the new password automatically
    await admin.save();

    // Invalidate existing cookie — force re-login with new password
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("admin_token", "", {
      httpOnly: true,
      expires:  new Date(0),
      secure:   isProduction,
      sameSite: isProduction ? "none" : "strict",
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  }),
];
