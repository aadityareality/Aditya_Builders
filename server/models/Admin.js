import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

/**
 * Admin Schema
 * Represents an authenticated administrator of the Aditya Builders CMS.
 * Passwords are NEVER returned by default queries (select: false).
 * Hashing is handled automatically via a pre-save hook.
 */
const adminSchema = new Schema(
  {
    /** Full display name of the admin */
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
    },

    /** Unique email used for login — stored lowercase */
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/,
        "Please provide a valid email address",
      ],
    },

    /**
     * Hashed password — select: false ensures it is NEVER included in
     * query results unless explicitly requested with .select("+password").
     */
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    /**
     * Role-based access control.
     * "superadmin" — full access including admin user management.
     * "editor"     — can manage content but not other admin accounts.
     */
    role: {
      type: String,
      enum: ["superadmin", "editor", "executive", "manager"],
      default: "superadmin",
    },

    /** Timestamp of the most recent successful login — used for audit trail */
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ─── Pre-Save Hook: Hash password before saving ───────────────────────────────
adminSchema.pre("save", async function (next) {
  // Only hash if the password field was actually modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance Method: Compare candidate password with stored hash ─────────────
/**
 * @param {string} candidatePassword — plain-text password from login form
 * @returns {Promise<boolean>} true if passwords match, false otherwise
 */
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
