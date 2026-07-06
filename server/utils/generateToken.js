import jwt from "jsonwebtoken";

// ─── JWT_EXPIRES_IN → milliseconds conversion ─────────────────────────────────
// Parses values like "7d", "24h", "30m" into milliseconds for cookie maxAge.
const parseExpiry = (expiry = "7d") => {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return (map[unit] || 86_400_000) * value;
};

/**
 * Signs a JWT containing the admin's MongoDB _id.
 *
 * @param {string|ObjectId} adminId - The admin document's _id
 * @returns {string} Signed JWT string
 */
export const generateToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/**
 * Sets the JWT as an httpOnly cookie on the response.
 *
 * Security decisions:
 * - httpOnly: true  → JS cannot read the cookie (XSS protection)
 * - secure: true in production → cookie only sent over HTTPS
 * - sameSite: "strict" → CSRF protection; cookie not sent on cross-site
 *   requests. If the admin panel client and API are ever on different
 *   subdomains (e.g. admin.example.com calling api.example.com), change
 *   this to "lax" and rely on CORS + origin checks for CSRF protection
 *   instead. "strict" is safest when both are on the same origin.
 *
 * @param {Response} res   - Express response object
 * @param {string}   token - Signed JWT string from generateToken()
 */
export const sendTokenCookie = (res, token) => {
  const maxAge = parseExpiry(process.env.JWT_EXPIRES_IN || "7d");

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: isProduction,
    // "none" required for cross-domain cookies (Vercel frontend → Render backend)
    // "strict" is fine for local dev (same origin)
    sameSite: isProduction ? "none" : "strict",
    maxAge,
  });
};
