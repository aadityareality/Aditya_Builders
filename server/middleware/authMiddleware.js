import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

/**
 * protect — Verifies the admin_token httpOnly cookie and attaches the
 * authenticated Admin document to req.admin.
 *
 * Reads from cookie (not Authorization header) because this admin panel
 * is browser-based and httpOnly cookies are immune to XSS token theft.
 *
 * Flow:
 *   1. Extract token from req.cookies.admin_token
 *   2. Verify signature against JWT_SECRET
 *   3. Load Admin from DB (password excluded)
 *   4. Attach Admin to req.admin and call next()
 */
export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.admin_token;

    // Check Authorization header fallback (for mobile browsers blocking third-party cookies)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please log in",
      });
    }

    // Throws if token is expired or signature is invalid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch admin fresh from DB each request (detects deleted/role-changed accounts)
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account no longer exists",
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message:
        err.name === "TokenExpiredError"
          ? "Session expired, please log in again"
          : "Not authorized, please log in",
    });
  }
};

/**
 * restrictTo — Role-based access control middleware factory.
 *
 * Must be used AFTER the protect middleware (requires req.admin).
 * Call as: restrictTo("superadmin") or restrictTo("superadmin", "editor")
 *
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
